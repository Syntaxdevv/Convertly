import { useEffect, useRef, useState } from "react";
import type { ChangeEvent, DragEvent } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Download,
  Image,
  RefreshCw,
  UploadCloud,
  X,
} from "lucide-react";

const MAX_FILE_SIZE = 20 * 1024 * 1024;
const MAX_DIMENSION = 4096;

function getSvgDimensions(svg: SVGSVGElement) {
  const viewBox = svg.getAttribute("viewBox");

  let width = Number.parseFloat(svg.getAttribute("width") || "");
  let height = Number.parseFloat(svg.getAttribute("height") || "");

  if ((!width || !height) && viewBox) {
    const values = viewBox
      .trim()
      .split(/[\s,]+/)
      .map(Number);

    if (values.length === 4 && values.every(Number.isFinite)) {
      width = width || values[2];
      height = height || values[3];
    }
  }

  width = width > 0 ? width : 1200;
  height = height > 0 ? height : 1200;

  const scale = Math.min(1, MAX_DIMENSION / Math.max(width, height));

  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

function sanitizeSvg(svgText: string) {
  const parser = new DOMParser();
  const document = parser.parseFromString(svgText, "image/svg+xml");

  if (document.querySelector("parsererror")) {
    throw new Error("Invalid SVG file. Please select a valid SVG image.");
  }

  const svg = document.documentElement;

  if (svg.localName.toLowerCase() !== "svg") {
    throw new Error("The selected file is not a valid SVG image.");
  }

  const forbiddenElements = [
    "script",
    "foreignObject",
    "iframe",
    "object",
    "embed",
    "audio",
    "video",
  ];

  document.querySelectorAll(forbiddenElements.join(",")).forEach((element) => {
    element.remove();
  });

  document.querySelectorAll("*").forEach((element) => {
    Array.from(element.attributes).forEach((attribute) => {
      const name = attribute.name.toLowerCase();
      const value = attribute.value.trim();

      if (name.startsWith("on")) {
        element.removeAttribute(attribute.name);
        return;
      }

      if (name === "href" || name.endsWith(":href")) {
        const isSafeReference =
          value.startsWith("#") ||
          /^data:image\/(png|jpeg|jpg|gif|webp);base64,/i.test(value);

        if (!isSafeReference) {
          element.removeAttribute(attribute.name);
        }

        return;
      }

      if (
        name === "style" &&
        /url\s*\(\s*['"]?(?!#|data:image\/)/i.test(value)
      ) {
        element.removeAttribute(attribute.name);
      }
    });
  });

  document.querySelectorAll("style").forEach((style) => {
    if (
      /@import|url\s*\(\s*['"]?(?!#|data:image\/)/i.test(
        style.textContent || "",
      )
    ) {
      style.remove();
    }
  });

  return {
    svgText: new XMLSerializer().serializeToString(svg),
    dimensions: getSvgDimensions(svg as unknown as SVGSVGElement),
  };
}

export default function SVGToPNG() {
  const inputRef = useRef<HTMLInputElement>(null);
  const previewUrlRef = useRef<string | null>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [convertedUrl, setConvertedUrl] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
      }
    };
  }, []);

  const clearConvertedResult = () => {
    setConvertedUrl((currentUrl) => {
      if (currentUrl) {
        URL.revokeObjectURL(currentUrl);
      }

      return "";
    });

    setSuccess("");
  };

  const handleFile = async (file?: File) => {
    if (!file) return;

    setError("");
    setSuccess("");
    clearConvertedResult();

    const isSvg =
      file.type === "image/svg+xml" || file.name.toLowerCase().endsWith(".svg");

    if (!isSvg) {
      setError("Please select an SVG file.");
      return;
    }

    if (file.size === 0) {
      setError("The selected file is empty.");
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError("File size exceeds the 20MB limit.");
      return;
    }

    try {
      const text = await file.text();
      const sanitized = sanitizeSvg(text);

      const blob = new Blob([sanitized.svgText], {
        type: "image/svg+xml",
      });

      const newPreviewUrl = URL.createObjectURL(blob);

      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
      }

      previewUrlRef.current = newPreviewUrl;

      setSelectedFile(file);
      setPreviewUrl(newPreviewUrl);
    } catch (err) {
      setSelectedFile(null);
      setPreviewUrl("");
      setError(
        err instanceof Error ? err.message : "Unable to read this SVG file.",
      );
    }
  };

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (file) {
      void handleFile(file);
    }

    event.target.value = "";
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);

    const file = event.dataTransfer.files?.[0];

    if (file) {
      void handleFile(file);
    }
  };

  const convertImage = async () => {
    if (!selectedFile || !previewUrl) return;

    setIsConverting(true);
    setError("");
    setSuccess("");
    clearConvertedResult();

    try {
      const svgText = await selectedFile.text();
      const sanitized = sanitizeSvg(svgText);

      const blob = new Blob([sanitized.svgText], {
        type: "image/svg+xml",
      });

      const svgUrl = URL.createObjectURL(blob);

      try {
        const image = new window.Image();

        await new Promise<void>((resolve, reject) => {
          image.onload = () => resolve();
          image.onerror = () =>
            reject(new Error("Unable to load the SVG image."));
          image.src = svgUrl;
        });

        const canvas = document.createElement("canvas");
        canvas.width = sanitized.dimensions.width;
        canvas.height = sanitized.dimensions.height;

        const context = canvas.getContext("2d");

        if (!context) {
          throw new Error("Your browser could not process this image.");
        }

        context.drawImage(image, 0, 0, canvas.width, canvas.height);

        const pngBlob = await new Promise<Blob>((resolve, reject) => {
          canvas.toBlob((result) => {
            if (result) {
              resolve(result);
            } else {
              reject(new Error("PNG conversion failed."));
            }
          }, "image/png");
        });

        const resultUrl = URL.createObjectURL(pngBlob);

        setConvertedUrl(resultUrl);
        setSuccess("Your SVG image has been converted to PNG.");
      } finally {
        URL.revokeObjectURL(svgUrl);
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong during conversion.",
      );
    } finally {
      setIsConverting(false);
    }
  };

  const downloadImage = () => {
    if (!convertedUrl || !selectedFile) return;

    const originalName = selectedFile.name.replace(/\.svg$/i, "");
    const link = document.createElement("a");

    link.href = convertedUrl;
    link.download = `${originalName}.png`;

    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const resetConverter = () => {
    clearConvertedResult();

    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }

    setSelectedFile(null);
    setPreviewUrl("");
    setError("");
    setSuccess("");

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const formatFileSize = (bytes: number) => {
    return bytes < 1024 * 1024
      ? `${(bytes / 1024).toFixed(1)} KB`
      : `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="min-h-[calc(100dvh-76px)] w-full px-5 py-8 text-[#202124]">
      <main className="mx-auto w-full max-w-5xl">
        <section className="mb-6">
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            SVG to PNG
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500 sm:text-base">
            Convert SVG vector images into PNG files directly in your browser.
            Your files are processed locally without uploading them to an
            external service.
          </p>
        </section>

        <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-7">
          {!selectedFile ? (
            <div
              onDragOver={(event) => {
                event.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => inputRef.current?.click()}
              className={`flex min-h-[250px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-5 text-center transition ${
                isDragging
                  ? "border-[#C62828] bg-red-50"
                  : "border-gray-300 bg-[#FAFAFA] hover:border-[#C62828] hover:bg-red-50/40"
              }`}
            >
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-red-50 text-[#C62828]">
                <UploadCloud size={27} />
              </div>

              <h2 className="text-base font-bold text-gray-800">
                Drop your SVG file here
              </h2>

              <p className="mt-2 text-sm text-gray-500">
                or click to browse your files
              </p>

              <span className="mt-4 rounded-lg bg-[#C62828] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#A91F1F]">
                Choose SVG File
              </span>

              <p className="mt-4 text-xs text-gray-400">
                SVG format only · Maximum file size 20 MB
              </p>
            </div>
          ) : (
            <div className="grid gap-6 lg:grid-cols-[1fr_240px]">
              <div className="min-w-0">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-sm font-bold text-gray-800">
                    Selected image
                  </h2>

                  <button
                    type="button"
                    onClick={resetConverter}
                    disabled={isConverting}
                    className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 transition hover:text-red-600 disabled:opacity-40"
                  >
                    <X size={14} />
                    Remove
                  </button>
                </div>

                <div className="flex min-h-[260px] items-center justify-center overflow-hidden rounded-xl border border-gray-200 bg-[#F7F8FA] p-4">
                  <img
                    src={previewUrl}
                    alt="SVG preview"
                    className="max-h-[320px] max-w-full object-contain"
                  />
                </div>

                <div className="mt-4 flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-50 text-[#C62828]">
                    <Image size={20} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-gray-800">
                      {selectedFile.name}
                    </p>

                    <p className="mt-1 text-xs text-gray-400">
                      {formatFileSize(selectedFile.size)} · SVG image
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col">
                <div className="rounded-xl border border-gray-200 p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-gray-400">
                    Output format
                  </p>

                  <div className="mt-4 flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-red-50 text-[#C62828]">
                      <Image size={22} />
                    </div>

                    <div>
                      <p className="text-sm font-bold text-gray-800">PNG</p>

                      <p className="text-xs text-gray-400">
                        Portable Network Graphics
                      </p>
                    </div>
                  </div>

                  <div className="my-4 border-t border-gray-200" />

                  <p className="text-xs leading-5 text-gray-500">
                    Your SVG will be rendered as a PNG image with a maximum
                    dimension of 4096 pixels.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={convertImage}
                  disabled={isConverting}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-[#C62828] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#A91F1F] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isConverting ? (
                    <>
                      <RefreshCw size={17} className="animate-spin" />
                      Converting...
                    </>
                  ) : (
                    <>
                      <Image size={17} />
                      Convert to PNG
                    </>
                  )}
                </button>

                {convertedUrl && (
                  <button
                    type="button"
                    onClick={downloadImage}
                    className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-[#15803D] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#166534]"
                  >
                    <Download size={17} />
                    Download PNG
                  </button>
                )}
              </div>
            </div>
          )}

          {error && (
            <div className="mt-5 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              <AlertCircle size={17} className="mt-0.5 shrink-0" />
              <p>{error}</p>
            </div>
          )}

          {success && (
            <div className="mt-5 flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
              <CheckCircle2 size={17} />
              <span>{success}</span>
            </div>
          )}

          {selectedFile && (
            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                disabled={isConverting}
                className="text-xs font-semibold text-gray-500 transition hover:text-[#C62828] disabled:opacity-40"
              >
                Choose another image
              </button>
            </div>
          )}

          <input
            ref={inputRef}
            type="file"
            accept=".svg,image/svg+xml"
            onChange={handleInputChange}
            className="hidden"
          />
        </section>

        <section className="mt-6 rounded-xl border border-gray-200 bg-white p-5 sm:p-6">
          <h2 className="text-sm font-bold text-gray-800">
            How to convert SVG to PNG
          </h2>

          <ol className="mt-3 space-y-2 text-sm leading-6 text-gray-500">
            <li>1. Select or drag your SVG file into the upload area.</li>
            <li>2. Click Convert to PNG.</li>
            <li>3. Download your converted PNG image.</li>
          </ol>
        </section>
      </main>
    </div>
  );
}

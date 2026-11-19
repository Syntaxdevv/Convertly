import { useEffect, useRef, useState } from "react";
import type { ChangeEvent, DragEvent } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Download,
  Lock,
  LockOpen,
  Maximize2,
  RefreshCw,
  UploadCloud,
  X,
} from "lucide-react";

const MAX_FILE_SIZE = 20 * 1024 * 1024;
const MAX_DIMENSION = 8192;

type OutputFormat = "image/jpeg" | "image/png" | "image/webp";

export default function ImageResizer() {
  const inputRef = useRef<HTMLInputElement>(null);
  const previewRef = useRef<string | null>(null);
  const resultRef = useRef<string | null>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [convertedUrl, setConvertedUrl] = useState("");

  const [originalWidth, setOriginalWidth] = useState(0);
  const [originalHeight, setOriginalHeight] = useState(0);
  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(0);

  const [keepRatio, setKeepRatio] = useState(true);
  const [format, setFormat] = useState<OutputFormat>("image/png");
  const [quality, setQuality] = useState(90);

  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    return () => {
      if (previewRef.current) {
        URL.revokeObjectURL(previewRef.current);
      }

      if (resultRef.current) {
        URL.revokeObjectURL(resultRef.current);
      }
    };
  }, []);

  const clearResult = () => {
    if (resultRef.current) {
      URL.revokeObjectURL(resultRef.current);
      resultRef.current = null;
    }

    setConvertedUrl("");
    setSuccess("");
  };

  const handleFile = (file?: File) => {
    if (!file || isResizing) return;

    setError("");

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

    if (!allowedTypes.includes(file.type)) {
      setError("Please select a JPG, PNG, or WEBP image.");
      return;
    }

    if (file.size === 0) {
      setError("The selected image is empty.");
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError("File size exceeds the 20MB limit.");
      return;
    }

    const newPreview = URL.createObjectURL(file);
    const image = new window.Image();

    image.onload = () => {
      if (
        image.naturalWidth > MAX_DIMENSION ||
        image.naturalHeight > MAX_DIMENSION
      ) {
        URL.revokeObjectURL(newPreview);
        setError(
          `Original image dimensions must not exceed ${MAX_DIMENSION}px per side.`,
        );
        return;
      }

      if (previewRef.current) {
        URL.revokeObjectURL(previewRef.current);
      }

      previewRef.current = newPreview;

      clearResult();

      setSelectedFile(file);
      setPreviewUrl(newPreview);

      setOriginalWidth(image.naturalWidth);
      setOriginalHeight(image.naturalHeight);

      setWidth(image.naturalWidth);
      setHeight(image.naturalHeight);

      setFormat(file.type as OutputFormat);
    };

    image.onerror = () => {
      URL.revokeObjectURL(newPreview);
      setError("Unable to read this image file.");
    };

    image.src = newPreview;
  };

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (file) handleFile(file);

    event.target.value = "";
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);

    if (isResizing) return;

    const file = event.dataTransfer.files?.[0];

    if (file) handleFile(file);
  };

  const handleWidthChange = (value: string) => {
    const newWidth = value === "" ? 0 : Number(value);

    setWidth(newWidth);

    if (keepRatio && originalWidth > 0 && newWidth > 0) {
      setHeight(Math.round((newWidth / originalWidth) * originalHeight));
    } else if (value === "") {
      setHeight(0);
    }

    clearResult();
  };

  const handleHeightChange = (value: string) => {
    const newHeight = value === "" ? 0 : Number(value);

    setHeight(newHeight);

    if (keepRatio && originalHeight > 0 && newHeight > 0) {
      setWidth(Math.round((newHeight / originalHeight) * originalWidth));
    } else if (value === "") {
      setWidth(0);
    }

    clearResult();
  };

  const resetDimensions = () => {
    setWidth(originalWidth);
    setHeight(originalHeight);
    setError("");
    clearResult();
  };

  const resizeImage = async () => {
    if (!selectedFile || !previewUrl || isResizing) return;

    setError("");
    clearResult();

    if (
      !Number.isInteger(width) ||
      !Number.isInteger(height) ||
      width < 1 ||
      height < 1
    ) {
      setError("Please enter valid image dimensions.");
      return;
    }

    if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
      setError(`Maximum allowed dimension is ${MAX_DIMENSION}px per side.`);
      return;
    }

    setIsResizing(true);

    try {
      const image = new window.Image();

      await new Promise<void>((resolve, reject) => {
        image.onload = () => resolve();
        image.onerror = () =>
          reject(new Error("Unable to load the selected image."));
        image.src = previewUrl;
      });

      const canvas = document.createElement("canvas");

      canvas.width = width;
      canvas.height = height;

      const context = canvas.getContext("2d");

      if (!context) {
        throw new Error("Your browser could not process this image.");
      }

      if (format === "image/jpeg") {
        context.fillStyle = "#FFFFFF";
        context.fillRect(0, 0, width, height);
      }

      context.drawImage(image, 0, 0, width, height);

      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (result) => {
            if (result) resolve(result);
            else reject(new Error("Image resizing failed."));
          },
          format,
          format === "image/png" ? undefined : quality / 100,
        );
      });

      if (blob.type !== format) {
        throw new Error(
          "Your browser does not support the selected output format.",
        );
      }

      const result = URL.createObjectURL(blob);
      resultRef.current = result;

      setConvertedUrl(result);
      setSuccess(`Image resized successfully to ${width} × ${height} pixels.`);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while resizing.",
      );
    } finally {
      setIsResizing(false);
    }
  };

  const downloadImage = () => {
    if (!convertedUrl || !selectedFile) return;

    const extension =
      format === "image/jpeg" ? "jpg" : format === "image/png" ? "png" : "webp";

    const originalName = selectedFile.name.replace(/\.[^.]+$/, "");

    const link = document.createElement("a");
    link.href = convertedUrl;
    link.download = `${originalName}-${width}x${height}.${extension}`;

    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const resetConverter = () => {
    if (isResizing) return;

    clearResult();

    if (previewRef.current) {
      URL.revokeObjectURL(previewRef.current);
      previewRef.current = null;
    }

    setSelectedFile(null);
    setPreviewUrl("");

    setOriginalWidth(0);
    setOriginalHeight(0);

    setWidth(0);
    setHeight(0);

    setError("");
    setSuccess("");

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;

    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }

    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="min-h-[calc(100dvh-76px)] w-full px-5 py-8 text-[#202124]">
      <main className="mx-auto w-full max-w-5xl py-4 sm:py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Image Resizer
          </h1>

          <p className="mt-2 text-sm leading-6 text-[#6B7280]">
            Resize images to your preferred width and height.
          </p>
        </div>

        <div className="rounded-xl border border-[#E5E7EB] bg-white p-5 sm:p-7">
          {!selectedFile ? (
            <div
              onDragOver={(event) => {
                event.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => inputRef.current?.click()}
              className={`flex min-h-[280px] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-5 py-10 text-center transition ${
                isDragging
                  ? "border-[#C62828] bg-red-50"
                  : "border-[#D1D5DB] bg-[#FAFAFA] hover:border-[#C62828] hover:bg-red-50/30"
              }`}
            >
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#FEF2F2] text-[#C62828]">
                <UploadCloud size={27} />
              </div>

              <h2 className="text-base font-semibold">Drop your image here</h2>

              <p className="mt-2 text-sm text-[#6B7280]">
                or click to browse your files
              </p>

              <span className="mt-5 rounded-lg bg-[#C62828] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#A91F1F]">
                Choose Image
              </span>

              <p className="mt-4 text-xs text-[#9CA3AF]">
                JPG, PNG, WEBP · Maximum file size: 20MB
              </p>
            </div>
          ) : (
            <div className="grid gap-7 md:grid-cols-2">
              <div>
                <div className="flex min-h-[280px] items-center justify-center rounded-lg border border-[#E5E7EB] bg-[#FAFAFA] p-5">
                  <img
                    src={previewUrl}
                    alt="Original image preview"
                    className="max-h-[320px] max-w-full object-contain"
                  />
                </div>

                <div className="mt-4 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="break-all text-sm font-semibold">
                      {selectedFile.name}
                    </p>

                    <p className="mt-1 text-xs text-[#6B7280]">
                      {originalWidth} × {originalHeight} px ·{" "}
                      {formatSize(selectedFile.size)}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={resetConverter}
                    disabled={isResizing}
                    className="rounded-md p-2 text-[#6B7280] transition hover:bg-[#F1F3F4] hover:text-[#202124] disabled:cursor-not-allowed disabled:opacity-50"
                    aria-label="Remove image"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              <div>
                <h2 className="text-sm font-semibold">Resize Dimensions</h2>

                <p className="mt-1 text-xs text-[#6B7280]">
                  Original: {originalWidth} × {originalHeight} px
                </p>

                <div className="mt-5 grid grid-cols-2 gap-3">
                  <div>
                    <label
                      htmlFor="image-width"
                      className="mb-2 block text-sm font-medium"
                    >
                      Width (px)
                    </label>

                    <input
                      id="image-width"
                      type="number"
                      min="1"
                      max={MAX_DIMENSION}
                      value={width || ""}
                      disabled={isResizing}
                      onChange={(event) =>
                        handleWidthChange(event.target.value)
                      }
                      className="w-full rounded-lg border border-[#D1D5DB] px-3 py-3 text-sm outline-none transition focus:border-[#C62828] disabled:bg-gray-100"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="image-height"
                      className="mb-2 block text-sm font-medium"
                    >
                      Height (px)
                    </label>

                    <input
                      id="image-height"
                      type="number"
                      min="1"
                      max={MAX_DIMENSION}
                      value={height || ""}
                      disabled={isResizing}
                      onChange={(event) =>
                        handleHeightChange(event.target.value)
                      }
                      className="w-full rounded-lg border border-[#D1D5DB] px-3 py-3 text-sm outline-none transition focus:border-[#C62828] disabled:bg-gray-100"
                    />
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between gap-3 rounded-lg border border-[#E5E7EB] p-3">
                  <div className="flex items-center gap-2">
                    {keepRatio ? (
                      <Lock size={16} className="text-[#C62828]" />
                    ) : (
                      <LockOpen size={16} className="text-[#6B7280]" />
                    )}

                    <div>
                      <p className="text-sm font-medium">
                        Maintain aspect ratio
                      </p>
                      <p className="text-xs text-[#6B7280]">
                        Keep original proportions
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setKeepRatio((previous) => !previous);
                      clearResult();
                    }}
                    disabled={isResizing}
                    className={`relative h-6 w-11 rounded-full transition disabled:cursor-not-allowed disabled:opacity-50 ${
                      keepRatio ? "bg-[#C62828]" : "bg-[#D1D5DB]"
                    }`}
                    role="switch"
                    aria-checked={keepRatio}
                    aria-label="Maintain aspect ratio"
                  >
                    <span
                      className={`absolute top-1 h-4 w-4 rounded-full bg-white transition ${
                        keepRatio ? "left-6" : "left-1"
                      }`}
                    />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={resetDimensions}
                  disabled={isResizing}
                  className="mt-3 text-sm font-medium text-[#C62828] transition hover:underline disabled:opacity-50"
                >
                  Reset dimensions
                </button>

                <div className="mt-6">
                  <label
                    htmlFor="resize-format"
                    className="mb-2 block text-sm font-medium"
                  >
                    Output Format
                  </label>

                  <select
                    id="resize-format"
                    value={format}
                    disabled={isResizing}
                    onChange={(event) => {
                      setFormat(event.target.value as OutputFormat);
                      clearResult();
                    }}
                    className="w-full rounded-lg border border-[#D1D5DB] bg-white px-3 py-3 text-sm outline-none transition focus:border-[#C62828] disabled:bg-gray-100"
                  >
                    <option value="image/jpeg">JPG</option>
                    <option value="image/png">PNG</option>
                    <option value="image/webp">WEBP</option>
                  </select>
                </div>

                {format !== "image/png" && (
                  <div className="mt-5">
                    <div className="mb-2 flex items-center justify-between">
                      <label
                        htmlFor="resize-quality"
                        className="text-sm font-medium"
                      >
                        Image Quality
                      </label>

                      <span className="text-sm font-semibold text-[#C62828]">
                        {quality}%
                      </span>
                    </div>

                    <input
                      id="resize-quality"
                      type="range"
                      min="10"
                      max="100"
                      step="5"
                      value={quality}
                      disabled={isResizing}
                      onChange={(event) => {
                        setQuality(Number(event.target.value));
                        clearResult();
                      }}
                      className="w-full accent-[#C62828] disabled:opacity-50"
                    />
                  </div>
                )}

                <button
                  type="button"
                  onClick={resizeImage}
                  disabled={isResizing}
                  className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-[#C62828] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#A91F1F] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isResizing ? (
                    <>
                      <RefreshCw size={17} className="animate-spin" />
                      Resizing...
                    </>
                  ) : (
                    <>
                      <Maximize2 size={17} />
                      Resize Image
                    </>
                  )}
                </button>

                {convertedUrl && (
                  <button
                    type="button"
                    onClick={downloadImage}
                    className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-[#D1D5DB] bg-white px-5 py-3 text-sm font-semibold transition hover:bg-[#F8F9FA]"
                  >
                    <Download size={17} />
                    Download Resized Image
                  </button>
                )}
              </div>
            </div>
          )}

          {error && (
            <div className="mt-5 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <AlertCircle size={17} className="mt-0.5 shrink-0" />
              <p>{error}</p>
            </div>
          )}

          {success && (
            <div className="mt-5 flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
              <CheckCircle2 size={17} />
              {success}
            </div>
          )}
        </div>

        <div className="mt-6 rounded-lg border border-[#E5E7EB] bg-white p-5">
          <h2 className="text-sm font-semibold">About this tool</h2>

          <p className="mt-2 text-sm leading-6 text-[#6B7280]">
            Image Resizer lets you specify custom image dimensions. Enable
            Maintain Aspect Ratio to preserve the original proportions, or
            disable it to set width and height independently. Images are
            processed locally in your browser.
          </p>
        </div>
      </main>

      <input
        ref={inputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
        onChange={handleInputChange}
        className="hidden"
      />
    </div>
  );
}

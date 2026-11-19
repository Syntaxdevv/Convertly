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

export default function JPGToWEBP() {
  const inputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [convertedUrl, setConvertedUrl] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
      if (convertedUrl) URL.revokeObjectURL(convertedUrl);
    };
  }, [preview, convertedUrl]);

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const clearResults = () => {
    setPreview("");
    setConvertedUrl("");
    setSuccess(false);
  };

  const handleFile = (file?: File) => {
    if (!file) return;

    if (isProcessing) return;

    clearResults();
    setError("");

    if (file.type !== "image/jpeg") {
      setSelectedFile(null);
      setError("Please select a JPG or JPEG image.");
      return;
    }

    if (file.size === 0) {
      setSelectedFile(null);
      setError("The selected file is empty.");
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setSelectedFile(null);
      setError("Image size must not exceed 20 MB.");
      return;
    }

    setSelectedFile(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    handleFile(event.target.files?.[0]);
    event.target.value = "";
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    handleFile(event.dataTransfer.files?.[0]);
  };

  const convertImage = async () => {
    if (!selectedFile || isProcessing) return;

    setError("");
    setIsProcessing(true);

    let imageUrl = "";

    try {
      const image = new window.Image();

      imageUrl = URL.createObjectURL(selectedFile);
      image.src = imageUrl;

      await new Promise<void>((resolve, reject) => {
        image.onload = () => resolve();
        image.onerror = () =>
          reject(new Error("Unable to read this JPG image."));
      });

      const canvas = document.createElement("canvas");
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;

      const context = canvas.getContext("2d");

      if (!context) {
        throw new Error("Your browser does not support image conversion.");
      }

      context.drawImage(image, 0, 0);

      const webpBlob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error("Failed to convert image to WEBP."));
            }
          },
          "image/webp",
          0.92,
        );
      });

      if (webpBlob.type !== "image/webp") {
        throw new Error("WEBP conversion is not supported by your browser.");
      }

      setConvertedUrl(URL.createObjectURL(webpBlob));
      setSuccess(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong during conversion.",
      );
    } finally {
      if (imageUrl) URL.revokeObjectURL(imageUrl);
      setIsProcessing(false);
    }
  };

  const downloadImage = () => {
    if (!convertedUrl || !selectedFile) return;

    const originalName = selectedFile.name.replace(/\.[^/.]+$/, "");
    const link = document.createElement("a");

    link.href = convertedUrl;
    link.download = `${originalName}.webp`;

    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const resetConverter = () => {
    if (isProcessing) return;

    setSelectedFile(null);
    clearResults();
    setError("");
    setIsDragging(false);

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  return (
    <div className="min-h-[calc(100dvh-76px)] w-full px-5 py-8 text-[#202124] sm:px-6">
      <main className="mx-auto w-full max-w-5xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            JPG to WEBP Converter
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-500">
            Convert JPG and JPEG images into modern WEBP format directly in your
            browser. No account or upload required.
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 sm:p-8">
          {!selectedFile ? (
            <div
              onDragOver={(event) => {
                event.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={(event) => {
                if (
                  !event.currentTarget.contains(event.relatedTarget as Node)
                ) {
                  setIsDragging(false);
                }
              }}
              onDrop={handleDrop}
              onClick={() => inputRef.current?.click()}
              className={`flex min-h-64 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-5 text-center transition ${
                isDragging
                  ? "border-[#C62828] bg-red-50"
                  : "border-gray-300 hover:border-[#C62828] hover:bg-red-50/30"
              }`}
            >
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-red-50 text-[#C62828]">
                <UploadCloud size={27} />
              </div>

              <h2 className="text-base font-semibold text-gray-800">
                Drop your JPG image here
              </h2>

              <p className="mt-2 text-sm text-gray-500">
                or click to browse your files
              </p>

              <span className="mt-4 rounded-lg bg-[#C62828] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#A91F1F]">
                Choose JPG Image
              </span>

              <p className="mt-4 text-xs text-gray-400">
                Supported format: JPG, JPEG · Maximum size: 20 MB
              </p>

              <input
                ref={inputRef}
                type="file"
                accept=".jpg,.jpeg,image/jpeg"
                onChange={handleInputChange}
                className="hidden"
              />
            </div>
          ) : (
            <div className="grid gap-7 md:grid-cols-[1fr_220px]">
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-gray-800">
                    Selected Image
                  </h2>

                  <button
                    type="button"
                    onClick={resetConverter}
                    disabled={isProcessing}
                    className="flex items-center gap-1.5 text-xs font-medium text-gray-500 transition hover:text-red-600 disabled:opacity-50"
                  >
                    <X size={14} />
                    Remove
                  </button>
                </div>

                <div className="flex min-h-64 items-center justify-center overflow-hidden rounded-lg border border-gray-200 bg-gray-50 p-4">
                  <img
                    src={preview}
                    alt="Selected JPG preview"
                    className="max-h-72 max-w-full object-contain"
                  />
                </div>

                <div className="mt-4 flex items-center gap-3 rounded-lg border border-gray-200 p-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-50 text-[#C62828]">
                    <Image size={20} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-gray-800">
                      {selectedFile.name}
                    </p>

                    <p className="text-xs text-gray-500">
                      {formatSize(selectedFile.size)} · JPG image
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col justify-center">
                <div className="rounded-lg border border-gray-200 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                    Output Format
                  </p>

                  <div className="mt-3 flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-red-50 text-[#C62828]">
                      <Image size={22} />
                    </div>

                    <div>
                      <p className="text-sm font-bold text-gray-800">WEBP</p>

                      <p className="text-xs text-gray-400">
                        Web Picture Format
                      </p>
                    </div>
                  </div>

                  <div className="my-4 border-t border-gray-200" />

                  <p className="text-xs leading-5 text-gray-500">
                    Conversion happens locally in your browser. Image quality is
                    set to 92%.
                  </p>
                </div>

                {!success ? (
                  <button
                    type="button"
                    onClick={convertImage}
                    disabled={isProcessing}
                    className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-[#C62828] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#A91F1F] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isProcessing ? (
                      <>
                        <RefreshCw size={17} className="animate-spin" />
                        Converting...
                      </>
                    ) : (
                      <>
                        <Image size={17} />
                        Convert to WEBP
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={downloadImage}
                    className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-[#15803D] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#166534]"
                  >
                    <Download size={17} />
                    Download WEBP
                  </button>
                )}
              </div>
            </div>
          )}

          {error && (
            <div className="mt-5 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              <AlertCircle size={18} className="mt-0.5 shrink-0" />
              <p>{error}</p>
            </div>
          )}

          {success && (
            <div className="mt-5 flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700">
              <CheckCircle2 size={18} className="shrink-0" />
              Image converted successfully. Your WEBP file is ready.
            </div>
          )}

          {selectedFile && (
            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                disabled={isProcessing}
                className="text-xs font-medium text-gray-500 transition hover:text-[#C62828] disabled:opacity-50"
              >
                Choose another image
              </button>

              <input
                ref={inputRef}
                type="file"
                accept=".jpg,.jpeg,image/jpeg"
                onChange={handleInputChange}
                className="hidden"
              />
            </div>
          )}
        </div>

        <div className="mt-6 rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-gray-800">
            How to convert JPG to WEBP
          </h2>

          <ol className="mt-3 space-y-2 text-sm text-gray-500">
            <li>1. Select or drag your JPG image into the upload area.</li>
            <li>2. Click Convert to WEBP.</li>
            <li>3. Download your converted WEBP image.</li>
          </ol>
        </div>
      </main>
    </div>
  );
}

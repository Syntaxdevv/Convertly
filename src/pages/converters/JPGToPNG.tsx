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

export default function JPGToPNG() {
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
    if (!file || isProcessing) return;

    setError("");
    clearResults();

    if (!["image/jpeg", "image/jpg"].includes(file.type)) {
      setSelectedFile(null);
      setError("Please select a JPG or JPEG image.");
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setSelectedFile(null);
      setError("Image size must not exceed 20 MB.");
      return;
    }

    if (file.size === 0) {
      setSelectedFile(null);
      setError("The selected file is empty.");
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

    const imageUrl = URL.createObjectURL(selectedFile);

    try {
      const image = new window.Image();
      image.src = imageUrl;

      await new Promise<void>((resolve, reject) => {
        image.onload = () => resolve();
        image.onerror = () => reject(new Error("Unable to read this image."));
      });

      const canvas = document.createElement("canvas");
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;

      const context = canvas.getContext("2d");

      if (!context) {
        throw new Error("Your browser does not support image conversion.");
      }

      context.drawImage(image, 0, 0);

      const pngBlob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
          else reject(new Error("Failed to convert image to PNG."));
        }, "image/png");
      });

      if (pngBlob.type !== "image/png") {
        throw new Error("The browser could not generate a PNG image.");
      }

      setConvertedUrl(URL.createObjectURL(pngBlob));
      setSuccess(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong during conversion.",
      );
    } finally {
      URL.revokeObjectURL(imageUrl);
      setIsProcessing(false);
    }
  };

  const downloadImage = () => {
    if (!convertedUrl || !selectedFile) return;

    const originalName = selectedFile.name.replace(/\.[^/.]+$/, "");
    const link = document.createElement("a");

    link.href = convertedUrl;
    link.download = `${originalName}.png`;
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const resetConverter = () => {
    if (isProcessing) return;

    clearResults();
    setSelectedFile(null);
    setError("");

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  return (
    <div className="min-h-[calc(100dvh-76px)] w-full px-5 py-8 text-[#202124]">
      <main className="mx-auto w-full max-w-5xl py-4 sm:py-8">
        <div className="mb-9">
          <h1 className="text-3xl font-bold tracking-tight text-[#202124] sm:text-4xl">
            JPG to PNG Converter
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#6B7280]">
            Convert JPG and JPEG images into PNG format directly in your
            browser. No account or upload required.
          </p>
        </div>

        <div className="rounded-xl border border-[#E5E7EB] bg-white p-5 sm:p-8">
          {!selectedFile ? (
            <div
              onDragOver={(event) => {
                event.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => inputRef.current?.click()}
              className={`flex min-h-64 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-5 text-center transition ${
                isDragging
                  ? "border-[#C62828] bg-red-50"
                  : "border-[#D1D5DB] hover:border-[#C62828] hover:bg-[#FEF7F7]"
              }`}
            >
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#FEF2F2] text-[#C62828]">
                <UploadCloud size={27} />
              </div>

              <h2 className="text-base font-semibold">
                Drop your JPG image here
              </h2>

              <p className="mt-2 text-sm text-[#6B7280]">
                or click to browse your files
              </p>

              <span className="mt-4 rounded-lg bg-[#C62828] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#A91F1F]">
                Choose JPG Image
              </span>

              <p className="mt-4 text-xs text-[#9CA3AF]">
                Supported format: JPG, JPEG · Maximum size: 20 MB
              </p>
            </div>
          ) : (
            <div className="grid gap-7 md:grid-cols-[1fr_220px]">
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-sm font-semibold">Selected image</h2>

                  <button
                    type="button"
                    onClick={resetConverter}
                    disabled={isProcessing}
                    className="flex items-center gap-1.5 text-xs font-medium text-[#6B7280] transition hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <X size={14} />
                    Remove
                  </button>
                </div>

                <div className="flex min-h-64 items-center justify-center overflow-hidden rounded-lg border border-[#E5E7EB] bg-[#F7F8FA] p-4">
                  <img
                    src={preview}
                    alt="Selected JPG preview"
                    className="max-h-72 max-w-full object-contain"
                  />
                </div>

                <div className="mt-4 flex items-center gap-3 rounded-lg border border-[#E5E7EB] p-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#FEF2F2] text-[#C62828]">
                    <Image size={20} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">
                      {selectedFile.name}
                    </p>
                    <p className="text-xs text-[#9CA3AF]">
                      {formatSize(selectedFile.size)} · JPG image
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col justify-center">
                <div className="rounded-lg border border-[#E5E7EB] p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#9CA3AF]">
                    Output format
                  </p>

                  <div className="mt-3 flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#FEF2F2] text-[#C62828]">
                      <Image size={22} />
                    </div>

                    <div>
                      <p className="text-sm font-bold">PNG</p>
                      <p className="text-xs text-[#9CA3AF]">
                        Portable Network Graphics
                      </p>
                    </div>
                  </div>

                  <div className="my-4 border-t border-[#E5E7EB]" />

                  <p className="text-xs leading-5 text-[#6B7280]">
                    Your image is processed locally in your browser. It is not
                    uploaded to a server.
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
                        Convert to PNG
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
              Image converted successfully. Your PNG file is ready.
            </div>
          )}

          {selectedFile && (
            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                disabled={isProcessing}
                className="text-xs font-medium text-[#6B7280] transition hover:text-[#C62828] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Choose another image
              </button>
            </div>
          )}

          <input
            ref={inputRef}
            type="file"
            accept=".jpg,.jpeg,image/jpeg"
            onChange={handleInputChange}
            className="hidden"
          />
        </div>

        <div className="mt-6 rounded-lg border border-[#E5E7EB] bg-white p-5">
          <h2 className="text-sm font-semibold">How to convert JPG to PNG</h2>

          <ol className="mt-3 space-y-2 text-sm text-[#6B7280]">
            <li>1. Select or drag your JPG image into the upload area.</li>
            <li>2. Click Convert to PNG.</li>
            <li>3. Download your converted PNG image.</li>
          </ol>
        </div>
      </main>
    </div>
  );
}

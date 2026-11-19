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

export default function WEBPToPNG() {
  const inputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [convertedUrl, setConvertedUrl] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
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

    setError("");
    setSuccess(false);

    if (file.type !== "image/webp") {
      setSelectedFile(null);
      clearResults();
      setError("Please select a WEBP image.");
      return;
    }

    if (file.size === 0) {
      setSelectedFile(null);
      clearResults();
      setError("The selected file is empty.");
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setSelectedFile(null);
      clearResults();
      setError("Image size must not exceed 20 MB.");
      return;
    }

    clearResults();
    setSelectedFile(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    handleFile(event.target.files?.[0]);
    event.target.value = "";
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    handleFile(event.dataTransfer.files?.[0]);
  };

  const convertImage = async () => {
    if (!selectedFile) return;

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
          reject(new Error("Unable to read this WEBP image."));
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

      setConvertedUrl(URL.createObjectURL(pngBlob));
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
    link.download = `${originalName}.png`;

    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const resetConverter = () => {
    clearResults();
    setSelectedFile(null);
    setError("");

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  return (
    <div className="min-h-[calc(100dvh-76px)] w-full px-5 py-8 text-[#202124]">
      <main className="mx-auto w-full max-w-5xl">
        <section className="mb-6">
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            WEBP to PNG
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500 sm:text-base">
            Convert WEBP images into PNG format directly in your browser. No
            account or upload required.
          </p>
        </section>

        <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-7">
          {!selectedFile ? (
            <div
              onDragOver={(event) => event.preventDefault()}
              onDrop={handleDrop}
              onClick={() => inputRef.current?.click()}
              className="flex min-h-[250px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-[#FAFAFA] px-5 text-center transition hover:border-[#C62828] hover:bg-red-50/40"
            >
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-red-50 text-[#C62828]">
                <UploadCloud size={27} />
              </div>

              <h2 className="text-base font-bold text-gray-800">
                Drop your WEBP image here
              </h2>

              <p className="mt-2 text-sm text-gray-500">
                or click to browse your files
              </p>

              <span className="mt-4 rounded-lg bg-[#C62828] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#A91F1F]">
                Choose WEBP Image
              </span>

              <p className="mt-4 text-xs text-gray-400">
                WEBP format only · Maximum file size 20 MB
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
                    disabled={isProcessing}
                    className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 transition hover:text-red-600 disabled:opacity-40"
                  >
                    <X size={14} />
                    Remove
                  </button>
                </div>

                <div className="flex min-h-[260px] items-center justify-center overflow-hidden rounded-xl border border-gray-200 bg-[#F7F8FA] p-4">
                  <img
                    src={preview}
                    alt="Selected WEBP preview"
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
                      {formatSize(selectedFile.size)} · WEBP image
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
                    PNG supports transparency. Conversion happens locally in
                    your browser.
                  </p>
                </div>

                {!success ? (
                  <button
                    type="button"
                    onClick={convertImage}
                    disabled={isProcessing}
                    className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-[#C62828] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#A91F1F] disabled:cursor-not-allowed disabled:opacity-60"
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
                    className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-[#15803D] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#166534]"
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
              <span>Image converted successfully. Your PNG file is ready.</span>
            </div>
          )}

          {selectedFile && (
            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                disabled={isProcessing}
                className="text-xs font-semibold text-gray-500 transition hover:text-[#C62828] disabled:opacity-40"
              >
                Choose another image
              </button>
            </div>
          )}

          <input
            ref={inputRef}
            type="file"
            accept=".webp,image/webp"
            onChange={handleInputChange}
            className="hidden"
          />
        </section>

        <section className="mt-6 rounded-xl border border-gray-200 bg-white p-5 sm:p-6">
          <h2 className="text-sm font-bold text-gray-800">
            How to convert WEBP to PNG
          </h2>

          <ol className="mt-3 space-y-2 text-sm leading-6 text-gray-500">
            <li>1. Select or drag your WEBP image into the upload area.</li>
            <li>2. Click Convert to PNG.</li>
            <li>3. Download your converted PNG image.</li>
          </ol>
        </section>
      </main>
    </div>
  );
}

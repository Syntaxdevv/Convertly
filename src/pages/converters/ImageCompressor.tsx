import { useEffect, useRef, useState } from "react";
import type { ChangeEvent, DragEvent } from "react";
import {
  CheckCircle2,
  Download,
  Minimize2,
  RefreshCw,
  UploadCloud,
  X,
} from "lucide-react";

const MAX_FILE_SIZE = 20 * 1024 * 1024;

type OutputFormat = "image/jpeg" | "image/png" | "image/webp";

const formatOptions: { label: string; value: OutputFormat }[] = [
  { label: "JPG", value: "image/jpeg" },
  { label: "PNG", value: "image/png" },
  { label: "WEBP", value: "image/webp" },
];

export default function ImageCompressor() {
  const inputRef = useRef<HTMLInputElement>(null);
  const previewRef = useRef<string | null>(null);
  const resultRef = useRef<string | null>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [convertedUrl, setConvertedUrl] = useState("");
  const [quality, setQuality] = useState(75);
  const [format, setFormat] = useState<OutputFormat>("image/webp");
  const [isDragging, setIsDragging] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [originalSize, setOriginalSize] = useState(0);
  const [compressedSize, setCompressedSize] = useState(0);

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
    setCompressedSize(0);
    setSuccess("");
  };

  const handleFile = (file?: File) => {
    if (!file) return;

    setError("");
    clearResult();

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

    if (previewRef.current) {
      URL.revokeObjectURL(previewRef.current);
    }

    previewRef.current = newPreview;

    setSelectedFile(file);
    setPreviewUrl(newPreview);
    setOriginalSize(file.size);

    setFormat(file.type === "image/jpeg" ? "image/jpeg" : "image/webp");
  };

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (file) handleFile(file);

    event.target.value = "";
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);

    const file = event.dataTransfer.files?.[0];

    if (file) handleFile(file);
  };

  const compressImage = async () => {
    if (!selectedFile || !previewUrl) return;

    setIsCompressing(true);
    setError("");
    clearResult();

    try {
      const image = new Image();

      await new Promise<void>((resolve, reject) => {
        image.onload = () => resolve();
        image.onerror = () =>
          reject(new Error("Unable to load the selected image."));
        image.src = previewUrl;
      });

      const canvas = document.createElement("canvas");
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;

      const context = canvas.getContext("2d");

      if (!context) {
        throw new Error("Your browser could not process this image.");
      }

      if (format === "image/jpeg") {
        context.fillStyle = "#FFFFFF";
        context.fillRect(0, 0, canvas.width, canvas.height);
      }

      context.drawImage(image, 0, 0);

      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (result) => {
            if (result) resolve(result);
            else reject(new Error("Image compression failed."));
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

      const resultUrl = URL.createObjectURL(blob);
      resultRef.current = resultUrl;

      setConvertedUrl(resultUrl);
      setCompressedSize(blob.size);

      const saved = originalSize - blob.size;

      setSuccess(
        saved > 0
          ? `Image compressed successfully. Reduced by ${((saved / originalSize) * 100).toFixed(1)}%.`
          : "Image converted successfully. The output may be larger than the original.",
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong during compression.",
      );
    } finally {
      setIsCompressing(false);
    }
  };

  const downloadImage = () => {
    if (!convertedUrl || !selectedFile) return;

    const extension =
      format === "image/jpeg" ? "jpg" : format === "image/png" ? "png" : "webp";

    const originalName = selectedFile.name.replace(/\.[^.]+$/, "");

    const link = document.createElement("a");
    link.href = convertedUrl;
    link.download = `${originalName}-compressed.${extension}`;

    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const resetConverter = () => {
    clearResult();

    if (previewRef.current) {
      URL.revokeObjectURL(previewRef.current);
      previewRef.current = null;
    }

    setSelectedFile(null);
    setPreviewUrl("");
    setOriginalSize(0);
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

  const getCompressionPercentage = () => {
    if (!originalSize || !compressedSize) return 0;

    return Math.max(0, ((originalSize - compressedSize) / originalSize) * 100);
  };

  return (
    <div className="min-h-[calc(100dvh-76px)] w-full px-5 py-8 text-[#202124]">
      <main className="mx-auto w-full max-w-5xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">
            Image Compressor
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#6B7280]">
            Reduce image file sizes while keeping a usable image quality. Choose
            your preferred output format and compression level.
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
                  : "border-[#D1D5DB] bg-[#FAFAFA] hover:border-[#C62828 hover:bg-red-50/30"
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
            <div className="grid gap-6 md:grid-cols-2">
              <div className="flex min-h-[260px] items-center justify-center rounded-lg border border-[#E5E7EB] bg-[#F7F8FA] p-5">
                <img
                  src={previewUrl}
                  alt="Original image preview"
                  className="max-h-[300px] max-w-full object-contain"
                />
              </div>

              <div className="flex flex-col justify-center">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="break-all text-sm font-semibold">
                      {selectedFile.name}
                    </h2>

                    <p className="mt-1 text-xs text-[#6B7280]">
                      Original size: {formatSize(originalSize)}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={resetConverter}
                    disabled={isCompressing}
                    className="rounded-md p-2 text-[#6B7280] transition hover:bg-[#F1F3F4] hover:text-[#C62828] disabled:opacity-50"
                    aria-label="Remove image"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="mt-6">
                  <div className="mb-2 flex items-center justify-between">
                    <label
                      htmlFor="image-quality"
                      className="text-sm font-medium"
                    >
                      Image Quality
                    </label>

                    <span className="text-sm font-semibold text-[#C62828]">
                      {quality}%
                    </span>
                  </div>

                  <input
                    id="image-quality"
                    type="range"
                    min="10"
                    max="100"
                    step="5"
                    value={quality}
                    onChange={(event) => {
                      setQuality(Number(event.target.value));
                      clearResult();
                    }}
                    className="w-full accent-[#C62828]"
                  />

                  <div className="mt-1 flex justify-between text-xs text-[#9CA3AF]">
                    <span>Smaller file</span>
                    <span>Higher quality</span>
                  </div>
                </div>

                <div className="mt-5">
                  <label
                    htmlFor="output-format"
                    className="mb-2 block text-sm font-medium"
                  >
                    Output Format
                  </label>

                  <select
                    id="output-format"
                    value={format}
                    onChange={(event) => {
                      setFormat(event.target.value as OutputFormat);
                      clearResult();
                    }}
                    className="w-full rounded-lg border border-[#D1D5DB] bg-white px-3 py-3 text-sm outline-none transition focus:border-[#C62828] focus:ring-2 focus:ring-red-100"
                  >
                    {formatOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>

                  {format === "image/png" && (
                    <p className="mt-2 text-xs text-[#9CA3AF]">
                      PNG uses lossless compression. Quality settings do not
                      apply.
                    </p>
                  )}

                  {format === "image/jpeg" && (
                    <p className="mt-2 text-xs text-[#9CA3AF]">
                      Transparent areas will use a white background in JPG
                      output.
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={compressImage}
                  disabled={isCompressing}
                  className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-[#C62828] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#A91F1F] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isCompressing ? (
                    <>
                      <RefreshCw size={17} className="animate-spin" />
                      Compressing...
                    </>
                  ) : (
                    <>
                      <Minimize2 size={17} />
                      Compress Image
                    </>
                  )}
                </button>

                {convertedUrl && (
                  <button
                    type="button"
                    onClick={downloadImage}
                    className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-[#E5E7EB] bg-white px-5 py-3 text-sm font-semibold transition hover:bg-[#F8F9FA]"
                  >
                    <Download size={17} />
                    Download Compressed Image
                  </button>
                )}
              </div>
            </div>
          )}

          {convertedUrl && (
            <div className="mt-6 rounded-lg border border-[#E5E7EB] bg-[#FAFAFA] p-5">
              <h3 className="text-sm font-semibold">Compression Results</h3>

              <div className="mt-4 grid gap-4 sm:grid-cols-3">
                <div>
                  <p className="text-xs text-[#6B7280]">Original Size</p>
                  <p className="mt-1 text-lg font-semibold">
                    {formatSize(originalSize)}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-[#6B7280]">Compressed Size</p>
                  <p className="mt-1 text-lg font-semibold">
                    {formatSize(compressedSize)}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-[#6B7280]">Size Reduction</p>
                  <p className="mt-1 text-lg font-semibold text-green-700">
                    {getCompressionPercentage().toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {success && (
            <div className="mt-5 flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
              <CheckCircle2 size={17} className="shrink-0" />
              {success}
            </div>
          )}
        </div>

        <div className="mt-5 rounded-lg border border-[#E5E7EB] bg-white p-5">
          <h2 className="text-sm font-semibold">About this tool</h2>

          <p className="mt-2 text-sm leading-6 text-[#6B7280]">
            Image Compressor processes your image directly in your browser.
            Choose the output format and adjust quality to control the resulting
            file size. Actual savings depend on the original image and selected
            format. Your images are not uploaded to a server.
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

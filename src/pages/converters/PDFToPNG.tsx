import { useEffect, useRef, useState } from "react";
import type { ChangeEvent, DragEvent } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Download,
  FileText,
  Image,
  LoaderCircle,
  RefreshCw,
  UploadCloud,
  X,
} from "lucide-react";

import { useExternalApiUsage } from "../../hooks/useExternalApiUsage";
import ExternalApiUsage from "../../components/converters/ExternalApiUsage";
import { getDeviceId } from "../../lib/deviceId";

const MAX_FILE_SIZE = 10 * 1024 * 1024;

type ConversionStatus = "idle" | "processing" | "success" | "error";

export default function PDFToPNG() {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    usage,
    isLoading: isUsageLoading,
    usageError,
    refreshUsage,
  } = useExternalApiUsage();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [status, setStatus] = useState<ConversionStatus>("idle");
  const [downloadUrl, setDownloadUrl] = useState("");
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState("");
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    return () => {
      if (downloadUrl) {
        URL.revokeObjectURL(downloadUrl);
      }
    };
  }, [downloadUrl]);

  const validateFile = (file: File): string | null => {
    const isPDF =
      file.type === "application/pdf" ||
      file.name.toLowerCase().endsWith(".pdf");

    if (!isPDF) return "Please select a valid PDF file.";
    if (file.size === 0) return "The selected PDF file is empty.";

    if (file.size > MAX_FILE_SIZE) {
      return "PDF file must not exceed 10 MB.";
    }

    return null;
  };

  const handleFileSelect = (file: File | null) => {
    if (!file) return;

    const validationError = validateFile(file);

    if (validationError) {
      setError(validationError);
      return;
    }

    setDownloadUrl((previousUrl) => {
      if (previousUrl) URL.revokeObjectURL(previousUrl);
      return "";
    });

    setSelectedFile(file);
    setStatus("idle");
    setError("");
    setFileName("");
  };

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (file) handleFileSelect(file);

    event.target.value = "";
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);

    const file = event.dataTransfer.files?.[0];

    if (file) handleFileSelect(file);
  };

  const handleConvert = async () => {
    if (!selectedFile) {
      setError("Please upload a PDF file first.");
      return;
    }

    const validationError = validateFile(selectedFile);

    if (validationError) {
      setError(validationError);
      return;
    }

    if (isUsageLoading) {
      setError("Please wait while we check your daily conversion limit.");
      return;
    }

    if (usageError || !usage) {
      setError(
        "Unable to verify your daily conversion limit. Please try again.",
      );
      return;
    }

    if (usage.remaining <= 0) {
      setError(
        "You have reached your daily conversion limit. Please try again tomorrow.",
      );
      return;
    }

    setStatus("processing");
    setError("");

    try {
      const response = await fetch("/api/pdf-to-png", {
        method: "POST",
        headers: {
          "Content-Type": "application/octet-stream",
          "x-convertly-device-id": getDeviceId(),
        },
        body: selectedFile,
      });

      if (!response.ok) {
        let message = "Unable to convert your PDF file.";

        try {
          const result = await response.json();

          if (result?.message) {
            message = result.message;
          }
        } catch {
          message = "Unable to convert your PDF file.";
        }

        throw new Error(message);
      }

      const blob = await response.blob();

      if (blob.size === 0) {
        throw new Error("The converted ZIP file is empty.");
      }

      const url = URL.createObjectURL(blob);
      const originalName = selectedFile.name.replace(/\.pdf$/i, "");

      setDownloadUrl((previousUrl) => {
        if (previousUrl) URL.revokeObjectURL(previousUrl);
        return url;
      });

      setFileName(`${originalName}-png-images.zip`);
      setStatus("success");
    } catch (err) {
      setStatus("error");

      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong during conversion.",
      );
    } finally {
      await refreshUsage();
    }
  };

  const handleDownload = () => {
    if (!downloadUrl) return;

    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = fileName || "converted-png-images.zip";

    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const handleReset = () => {
    setDownloadUrl((previousUrl) => {
      if (previousUrl) URL.revokeObjectURL(previousUrl);
      return "";
    });

    setSelectedFile(null);
    setStatus("idle");
    setError("");
    setFileName("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }

    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="min-h-[calc(100dvh-76px)] w-full px-5 py-8 text-[#202124]">
      <main className="mx-auto flex w-full max-w-5xl flex-col justify-center">
        <section className="mb-7">
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            PDF to PNG
          </h1>

          <p className="mt-2 text-sm text-gray-500 sm:text-base">
            Convert each page of your PDF document into PNG images.
          </p>
        </section>

        <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-8">
          <ExternalApiUsage
            remaining={usage?.remaining ?? 0}
            limit={usage?.limit ?? 3}
            isLoading={isUsageLoading}
            error={usageError}
          />

          <div className="mb-6">
            <h2 className="text-lg font-bold text-gray-900">
              Upload your document
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Select a PDF file to convert its pages into PNG images.
            </p>
          </div>

          <div
            onDragOver={(event) => {
              event.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={(event) => {
              event.preventDefault();
              setIsDragging(false);
            }}
            onDrop={handleDrop}
            onClick={() => {
              if (status !== "processing") {
                fileInputRef.current?.click();
              }
            }}
            className={`flex min-h-[210px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-5 py-8 text-center transition ${
              isDragging
                ? "border-[#C62828] bg-red-50"
                : "border-gray-300 bg-[#FAFAFA] hover:border-[#C62828] hover:bg-red-50/40"
            } ${status === "processing" ? "cursor-not-allowed opacity-60" : ""}`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,application/pdf"
              onChange={handleInputChange}
              disabled={status === "processing"}
              className="hidden"
            />

            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-red-50 text-[#C62828]">
              <UploadCloud size={28} />
            </div>

            <p className="text-sm font-bold text-gray-800">
              Drop your PDF file here
            </p>

            <p className="mt-1 text-sm text-gray-500">
              or{" "}
              <span className="font-semibold text-[#C62828]">browse files</span>
            </p>

            <p className="mt-3 text-xs text-gray-400">
              PDF format only · Maximum file size 10 MB
            </p>
          </div>

          {selectedFile && (
            <div className="mt-5 flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 p-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-red-50 text-[#C62828]">
                <FileText size={23} />
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-gray-800">
                  {selectedFile.name}
                </p>

                <p className="mt-1 text-xs text-gray-400">
                  {formatFileSize(selectedFile.size)}
                </p>
              </div>

              <button
                type="button"
                onClick={handleReset}
                disabled={status === "processing"}
                className="rounded-md p-2 text-gray-400 transition hover:bg-gray-200 hover:text-gray-700 disabled:opacity-40"
                aria-label="Remove selected file"
              >
                <X size={18} />
              </button>
            </div>
          )}

          {error && (
            <div className="mt-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              <AlertCircle size={17} className="mt-0.5 shrink-0" />
              <p>{error}</p>
            </div>
          )}

          {status === "success" && (
            <div className="mt-4 flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
              <CheckCircle2 size={18} />
              <span className="font-semibold">
                Your PDF pages have been converted successfully.
              </span>
            </div>
          )}

          <div className="mt-6">
            {status !== "success" ? (
              <button
                type="button"
                onClick={handleConvert}
                disabled={
                  !selectedFile ||
                  status === "processing" ||
                  isUsageLoading ||
                  !!usageError ||
                  !usage ||
                  usage.remaining <= 0
                }
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#C62828] px-5 py-3.5 text-sm font-bold text-white transition hover:bg-[#A91F1F] disabled:cursor-not-allowed disabled:bg-gray-300"
              >
                {status === "processing" ? (
                  <>
                    <LoaderCircle size={18} className="animate-spin" />
                    Converting PDF...
                  </>
                ) : (
                  <>
                    <Image size={18} />
                    Convert to PNG
                  </>
                )}
              </button>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={handleDownload}
                  className="flex items-center justify-center gap-2 rounded-lg bg-[#C62828] px-5 py-3.5 text-sm font-bold text-white transition hover:bg-[#A91F1F]"
                >
                  <Download size={18} />
                  Download PNG Images
                </button>

                <button
                  type="button"
                  onClick={handleReset}
                  className="flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-5 py-3.5 text-sm font-semibold text-gray-600 transition hover:bg-gray-50"
                >
                  <RefreshCw size={17} />
                  Convert another file
                </button>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

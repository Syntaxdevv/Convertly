
import { useEffect, useRef, useState } from "react";
import type { ChangeEvent, DragEvent } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  FileText,
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

export default function ExcelToPDF() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const downloadUrlRef = useRef<string | null>(null);

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
      if (downloadUrlRef.current) {
        URL.revokeObjectURL(downloadUrlRef.current);
      }
    };
  }, []);

  const clearDownload = () => {
    if (downloadUrlRef.current) {
      URL.revokeObjectURL(downloadUrlRef.current);
      downloadUrlRef.current = null;
    }

    setDownloadUrl("");
    setFileName("");
  };

  const validateFile = (file: File): string | null => {
    const lowerName = file.name.toLowerCase();
    const isExcel = lowerName.endsWith(".xlsx") || lowerName.endsWith(".xls");

    if (!isExcel) {
      return "Please select a valid Excel file (.xlsx or .xls).";
    }

    if (file.size === 0) {
      return "The selected Excel file is empty.";
    }

    if (file.size > MAX_FILE_SIZE) {
      return "Excel file must not exceed 10 MB.";
    }

    return null;
  };

  const handleFileSelect = (file: File | null) => {
    if (!file || status === "processing") return;

    const validationError = validateFile(file);

    if (validationError) {
      setError(validationError);
      return;
    }

    clearDownload();
    setSelectedFile(file);
    setStatus("idle");
    setError("");
  };

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (file) {
      handleFileSelect(file);
    }

    event.target.value = "";
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);

    if (status === "processing") return;

    const file = event.dataTransfer.files?.[0];

    if (file) {
      handleFileSelect(file);
    }
  };

  const handleConvert = async () => {
    if (!selectedFile) {
      setError("Please upload an Excel file first.");
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

    clearDownload();
    setStatus("processing");
    setError("");

    try {
      const response = await fetch("/api/excel-to-pdf", {
        method: "POST",
        headers: {
          "Content-Type": "application/octet-stream",
          "x-convertly-device-id": getDeviceId(),
        },
        body: selectedFile,
      });

      if (!response.ok) {
        let message = "Unable to convert your Excel file.";

        try {
          const result = await response.json();

          if (result?.message) {
            message = result.message;
          }
        } catch {
          message = "Unable to convert your Excel file.";
        }

        throw new Error(message);
      }

      const blob = await response.blob();

      if (blob.size === 0) {
        throw new Error("The converted PDF file is empty.");
      }

      const url = URL.createObjectURL(blob);
      downloadUrlRef.current = url;

      const originalName = selectedFile.name.replace(/\.(xlsx|xls)$/i, "");

      setDownloadUrl(url);
      setFileName(`${originalName}.pdf`);
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
    link.download = fileName || "converted-document.pdf";

    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const handleReset = () => {
    clearDownload();
    setSelectedFile(null);
    setStatus("idle");
    setError("");
    setIsDragging(false);

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
      <main className="mx-auto w-full max-w-5xl">
        <section className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Excel to PDF
          </h1>

          <p className="mt-2 text-sm leading-6 text-[#6B7280]">
            Convert your Excel spreadsheets into PDF documents while preserving
            your spreadsheet content.
          </p>
        </section>

        <section className="rounded-xl border border-[#E5E7EB] bg-white p-5 sm:p-7">
          <ExternalApiUsage
            remaining={usage?.remaining ?? 0}
            limit={usage?.limit ?? 3}
            isLoading={isUsageLoading}
            error={usageError}
          />

          <div className="mb-6">
            <h2 className="text-lg font-semibold">Upload your spreadsheet</h2>

            <p className="mt-1 text-sm text-[#6B7280]">
              Select an Excel file to convert into a PDF document.
            </p>
          </div>

          <div
            onDragOver={(event) => {
              event.preventDefault();

              if (status !== "processing") {
                setIsDragging(true);
              }
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
            className={`flex min-h-[230px] flex-col items-center justify-center rounded-lg border-2 border-dashed px-5 py-8 text-center transition ${
              status === "processing"
                ? "cursor-not-allowed border-gray-200 bg-gray-50 opacity-60"
                : isDragging
                  ? "cursor-pointer border-[#C62828] bg-red-50"
                  : "cursor-pointer border-[#D1D5DB] bg-[#FAFAFA] hover:border-[#C62828] hover:bg-red-50/30"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
              onChange={handleInputChange}
              disabled={status === "processing"}
              className="hidden"
            />

            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-[#C62828]">
              <UploadCloud size={27} />
            </div>

            <h3 className="text-base font-semibold">
              Drop your Excel file here
            </h3>

            <p className="mt-2 text-sm text-[#6B7280]">
              or click to browse your files
            </p>

            <span className="mt-5 rounded-lg bg-[#C62828] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#A91F1F]">
              Choose Excel File
            </span>

            <p className="mt-4 text-xs text-[#9CA3AF]">
              XLS and XLSX formats · Maximum file size: 10 MB
            </p>
          </div>

          {selectedFile && (
            <div className="mt-5 flex items-center gap-3 rounded-lg border border-[#E5E7EB] bg-[#FAFAFA] p-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-red-50 text-[#C62828]">
                <FileSpreadsheet size={23} />
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-[#202124]">
                  {selectedFile.name}
                </p>

                <p className="mt-1 text-xs text-[#6B7280]">
                  {formatFileSize(selectedFile.size)}
                </p>
              </div>

              <button
                type="button"
                onClick={handleReset}
                disabled={status === "processing"}
                className="rounded-md p-2 text-[#6B7280] transition hover:bg-gray-200 hover:text-[#C62828] disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Remove selected file"
              >
                <X size={18} />
              </button>
            </div>
          )}

          {error && (
            <div className="mt-5 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <AlertCircle size={17} className="mt-0.5 shrink-0" />
              <p>{error}</p>
            </div>
          )}

          {status === "success" && (
            <div className="mt-5 flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
              <CheckCircle2 size={18} className="shrink-0" />
              <span className="font-medium">
                Your Excel file has been converted successfully.
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
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#C62828] px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-[#A91F1F] disabled:cursor-not-allowed disabled:bg-gray-300"
              >
                {status === "processing" ? (
                  <>
                    <LoaderCircle size={18} className="animate-spin" />
                    Converting Excel...
                  </>
                ) : (
                  <>
                    <FileText size={17} />
                    Convert to PDF
                  </>
                )}
              </button>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={handleDownload}
                  className="flex items-center justify-center gap-2 rounded-lg bg-[#C62828] px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-[#A91F1F]"
                >
                  <Download size={18} />
                  Download PDF File
                </button>

                <button
                  type="button"
                  onClick={handleReset}
                  className="flex items-center justify-center gap-2 rounded-lg border border-[#D1D5DB] bg-white px-5 py-3.5 text-sm font-semibold text-[#4B5563] transition hover:bg-gray-50"
                >
                  <RefreshCw size={17} />
                  Convert Another File
                </button>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

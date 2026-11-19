import { useEffect, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Download,
  FileText,
  LoaderCircle,
  Minimize2,
  UploadCloud,
  X,
} from "lucide-react";
import { PDFDocument } from "pdf-lib";

const MAX_FILE_SIZE = 50 * 1024 * 1024;

type CompressionResult = {
  blob: Blob;
  originalSize: number;
  compressedSize: number;
  fileName: string;
};

export default function CompressPDF() {
  const inputRef = useRef<HTMLInputElement>(null);
  const downloadUrlRef = useRef<string | null>(null);

  const [file, setFile] = useState<File | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [error, setError] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [result, setResult] = useState<CompressionResult | null>(null);

  useEffect(() => {
    return () => {
      if (downloadUrlRef.current) {
        URL.revokeObjectURL(downloadUrlRef.current);
      }
    };
  }, []);

  const formatSize = (bytes: number) => {
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(2)} KB`;
    }

    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const clearDownloadUrl = () => {
    if (downloadUrlRef.current) {
      URL.revokeObjectURL(downloadUrlRef.current);
      downloadUrlRef.current = null;
    }
  };

  const clearFile = () => {
    setFile(null);
    setResult(null);
    setError("");
    setIsDragging(false);
    clearDownloadUrl();

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    event.target.value = "";

    if (!selectedFile || isCompressing) return;

    setError("");
    setResult(null);
    setFile(null);
    clearDownloadUrl();

    if (
      selectedFile.type !== "application/pdf" &&
      !selectedFile.name.toLowerCase().endsWith(".pdf")
    ) {
      setError("Please select a valid PDF file.");
      return;
    }

    if (selectedFile.size === 0) {
      setError("The selected PDF file is empty.");
      return;
    }

    if (selectedFile.size > MAX_FILE_SIZE) {
      setError("The PDF file exceeds the 50 MB size limit.");
      return;
    }

    try {
      await PDFDocument.load(await selectedFile.arrayBuffer());
      setFile(selectedFile);
    } catch {
      setError(
        "Unable to read this PDF. It may be corrupted or password-protected.",
      );
    }
  };

  const compressPDF = async () => {
    if (!file || isCompressing) {
      if (!file) {
        setError("Please upload a PDF file first.");
      }
      return;
    }

    setIsCompressing(true);
    setError("");
    setResult(null);
    clearDownloadUrl();

    try {
      const pdf = await PDFDocument.load(await file.arrayBuffer());

      const compressedBytes = await pdf.save({
        useObjectStreams: true,
        addDefaultPage: false,
        objectsPerTick: 50,
      });

      const pdfBlobData = new Uint8Array(compressedBytes).buffer as ArrayBuffer;

      const blob = new Blob([pdfBlobData], {
        type: "application/pdf",
      });

      setResult({
        blob,
        originalSize: file.size,
        compressedSize: blob.size,
        fileName: file.name.replace(/\.pdf$/i, "") + "-optimized.pdf",
      });
    } catch {
      setError(
        "Something went wrong while optimizing your PDF. Please try another file.",
      );
    } finally {
      setIsCompressing(false);
    }
  };

  const downloadPDF = () => {
    if (!result) return;

    clearDownloadUrl();

    const url = URL.createObjectURL(result.blob);
    downloadUrlRef.current = url;

    const link = document.createElement("a");
    link.href = url;
    link.download = result.fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();

    window.setTimeout(() => {
      if (downloadUrlRef.current === url) {
        URL.revokeObjectURL(url);
        downloadUrlRef.current = null;
      }
    }, 1000);
  };

  const savedBytes = result ? result.originalSize - result.compressedSize : 0;

  const savedPercentage =
    result && savedBytes > 0
      ? ((savedBytes / result.originalSize) * 100).toFixed(1)
      : "0";

  return (
    <div className="min-h-[calc(100dvh-76px)] w-full px-5 py-8 text-[#202124]">
      <main className="mx-auto w-full max-w-5xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Compress PDF
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-500">
            Optimize your PDF file size using browser-based PDF processing.
            Upload your document and download the optimized version.
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 sm:p-8">
          <div
            onDragOver={(event) => {
              event.preventDefault();
              if (!isCompressing) setIsDragging(true);
            }}
            onDragLeave={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget as Node)) {
                setIsDragging(false);
              }
            }}
            onDrop={(event) => {
              event.preventDefault();
              setIsDragging(false);

              if (isCompressing) return;

              const droppedFile = event.dataTransfer.files?.[0];

              if (droppedFile && inputRef.current) {
                const dataTransfer = new DataTransfer();
                dataTransfer.items.add(droppedFile);
                inputRef.current.files = dataTransfer.files;

                inputRef.current.dispatchEvent(
                  new Event("change", { bubbles: true }),
                );
              }
            }}
            onClick={() => {
              if (!isCompressing) {
                inputRef.current?.click();
              }
            }}
            className={`cursor-pointer rounded-lg border-2 border-dashed px-5 py-12 text-center transition ${
              isCompressing
                ? "cursor-wait border-gray-300 bg-gray-50"
                : isDragging
                  ? "border-[#C62828] bg-red-50"
                  : "border-gray-300 hover:border-[#C62828] hover:bg-red-50/40"
            }`}
          >
            {isCompressing ? (
              <LoaderCircle
                size={40}
                className="mx-auto mb-4 animate-spin text-[#C62828]"
              />
            ) : (
              <UploadCloud size={40} className="mx-auto mb-4 text-gray-400" />
            )}

            <h2 className="font-semibold text-gray-800">
              {isCompressing
                ? "Optimizing your PDF..."
                : "Drop your PDF file here"}
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              {isCompressing
                ? "Please wait while your document is processed."
                : "or click to browse your files"}
            </p>

            <p className="mt-4 text-xs text-gray-400">
              PDF only · Maximum file size: 50MB
            </p>

            <input
              ref={inputRef}
              type="file"
              accept=".pdf,application/pdf"
              onChange={handleFileChange}
              disabled={isCompressing}
              className="hidden"
            />
          </div>

          {file && (
            <div className="mt-6 flex items-center justify-between gap-3 rounded-lg border border-gray-200 p-4">
              <div className="flex min-w-0 items-center gap-3">
                <div className="rounded-lg bg-red-50 p-3 text-[#C62828]">
                  <FileText size={22} />
                </div>

                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-gray-800">
                    {file.name}
                  </p>

                  <p className="mt-1 text-xs text-gray-500">
                    Original size: {formatSize(file.size)}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={clearFile}
                disabled={isCompressing}
                title="Remove file"
                aria-label="Remove file"
                className="rounded-lg p-2 text-gray-400 transition hover:bg-red-50 hover:text-[#C62828] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <X size={18} />
              </button>
            </div>
          )}

          {error && (
            <div className="mt-5 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              <AlertCircle size={18} className="mt-0.5 shrink-0" />
              <p>{error}</p>
            </div>
          )}

          {result && (
            <div className="mt-6 rounded-lg border border-gray-200 p-5">
              <div className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                <CheckCircle2 size={19} className="text-green-600" />
                PDF optimization completed
              </div>

              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-lg bg-gray-50 p-4">
                  <p className="text-xs text-gray-500">Original size</p>

                  <p className="mt-1 text-lg font-semibold text-gray-800">
                    {formatSize(result.originalSize)}
                  </p>
                </div>

                <div className="rounded-lg bg-gray-50 p-4">
                  <p className="text-xs text-gray-500">Optimized size</p>

                  <p className="mt-1 text-lg font-semibold text-gray-800">
                    {formatSize(result.compressedSize)}
                  </p>
                </div>
              </div>

              {savedBytes > 0 ? (
                <p className="mt-4 text-sm font-medium text-green-700">
                  File size reduced by {savedPercentage}%.
                </p>
              ) : (
                <p className="mt-4 text-sm text-gray-600">
                  The file did not become smaller. It may already be optimized.
                </p>
              )}

              <button
                type="button"
                onClick={downloadPDF}
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-[#C62828] px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-[#A91F1F]"
              >
                <Download size={18} />
                Download Optimized PDF
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={compressPDF}
            disabled={!file || isCompressing}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-[#C62828] px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-[#A91F1F] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isCompressing ? (
              <>
                <LoaderCircle size={18} className="animate-spin" />
                Optimizing PDF...
              </>
            ) : (
              <>
                <Minimize2 size={18} />
                Compress PDF
              </>
            )}
          </button>
        </div>
      </main>
    </div>
  );
}

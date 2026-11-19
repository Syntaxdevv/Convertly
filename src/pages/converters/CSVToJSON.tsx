import { useRef, useState } from "react";
import type { ChangeEvent, DragEvent } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Download,
  FileJson,
  LoaderCircle,
  RefreshCw,
  UploadCloud,
  X,
} from "lucide-react";
import * as XLSX from "xlsx";

const MAX_FILE_SIZE = 20 * 1024 * 1024;

export default function CSVToJSON() {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [records, setRecords] = useState<Record<string, unknown>[]>([]);
  const [error, setError] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isConverted, setIsConverted] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const reset = () => {
    setFile(null);
    setRecords([]);
    setError("");
    setIsConverted(false);
    setIsProcessing(false);
    setIsDragging(false);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleFile = async (selectedFile?: File) => {
    if (!selectedFile || isProcessing) return;

    setError("");
    setIsConverted(false);

    if (!selectedFile.name.toLowerCase().endsWith(".csv")) {
      setError("Please select a valid CSV file.");
      return;
    }

    if (selectedFile.size === 0) {
      setError("The selected CSV file is empty.");
      return;
    }

    if (selectedFile.size > MAX_FILE_SIZE) {
      setError("File size must not exceed 20MB.");
      return;
    }

    setIsProcessing(true);

    try {
      const content = await selectedFile.text();

      if (!content.trim()) {
        throw new Error("The CSV file is empty.");
      }

      const workbook = XLSX.read(content, {
        type: "string",
        raw: false,
      });

      const firstSheetName = workbook.SheetNames[0];

      if (!firstSheetName) {
        throw new Error("No worksheet data was found.");
      }

      const worksheet = workbook.Sheets[firstSheetName];

      if (!worksheet) {
        throw new Error("Unable to read the CSV file.");
      }

      const data = XLSX.utils.sheet_to_json<Record<string, unknown>>(
        worksheet,
        {
          defval: "",
          raw: false,
        },
      );

      if (data.length === 0) {
        throw new Error("No records were found in the CSV file.");
      }

      setFile(selectedFile);
      setRecords(data);
    } catch (err) {
      setFile(null);
      setRecords([]);
      setError(
        err instanceof Error ? err.message : "Unable to read the CSV file.",
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    void handleFile(event.target.files?.[0]);
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);

    if (isProcessing) return;

    void handleFile(event.dataTransfer.files?.[0]);
  };

  const convertFile = () => {
    if (!records.length || !file || isProcessing) return;

    setError("");
    setIsProcessing(true);

    try {
      const jsonContent = JSON.stringify(records, null, 2);

      const blob = new Blob([jsonContent], {
        type: "application/json;charset=utf-8",
      });

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const baseName = file.name.replace(/\.csv$/i, "");

      link.href = url;
      link.download = `${baseName || "converted"}.json`;
      document.body.appendChild(link);
      link.click();
      link.remove();

      window.setTimeout(() => URL.revokeObjectURL(url), 1000);

      setIsConverted(true);
    } catch {
      setError("Failed to convert CSV to JSON.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-[calc(100dvh-76px)] w-full px-5 py-8 text-[#202124]">
      <main className="mx-auto w-full max-w-5xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            CSV to JSON
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-500">
            Convert CSV files into structured JSON data. Upload your CSV file,
            preview the extracted records, and download the converted JSON file.
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 sm:p-8">
          {!file ? (
            <div
              onDragOver={(event) => {
                event.preventDefault();
                if (!isProcessing) setIsDragging(true);
              }}
              onDragLeave={(event) => {
                if (
                  !event.currentTarget.contains(event.relatedTarget as Node)
                ) {
                  setIsDragging(false);
                }
              }}
              onDrop={handleDrop}
              onClick={() => {
                if (!isProcessing) {
                  fileInputRef.current?.click();
                }
              }}
              className={`rounded-lg border-2 border-dashed px-5 py-14 text-center transition ${
                isProcessing
                  ? "cursor-wait border-gray-300 bg-gray-50"
                  : isDragging
                    ? "cursor-pointer border-[#C62828] bg-red-50"
                    : "cursor-pointer border-gray-300 hover:border-[#C62828] hover:bg-red-50/40"
              }`}
            >
              {isProcessing ? (
                <LoaderCircle
                  size={42}
                  className="mx-auto mb-4 animate-spin text-[#C62828]"
                />
              ) : (
                <UploadCloud size={42} className="mx-auto mb-4 text-gray-400" />
              )}

              <h2 className="font-semibold">
                {isProcessing
                  ? "Reading your CSV file..."
                  : "Drop your CSV file here"}
              </h2>

              <p className="mt-2 text-sm text-gray-500">
                {isProcessing
                  ? "Please wait while we process your file."
                  : "or click to browse your files"}
              </p>

              <p className="mt-4 text-xs text-gray-400">
                Supported format: CSV · Maximum file size: 20MB
              </p>

              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,text/csv"
                onChange={handleInputChange}
                disabled={isProcessing}
                className="hidden"
              />
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 p-4">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="rounded-lg bg-red-50 p-3 text-[#C62828]">
                    <FileJson size={23} />
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">
                      {file.name}
                    </p>

                    <p className="mt-1 text-xs text-gray-500">
                      {(file.size / 1024).toFixed(1)} KB
                      {" · "}
                      {records.length} records
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={reset}
                  disabled={isProcessing}
                  className="rounded-md p-2 text-gray-400 transition hover:bg-gray-100 hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-50"
                  aria-label="Remove file"
                >
                  <X size={19} />
                </button>
              </div>

              <div>
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-semibold">Data Preview</h3>

                  <span className="text-xs text-gray-400">First 5 records</span>
                </div>

                <div className="overflow-x-auto rounded-lg border border-gray-200">
                  <pre className="max-h-80 overflow-auto bg-gray-50 p-4 text-xs leading-6 text-gray-700">
                    {JSON.stringify(records.slice(0, 5), null, 2)}
                  </pre>
                </div>
              </div>

              {isConverted && (
                <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700">
                  <CheckCircle2 size={19} />
                  Your JSON file has been downloaded successfully.
                </div>
              )}

              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={convertFile}
                  disabled={isProcessing || records.length === 0}
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-[#C62828] px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-[#A91F1F] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isProcessing ? (
                    <>
                      <LoaderCircle size={18} className="animate-spin" />
                      Converting...
                    </>
                  ) : (
                    <>
                      <Download size={18} />
                      Convert to JSON
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={reset}
                  disabled={isProcessing}
                  className="flex items-center justify-center gap-2 rounded-lg border border-gray-300 px-5 py-3.5 text-sm font-semibold text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <RefreshCw size={17} />
                  Start Over
                </button>
              </div>
            </div>
          )}

          {error && (
            <div className="mt-5 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              <AlertCircle size={18} className="mt-0.5 shrink-0" />
              <p>{error}</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

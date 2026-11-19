import { useRef, useState } from "react";
import type { ChangeEvent, DragEvent } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  LoaderCircle,
  RefreshCw,
  UploadCloud,
  X,
} from "lucide-react";
import * as XLSX from "xlsx";

const MAX_FILE_SIZE = 20 * 1024 * 1024;

export default function CSVToExcel() {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [rows, setRows] = useState<string[][]>([]);
  const [workbook, setWorkbook] = useState<XLSX.WorkBook | null>(null);
  const [error, setError] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isConverted, setIsConverted] = useState(false);

  const reset = () => {
    setFile(null);
    setRows([]);
    setWorkbook(null);
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
        throw new Error("The CSV file contains no readable data.");
      }

      const parsedWorkbook = XLSX.read(content, {
        type: "string",
        raw: false,
      });

      const firstSheet = parsedWorkbook.SheetNames[0];

      if (!firstSheet) {
        throw new Error("No data was found in the CSV file.");
      }

      const worksheet = parsedWorkbook.Sheets[firstSheet];

      if (!worksheet) {
        throw new Error("Unable to read the CSV file.");
      }

      const parsedRows = XLSX.utils.sheet_to_json<string[]>(worksheet, {
        header: 1,
        defval: "",
        raw: false,
      });

      if (!parsedRows.length) {
        throw new Error("The CSV file contains no readable data.");
      }

      setFile(selectedFile);
      setRows(
        parsedRows
          .slice(0, 6)
          .map((row) => row.map((cell) => String(cell ?? ""))),
      );
      setWorkbook(parsedWorkbook);
    } catch (err) {
      setFile(null);
      setRows([]);
      setWorkbook(null);
      setError(
        err instanceof Error ? err.message : "Unable to read this CSV file.",
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

  const convertToExcel = () => {
    if (!workbook || isProcessing) return;

    setIsProcessing(true);
    setError("");

    try {
      const firstSheet = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheet];

      if (!worksheet) {
        throw new Error("Unable to read the CSV worksheet.");
      }

      const newWorkbook = XLSX.utils.book_new();

      XLSX.utils.book_append_sheet(newWorkbook, worksheet, "Sheet1");

      setWorkbook(newWorkbook);
      setIsConverted(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to convert the CSV file.",
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadExcel = () => {
    if (!workbook || !file) return;

    const baseName = file.name.replace(/\.csv$/i, "");

    try {
      XLSX.writeFile(workbook, `${baseName || "converted"}.xlsx`, {
        bookType: "xlsx",
        compression: true,
      });
    } catch {
      setError("Unable to download the Excel file. Please try again.");
    }
  };

  return (
    <div className="min-h-[calc(100dvh-76px)] w-full px-5 py-8 text-[#202124]">
      <main className="mx-auto w-full max-w-5xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            CSV to Excel
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-500">
            Convert CSV files into Excel spreadsheets. Upload your CSV file,
            preview its contents, and download it as an XLSX file.
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
                    <FileSpreadsheet size={23} />
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">
                      {file.name}
                    </p>

                    <p className="mt-1 text-xs text-gray-500">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
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
                  <h3 className="text-sm font-semibold">CSV Preview</h3>

                  <span className="text-xs text-gray-400">First 6 rows</span>
                </div>

                <div className="overflow-x-auto rounded-lg border border-gray-200">
                  <table className="w-full border-collapse text-left text-xs">
                    <tbody>
                      {rows.map((row, rowIndex) => (
                        <tr
                          key={rowIndex}
                          className={
                            rowIndex === 0
                              ? "bg-gray-50 font-semibold"
                              : "bg-white"
                          }
                        >
                          {row.map((cell, cellIndex) => (
                            <td
                              key={cellIndex}
                              className="max-w-48 border-b border-r border-gray-100 px-3 py-3"
                            >
                              <span className="block truncate">
                                {cell || "—"}
                              </span>
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {!isConverted ? (
                <button
                  type="button"
                  onClick={convertToExcel}
                  disabled={isProcessing}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#C62828] px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-[#A91F1F] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isProcessing ? (
                    <>
                      <LoaderCircle size={18} className="animate-spin" />
                      Converting...
                    </>
                  ) : (
                    "Convert to Excel"
                  )}
                </button>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700">
                    <CheckCircle2 size={19} />
                    Your CSV file has been converted successfully.
                  </div>

                  <button
                    type="button"
                    onClick={downloadExcel}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#C62828] px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-[#A91F1F]"
                  >
                    <Download size={18} />
                    Download Excel
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsConverted(false);
                      setError("");
                    }}
                    className="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-300 px-5 py-3.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50">
                    <RefreshCw size={16} />
                    Convert again
                  </button>
                </div>
              )}
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

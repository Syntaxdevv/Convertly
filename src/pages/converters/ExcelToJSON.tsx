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

export default function ExcelToJSON() {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [workbook, setWorkbook] = useState<XLSX.WorkBook | null>(null);
  const [sheetName, setSheetName] = useState("");
  const [jsonResult, setJsonResult] = useState("");
  const [preview, setPreview] = useState("");
  const [error, setError] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const reset = () => {
    setFile(null);
    setWorkbook(null);
    setSheetName("");
    setJsonResult("");
    setPreview("");
    setError("");
    setIsDragging(false);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleFile = async (selectedFile?: File) => {
    if (!selectedFile || isProcessing) return;

    setError("");

    const extension = selectedFile.name.split(".").pop()?.toLowerCase();

    if (!["xls", "xlsx"].includes(extension || "")) {
      setError("Please select a valid Excel file (.xls or .xlsx).");
      return;
    }

    if (selectedFile.size === 0) {
      setError("The selected Excel file is empty.");
      return;
    }

    if (selectedFile.size > MAX_FILE_SIZE) {
      setError("File size must not exceed 20MB.");
      return;
    }

    setIsProcessing(true);

    try {
      const buffer = await selectedFile.arrayBuffer();

      const parsedWorkbook = XLSX.read(buffer, {
        type: "array",
        cellDates: true,
      });

      if (!parsedWorkbook.SheetNames.length) {
        throw new Error("No worksheets were found in this Excel file.");
      }

      const firstSheet = parsedWorkbook.SheetNames[0];
      const worksheet = parsedWorkbook.Sheets[firstSheet];

      const rows = XLSX.utils.sheet_to_json(worksheet, {
        defval: "",
        raw: false,
      });

      setFile(selectedFile);
      setWorkbook(parsedWorkbook);
      setSheetName(firstSheet);
      setJsonResult("");
      setPreview(JSON.stringify(rows.slice(0, 5), null, 2));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to read this Excel file.",
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];

    if (selectedFile) {
      void handleFile(selectedFile);
    }

    event.target.value = "";
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);

    if (isProcessing) return;

    void handleFile(event.dataTransfer.files?.[0]);
  };

  const handleSheetChange = (name: string) => {
    if (!workbook) return;

    setSheetName(name);
    setJsonResult("");
    setError("");

    const worksheet = workbook.Sheets[name];

    const rows = XLSX.utils.sheet_to_json(worksheet, {
      defval: "",
      raw: false,
    });

    setPreview(JSON.stringify(rows.slice(0, 5), null, 2));
  };

  const convertToJSON = () => {
    if (!workbook || !sheetName || isProcessing) return;

    setError("");
    setIsProcessing(true);

    try {
      const worksheet = workbook.Sheets[sheetName];

      const rows = XLSX.utils.sheet_to_json(worksheet, {
        defval: "",
        raw: false,
      });

      if (!rows.length) {
        throw new Error("The selected worksheet contains no data.");
      }

      const json = JSON.stringify(rows, null, 2);

      setJsonResult(json);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to convert the Excel file.",
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadJSON = () => {
    if (!jsonResult || !file) return;

    const blob = new Blob([jsonResult], {
      type: "application/json;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const baseName = file.name.replace(/\.(xlsx|xls)$/i, "");

    link.href = url;
    link.download = `${baseName}.json`;

    document.body.appendChild(link);
    link.click();
    link.remove();

    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;

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
            Excel to JSON
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#6B7280]">
            Convert Excel spreadsheet data into structured JSON format. Select a
            worksheet, preview your records, and download the converted file.
          </p>
        </section>

        <section className="rounded-xl border border-[#E5E7EB] bg-white p-5 sm:p-7">
          {!file ? (
            <div
              onDragOver={(event) => {
                event.preventDefault();

                if (!isProcessing) {
                  setIsDragging(true);
                }
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => {
                if (!isProcessing) {
                  fileInputRef.current?.click();
                }
              }}
              className={`flex min-h-[260px] flex-col items-center justify-center rounded-lg border-2 border-dashed px-5 py-10 text-center transition ${
                isDragging
                  ? "border-[#C62828] bg-red-50"
                  : "border-[#D1D5DB] bg-[#FAFAFA] hover:border-[#C62828] hover:bg-red-50/30"
              } ${isProcessing ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xls,.xlsx,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                onChange={handleInputChange}
                disabled={isProcessing}
                className="hidden"
              />

              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-[#C62828]">
                {isProcessing ? (
                  <LoaderCircle size={27} className="animate-spin" />
                ) : (
                  <UploadCloud size={27} />
                )}
              </div>

              <h2 className="text-base font-semibold">
                {isProcessing
                  ? "Reading Excel file..."
                  : "Drop your Excel file here"}
              </h2>

              <p className="mt-2 text-sm text-[#6B7280]">
                or click to browse your files
              </p>

              <span className="mt-5 rounded-lg bg-[#C62828] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#A91F1F]">
                Choose Excel File
              </span>

              <p className="mt-4 text-xs text-[#9CA3AF]">
                XLS and XLSX formats · Maximum file size: 20MB
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between gap-3 rounded-lg border border-[#E5E7EB] bg-[#FAFAFA] p-4">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-red-50 text-[#C62828]">
                    <FileJson size={23} />
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">
                      {file.name}
                    </p>

                    <p className="mt-1 text-xs text-[#6B7280]">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={reset}
                  disabled={isProcessing}
                  className="rounded-md p-2 text-[#6B7280] transition hover:bg-gray-200 hover:text-[#C62828] disabled:opacity-40"
                  aria-label="Remove file"
                >
                  <X size={18} />
                </button>
              </div>

              {workbook && workbook.SheetNames.length > 1 && (
                <div>
                  <label
                    htmlFor="excel-sheet"
                    className="mb-2 block text-sm font-medium"
                  >
                    Select Worksheet
                  </label>

                  <select
                    id="excel-sheet"
                    value={sheetName}
                    onChange={(event) => handleSheetChange(event.target.value)}
                    disabled={isProcessing}
                    className="w-full rounded-lg border border-[#D1D5DB] bg-white px-3 py-3 text-sm outline-none transition focus:border-[#C62828] focus:ring-2 focus:ring-red-100 disabled:bg-gray-50"
                  >
                    {workbook.SheetNames.map((name) => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h3 className="text-sm font-semibold">JSON Preview</h3>

                  <span className="text-xs text-[#9CA3AF]">
                    First 5 records
                  </span>
                </div>

                <pre className="max-h-80 overflow-auto rounded-lg border border-[#E5E7EB] bg-[#FAFAFA] p-4 text-xs leading-6 text-[#4B5563]">
                  {preview || "No preview data available."}
                </pre>
              </div>

              {!jsonResult ? (
                <button
                  type="button"
                  onClick={convertToJSON}
                  disabled={isProcessing}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#C62828] px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-[#A91F1F] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isProcessing ? (
                    <>
                      <LoaderCircle size={18} className="animate-spin" />
                      Converting...
                    </>
                  ) : (
                    <>
                      <FileJson size={18} />
                      Convert to JSON
                    </>
                  )}
                </button>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700">
                    <CheckCircle2 size={19} className="shrink-0" />
                    <span>
                      Your Excel file has been converted successfully.
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={downloadJSON}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#C62828] px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-[#A91F1F]"
                  >
                    <Download size={18} />
                    Download JSON
                  </button>

                  <button
                    type="button"
                    onClick={() => setJsonResult("")}
                    className="flex w-full items-center justify-center gap-2 rounded-lg border border-[#D1D5DB] bg-white px-5 py-3 text-sm font-semibold text-[#4B5563] transition hover:bg-gray-50"
                  >
                    <RefreshCw size={17} />
                    Convert Again
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
        </section>
      </main>
    </div>
  );
}

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

export default function ExcelToCSV() {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [workbook, setWorkbook] = useState<XLSX.WorkBook | null>(null);
  const [sheetName, setSheetName] = useState("");
  const [preview, setPreview] = useState<string[][]>([]);
  const [csvResult, setCsvResult] = useState("");
  const [error, setError] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const reset = () => {
    setFile(null);
    setWorkbook(null);
    setSheetName("");
    setPreview([]);
    setCsvResult("");
    setError("");
    setIsProcessing(false);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleFile = async (selectedFile?: File) => {
    if (!selectedFile || isProcessing) return;

    setError("");
    setCsvResult("");

    const extension = selectedFile.name.split(".").pop()?.toLowerCase();

    if (!["xlsx", "xls"].includes(extension || "")) {
      setError("Please select a valid Excel file (.xls or .xlsx).");
      return;
    }

    if (selectedFile.size === 0) {
      setError("The selected file is empty.");
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
        cellDates: false,
      });

      if (!parsedWorkbook.SheetNames.length) {
        throw new Error("No worksheets were found in this Excel file.");
      }

      const firstSheet = parsedWorkbook.SheetNames[0];
      const worksheet = parsedWorkbook.Sheets[firstSheet];

      if (!worksheet) {
        throw new Error("Unable to read the first worksheet.");
      }

      const rows = XLSX.utils.sheet_to_json<string[]>(worksheet, {
        header: 1,
        defval: "",
        raw: false,
      });

      setFile(selectedFile);
      setWorkbook(parsedWorkbook);
      setSheetName(firstSheet);
      setPreview(
        rows.slice(0, 6).map((row) => row.map((cell) => String(cell ?? ""))),
      );
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
    void handleFile(selectedFile);
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);

    const droppedFile = event.dataTransfer.files?.[0];
    void handleFile(droppedFile);
  };

  const handleSheetChange = (name: string) => {
    if (!workbook) return;

    const worksheet = workbook.Sheets[name];

    if (!worksheet) {
      setError("Unable to read the selected worksheet.");
      return;
    }

    const rows = XLSX.utils.sheet_to_json<string[]>(worksheet, {
      header: 1,
      defval: "",
      raw: false,
    });

    setSheetName(name);
    setCsvResult("");
    setError("");
    setPreview(
      rows.slice(0, 6).map((row) => row.map((cell) => String(cell ?? ""))),
    );
  };

  const convertToCSV = () => {
    if (!workbook || !sheetName || isProcessing) return;

    setError("");
    setIsProcessing(true);

    try {
      const worksheet = workbook.Sheets[sheetName];

      if (!worksheet) {
        throw new Error("Unable to read the selected worksheet.");
      }

      const csv = XLSX.utils.sheet_to_csv(worksheet, {
        FS: ",",
        RS: "\r\n",
      });

      if (!csv.trim()) {
        throw new Error("The selected worksheet contains no data.");
      }

      setCsvResult(csv);
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

  const downloadCSV = () => {
    if (!csvResult || !file) return;

    const blob = new Blob(["\uFEFF", csvResult], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const baseName = file.name.replace(/\.(xlsx|xls)$/i, "");

    link.href = url;
    link.download = `${baseName}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();

    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <div className="min-h-[calc(100dvh-76px)] w-full px-5 py-8 text-[#202124]">
      <main className="mx-auto w-full max-w-5xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Excel to CSV
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-500">
            Convert Excel spreadsheets into CSV files quickly and easily. Choose
            a worksheet, preview its contents, and download your converted file.
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 sm:p-8">
          {!file ? (
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
                  ? "Reading your Excel file..."
                  : "Drop your Excel file here"}
              </h2>

              <p className="mt-2 text-sm text-gray-500">
                {isProcessing
                  ? "Please wait while we process your file."
                  : "or click to browse your files"}
              </p>

              <p className="mt-4 text-xs text-gray-400">
                Supported formats: XLS, XLSX · Maximum file size: 20MB
              </p>

              <input
                ref={fileInputRef}
                type="file"
                accept=".xls,.xlsx,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
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

              {workbook && workbook.SheetNames.length > 1 && (
                <div>
                  <label
                    htmlFor="worksheet"
                    className="mb-2 block text-sm font-semibold"
                  >
                    Select worksheet
                  </label>

                  <select
                    id="worksheet"
                    value={sheetName}
                    onChange={(event) => handleSheetChange(event.target.value)}
                    disabled={isProcessing}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-3 text-sm outline-none transition focus:border-[#C62828] focus:ring-2 focus:ring-red-100 disabled:cursor-not-allowed disabled:bg-gray-50"
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
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-semibold">Worksheet preview</h3>

                  <span className="text-xs text-gray-400">First 6 rows</span>
                </div>

                <div className="overflow-x-auto rounded-lg border border-gray-200">
                  <table className="w-full border-collapse text-left text-xs">
                    <tbody>
                      {preview.length > 0 ? (
                        preview.map((row, rowIndex) => (
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
                        ))
                      ) : (
                        <tr>
                          <td className="p-4 text-gray-500">
                            No preview data available.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {!csvResult ? (
                <button
                  type="button"
                  onClick={convertToCSV}
                  disabled={isProcessing}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#C62828] px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-[#A91F1F] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isProcessing ? (
                    <>
                      <LoaderCircle size={18} className="animate-spin" />
                      Converting...
                    </>
                  ) : (
                    "Convert to CSV"
                  )}
                </button>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700">
                    <CheckCircle2 size={19} />
                    Your Excel file has been converted successfully.
                  </div>

                  <button
                    type="button"
                    onClick={downloadCSV}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#C62828] px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-[#A91F1F]"
                  >
                    <Download size={18} />
                    Download CSV
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setCsvResult("");
                      setError("");
                    }}
                    className="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-300 px-5 py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                  >
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

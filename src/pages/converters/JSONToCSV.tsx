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

const MAX_FILE_SIZE = 20 * 1024 * 1024;

export default function JSONToCSV() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [records, setRecords] = useState<Record<string, unknown>[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isConverted, setIsConverted] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const reset = () => {
    setFile(null);
    setRecords([]);
    setHeaders([]);
    setError("");
    setIsConverted(false);
    setIsProcessing(false);
    setIsDragging(false);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleFile = async (selectedFile?: File) => {
    if (!selectedFile) return;

    reset();

    if (!selectedFile.name.toLowerCase().endsWith(".json")) {
      setError("Please select a valid JSON file.");
      return;
    }

    if (selectedFile.size === 0) {
      setError("The selected JSON file is empty.");
      return;
    }

    if (selectedFile.size > MAX_FILE_SIZE) {
      setError("File size exceeds the 20MB limit.");
      return;
    }

    setFile(selectedFile);
    setIsProcessing(true);

    try {
      const content = await selectedFile.text();
      const parsed: unknown = JSON.parse(content);

      let data: unknown[];

      if (Array.isArray(parsed)) {
        data = parsed;
      } else if (typeof parsed === "object" && parsed !== null) {
        data = [parsed];
      } else {
        throw new Error(
          "JSON must contain an array of objects or a single object.",
        );
      }

      if (data.length === 0) {
        throw new Error("The JSON file contains no records.");
      }

      if (
        !data.every(
          (item) =>
            typeof item === "object" && item !== null && !Array.isArray(item),
        )
      ) {
        throw new Error("Every record must be a JSON object.");
      }

      const jsonRecords = data as Record<string, unknown>[];

      const columnNames = Array.from(
        new Set(jsonRecords.flatMap((record) => Object.keys(record))),
      );

      if (columnNames.length === 0) {
        throw new Error("No columns were found in the JSON records.");
      }

      setRecords(jsonRecords);
      setHeaders(columnNames);
    } catch (err) {
      setFile(null);
      setRecords([]);
      setHeaders([]);
      setError(
        err instanceof Error ? err.message : "Unable to read the JSON file.",
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    handleFile(event.target.files?.[0]);
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    handleFile(event.dataTransfer.files?.[0]);
  };

  const escapeCSVValue = (value: unknown): string => {
    let text = "";

    if (value === null || value === undefined) {
      text = "";
    } else if (typeof value === "object") {
      text = JSON.stringify(value);
    } else {
      text = String(value);
    }

    return `"${text.replace(/"/g, '""')}"`;
  };

  const convertFile = () => {
    if (!records.length || !headers.length || isProcessing) return;

    try {
      setIsProcessing(true);
      setError("");

      const rows = [
        headers.map(escapeCSVValue).join(","),
        ...records.map((record) =>
          headers.map((header) => escapeCSVValue(record[header])).join(","),
        ),
      ];

      const csvContent = "\uFEFF" + rows.join("\r\n");

      const blob = new Blob([csvContent], {
        type: "text/csv;charset=utf-8;",
      });

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = `${
        file?.name.replace(/\.json$/i, "") || "converted"
      }.csv`;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      window.setTimeout(() => URL.revokeObjectURL(url), 1000);

      setIsConverted(true);
    } catch {
      setError("Failed to convert JSON to CSV.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-[calc(100dvh-76px)] w-full px-5 py-8 text-[#202124] sm:px-6">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            JSON to CSV
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-500">
            Convert JSON records into a CSV spreadsheet. Upload your JSON file
            and download the converted CSV.
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
              onClick={() => fileInputRef.current?.click()}
              className={`cursor-pointer rounded-lg border-2 border-dashed px-5 py-14 text-center transition ${
                isDragging
                  ? "border-[#C62828] bg-red-50"
                  : "border-gray-300 hover:border-[#C62828] hover:bg-red-50/30"
              }`}
            >
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-red-50 text-[#C62828]">
                <UploadCloud size={27} />
              </div>

              <h2 className="text-base font-semibold text-gray-800">
                Drop your JSON file here
              </h2>

              <p className="mt-2 text-sm text-gray-500">
                or click to browse your files
              </p>

              <span className="mt-5 inline-flex rounded-lg bg-[#C62828] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#A91F1F]">
                Choose JSON File
              </span>

              <p className="mt-4 text-xs text-gray-400">
                Supported format: .json · Maximum file size: 20MB
              </p>

              <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                onChange={handleInputChange}
                className="hidden"
              />
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex flex-col justify-between gap-4 rounded-lg border border-gray-200 p-4 sm:flex-row sm:items-center">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-red-50 text-[#C62828]">
                    <FileSpreadsheet size={22} />
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-gray-800">
                      {file.name}
                    </p>

                    <p className="text-xs text-gray-500">
                      {(file.size / 1024).toFixed(1)} KB · {records.length}{" "}
                      records · {headers.length} columns
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={reset}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
                >
                  <X size={15} />
                  Remove
                </button>
              </div>

              <div>
                <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <h3 className="text-sm font-semibold text-gray-800">
                    Data Preview
                  </h3>

                  <span className="text-xs text-gray-500">
                    Showing first {Math.min(records.length, 5)} of{" "}
                    {records.length} records
                  </span>
                </div>

                <div className="overflow-hidden rounded-lg border border-gray-200">
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-max text-left text-xs">
                      <thead className="bg-gray-50 text-gray-600">
                        <tr>
                          {headers.map((header) => (
                            <th
                              key={header}
                              className="border-b border-gray-200 px-4 py-3 font-semibold"
                            >
                              {header}
                            </th>
                          ))}
                        </tr>
                      </thead>

                      <tbody>
                        {records.slice(0, 5).map((record, index) => (
                          <tr
                            key={index}
                            className="border-b border-gray-100 last:border-0"
                          >
                            {headers.map((header) => (
                              <td
                                key={header}
                                className="max-w-56 truncate px-4 py-3 text-gray-600"
                              >
                                {typeof record[header] === "object" &&
                                record[header] !== null
                                  ? JSON.stringify(record[header])
                                  : String(record[header] ?? "")}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {isConverted && (
                <div className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700">
                  <CheckCircle2 size={19} className="shrink-0" />
                  Your CSV file has been downloaded successfully.
                </div>
              )}

              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={convertFile}
                  disabled={isProcessing || records.length === 0}
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-[#C62828] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#A91F1F] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isProcessing ? (
                    <LoaderCircle size={18} className="animate-spin" />
                  ) : (
                    <Download size={18} />
                  )}
                  Convert to CSV
                </button>

                <button
                  type="button"
                  onClick={reset}
                  className="flex items-center justify-center gap-2 rounded-lg border border-gray-200 px-5 py-3 text-sm font-semibold text-gray-600 transition hover:bg-gray-50"
                >
                  <RefreshCw size={17} />
                  Start Over
                </button>
              </div>
            </div>
          )}

          {error && (
            <div className="mt-5 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              <AlertCircle size={18} className="mt-0.5 shrink-0" />
              <p>{error}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

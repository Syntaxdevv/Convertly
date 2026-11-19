import { useRef, useState } from "react";
import {
  UploadCloud,
  FileText,
  X,
  AlertCircle,
  FileCheck2,
} from "lucide-react";

interface FileUploaderProps {
  accept: string;
  selectedFile: File | null;
  onFileSelect: (file: File | null) => void;
  error?: string;
  description?: string;
  maxSizeMB?: number;
}

export default function FileUploader({
  accept,
  selectedFile,
  onFileSelect,
  error,
  description = "Choose a file from your device or drag it here.",
  maxSizeMB,
}: FileUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }

    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const handleFile = (file?: File) => {
    if (!file) return;

    onFileSelect(file);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);

    handleFile(event.dataTransfer.files[0]);
  };

  const removeFile = () => {
    onFileSelect(null);

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  return (
    <div className="w-full">
      {!selectedFile ? (
        <div
          onDragOver={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget as Node)) {
              setIsDragging(false);
            }
          }}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              inputRef.current?.click();
            }
          }}
          role="button"
          tabIndex={0}
          aria-label="Upload PDF file"
          className={`group relative flex min-h-[260px] cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed px-5 py-10 text-center outline-none transition-all duration-200 sm:min-h-[280px] ${
            isDragging
              ? "border-[#C62828] bg-red-50"
              : "border-gray-300 bg-[#FCFCFC] hover:border-[#C62828] hover:bg-red-50/30 focus-visible:border-[#C62828] focus-visible:ring-2 focus-visible:ring-red-100"
          }`}
        >
          <div
            className={`flex h-16 w-16 items-center justify-center rounded-xl transition-colors ${
              isDragging
                ? "bg-red-100 text-[#C62828]"
                : "bg-white text-[#C62828] shadow-sm ring-1 ring-gray-200 group-hover:bg-red-50 group-hover:ring-red-100"
            }`}
          >
            <UploadCloud size={29} strokeWidth={1.8} />
          </div>

          <h2 className="mt-5 text-base font-bold text-[#171717]">
            {isDragging ? "Drop your file here" : "Upload your PDF"}
          </h2>

          <p className="mt-2 max-w-sm text-sm leading-6 text-gray-500">
            {description}
          </p>

          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              inputRef.current?.click();
            }}
            className="mt-6 inline-flex items-center justify-center rounded-lg bg-[#C62828] px-7 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#A91F24] focus:outline-none focus:ring-4 focus:ring-red-100"
          >
            Choose File
          </button>

          <div className="mt-5 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs text-gray-400">
            <span className="inline-flex items-center gap-1.5">
              <FileCheck2 size={13} />
              PDF format
            </span>

            {maxSizeMB && (
              <>
                <span className="text-gray-300">•</span>
                <span>Maximum {maxSizeMB} MB</span>
              </>
            )}
          </div>

          <input
            ref={inputRef}
            type="file"
            accept={accept}
            className="hidden"
            onChange={(event) => {
              handleFile(event.target.files?.[0]);
              event.target.value = "";
            }}
          />
        </div>
      ) : (
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-red-50 text-[#C62828]">
                <FileText size={24} strokeWidth={1.8} />
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-[#171717]">
                  {selectedFile.name}
                </p>

                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                  <span>{formatFileSize(selectedFile.size)}</span>
                  <span className="text-gray-300">•</span>
                  <span>PDF document</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 sm:justify-end">
              <span className="inline-flex items-center gap-1.5 rounded-md bg-green-50 px-2.5 py-1.5 text-xs font-semibold text-green-700">
                <FileCheck2 size={14} />
                Ready
              </span>

              <button
                type="button"
                onClick={removeFile}
                aria-label="Remove selected file"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-red-50 hover:text-[#C62828]"
              >
                <X size={19} />
              </button>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="mt-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle size={17} className="mt-0.5 shrink-0" />
          <p>{error}</p>
        </div>
      )}
    </div>
  );
}

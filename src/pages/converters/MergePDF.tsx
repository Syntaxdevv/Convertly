import { useRef, useState } from "react";
import type { ChangeEvent, DragEvent } from "react";
import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  FileText,
  Files,
  LoaderCircle,
  Plus,
  Trash2,
  UploadCloud,
} from "lucide-react";
import { PDFDocument } from "pdf-lib";

interface PDFFile {
  id: string;
  file: File;
}

const MAX_FILE_SIZE = 50 * 1024 * 1024;
const MAX_FILES = 30;

export default function MergePDF() {
  const inputRef = useRef<HTMLInputElement>(null);

  const [files, setFiles] = useState<PDFFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isMerging, setIsMerging] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const formatSize = (bytes: number) => {
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }

    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const addFiles = async (selectedFiles: FileList | File[]) => {
    setError("");
    setSuccess(false);

    const incoming = Array.from(selectedFiles);

    if (!incoming.length) return;

    const validFiles: PDFFile[] = [];

    for (const file of incoming) {
      if (
        file.type !== "application/pdf" &&
        !file.name.toLowerCase().endsWith(".pdf")
      ) {
        setError(`${file.name} is not a valid PDF file.`);
        continue;
      }

      if (file.size === 0) {
        setError(`${file.name} is empty.`);
        continue;
      }

      if (file.size > MAX_FILE_SIZE) {
        setError(`${file.name} exceeds the 50 MB file size limit.`);
        continue;
      }

      try {
        const bytes = await file.arrayBuffer();
        await PDFDocument.load(bytes);

        validFiles.push({
          id: crypto.randomUUID(),
          file,
        });
      } catch {
        setError(`${file.name} is invalid, corrupted, or password-protected.`);
      }
    }

    setFiles((current) => {
      const remaining = MAX_FILES - current.length;
      const additions = validFiles.slice(0, remaining);

      if (validFiles.length > remaining) {
        setError(`You can only merge up to ${MAX_FILES} PDF files.`);
      }

      return [...current, ...additions];
    });
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      void addFiles(event.target.files);
    }

    event.target.value = "";
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);

    if (event.dataTransfer.files) {
      void addFiles(event.dataTransfer.files);
    }
  };

  const removeFile = (id: string) => {
    setFiles((current) => current.filter((item) => item.id !== id));
    setSuccess(false);
    setError("");
  };

  const moveFile = (index: number, direction: number) => {
    setFiles((current) => {
      const next = [...current];
      const target = index + direction;

      if (target < 0 || target >= next.length) return current;

      [next[index], next[target]] = [next[target], next[index]];

      return next;
    });

    setSuccess(false);
    setError("");
  };

  const mergePDFs = async () => {
    if (files.length < 2) {
      setError("Please upload at least two PDF files to merge.");
      return;
    }

    setIsMerging(true);
    setError("");
    setSuccess(false);

    try {
      const mergedPDF = await PDFDocument.create();

      for (const item of files) {
        const bytes = await item.file.arrayBuffer();
        const sourcePDF = await PDFDocument.load(bytes);

        const pages = await mergedPDF.copyPages(
          sourcePDF,
          sourcePDF.getPageIndices(),
        );

        pages.forEach((page) => mergedPDF.addPage(page));
      }

      const mergedBytes = await mergedPDF.save();

      const blob = new Blob(
        [new Uint8Array(mergedBytes).buffer as ArrayBuffer],
        {
          type: "application/pdf",
        },
      );

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = "merged-document.pdf";

      document.body.appendChild(link);
      link.click();
      link.remove();

      URL.revokeObjectURL(url);

      setSuccess(true);
    } catch {
      setError(
        "Something went wrong while merging your PDF files. Please check your files and try again.",
      );
    } finally {
      setIsMerging(false);
    }
  };

  const clearFiles = () => {
    setFiles([]);
    setError("");
    setSuccess(false);

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const totalSize = files.reduce((total, item) => total + item.file.size, 0);

  return (
    <div className="min-h-[calc(100dvh-76px)] w-full px-5 py-8 text-[#202124]">
      <main className="mx-auto w-full max-w-5xl">
        <section className="mb-7">
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            Merge PDF
          </h1>

          <p className="mt-2 text-sm text-gray-500 sm:text-base">
            Combine multiple PDF files into one document. Arrange your files in
            your preferred order before merging.
          </p>
        </section>

        <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-8">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-gray-900">
              Upload your PDF files
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Select multiple PDF files or drag and drop them below.
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
              if (!isMerging) {
                inputRef.current?.click();
              }
            }}
            className={`flex min-h-[210px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-5 py-8 text-center transition ${
              isDragging
                ? "border-[#C62828] bg-red-50"
                : "border-gray-300 bg-[#FAFAFA] hover:border-[#C62828] hover:bg-red-50/40"
            } ${isMerging ? "cursor-not-allowed opacity-60" : ""}`}
          >
            <input
              ref={inputRef}
              type="file"
              accept=".pdf,application/pdf"
              multiple
              onChange={handleFileChange}
              disabled={isMerging}
              className="hidden"
            />

            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-red-50 text-[#C62828]">
              <UploadCloud size={28} />
            </div>

            <p className="text-sm font-bold text-gray-800">
              Drop your PDF files here
            </p>

            <p className="mt-1 text-sm text-gray-500">
              or{" "}
              <span className="font-semibold text-[#C62828">browse files</span>
            </p>

            <p className="mt-3 text-xs text-gray-400">
              PDF format only · Maximum 50 MB per file · Up to 30 files
            </p>
          </div>

          {files.length > 0 && (
            <div className="mt-7">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="font-bold text-gray-900">Selected files</h2>

                  <p className="mt-1 text-xs text-gray-500">
                    {files.length} files · {formatSize(totalSize)}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={clearFiles}
                  disabled={isMerging}
                  className="text-sm font-semibold text-red-600 transition hover:text-red-700 disabled:opacity-40"
                >
                  Clear all
                </button>
              </div>

              <div className="space-y-3">
                {files.map((item, index) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-3"
                  >
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-red-50 text-[#C62828]">
                      <FileText size={22} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-gray-800">
                        {item.file.name}
                      </p>

                      <p className="mt-1 text-xs text-gray-400">
                        {formatSize(item.file.size)}
                      </p>
                    </div>

                    <span className="hidden text-xs font-semibold text-gray-400 sm:block">
                      {index + 1}
                    </span>

                    <div className="flex shrink-0 items-center gap-1">
                      <button
                        type="button"
                        onClick={() => moveFile(index, -1)}
                        disabled={index === 0 || isMerging}
                        title="Move up"
                        aria-label={`Move ${item.file.name} up`}
                        className="rounded-md p-2 text-gray-500 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-30"
                      >
                        <ArrowUp size={16} />
                      </button>

                      <button
                        type="button"
                        onClick={() => moveFile(index, 1)}
                        disabled={index === files.length - 1 || isMerging}
                        title="Move down"
                        aria-label={`Move ${item.file.name} down`}
                        className="rounded-md p-2 text-gray-500 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-30"
                      >
                        <ArrowDown size={16} />
                      </button>

                      <button
                        type="button"
                        onClick={() => removeFile(item.id)}
                        disabled={isMerging}
                        title="Remove file"
                        aria-label={`Remove ${item.file.name}`}
                        className="rounded-md p-2 text-red-500 transition hover:bg-red-50 disabled:opacity-40"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                disabled={files.length >= MAX_FILES || isMerging}
                className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[#C62828] transition hover:text-[#A91F1F] disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Plus size={17} />
                Add more files
              </button>
            </div>
          )}

          {error && (
            <div className="mt-5 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              <AlertCircle size={17} className="mt-0.5 shrink-0" />
              <p>{error}</p>
            </div>
          )}

          {success && (
            <div className="mt-5 flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
              <CheckCircle2 size={18} />
              <span className="font-semibold">
                PDF files merged successfully. Your download is ready.
              </span>
            </div>
          )}

          <button
            type="button"
            onClick={mergePDFs}
            disabled={files.length < 2 || isMerging}
            className="mt-7 flex w-full items-center justify-center gap-2 rounded-lg bg-[#C62828] px-5 py-3.5 text-sm font-bold text-white transition hover:bg-[#A91F1F] disabled:cursor-not-allowed disabled:bg-gray-300"
          >
            {isMerging ? (
              <>
                <LoaderCircle size={18} className="animate-spin" />
                Merging PDFs...
              </>
            ) : (
              <>
                <Files size={18} />
                Merge PDF Files
              </>
            )}
          </button>

          <div className="mt-5 flex items-center justify-center gap-2 border-t border-gray-100 pt-4 text-xs text-gray-400">
            <CheckCircle2 size={14} />
            <span>Your files are processed locally in your browser.</span>
          </div>
        </section>
      </main>
    </div>
  );
}

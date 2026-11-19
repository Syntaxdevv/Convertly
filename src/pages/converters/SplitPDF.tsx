import { useRef, useState } from "react";
import type { ChangeEvent } from "react";
import {
  AlertCircle,
  CheckCircle2,
  FileText,
  LoaderCircle,
  Scissors,
  UploadCloud,
  X,
} from "lucide-react";
import { PDFDocument } from "pdf-lib";
import JSZip from "jszip";

const MAX_FILE_SIZE = 50 * 1024 * 1024;

interface PageRange {
  start: number;
  end: number;
}

function parsePageRanges(value: string, totalPages: number): PageRange[] {
  const parts = value
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);

  if (!parts.length) {
    throw new Error("Please enter the page numbers you want to split.");
  }

  const ranges: PageRange[] = [];
  const usedPages = new Set<number>();

  for (const part of parts) {
    const match = part.match(/^(\d+)(?:\s*-\s*(\d+))?$/);

    if (!match) {
      throw new Error(`Invalid page range: ${part}`);
    }

    const start = Number(match[1]);
    const end = Number(match[2] ?? match[1]);

    if (start < 1 || end < start || end > totalPages) {
      throw new Error(
        `Page range ${part} is invalid. Enter pages between 1 and ${totalPages}.`,
      );
    }

    for (let page = start; page <= end; page++) {
      if (usedPages.has(page)) {
        throw new Error(`Page ${page} appears more than once.`);
      }

      usedPages.add(page);
    }

    ranges.push({ start, end });
  }

  return ranges;
}

export default function SplitPDF() {
  const inputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [pageRange, setPageRange] = useState("");
  const [isSplitting, setIsSplitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const formatSize = (bytes: number) => {
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }

    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    event.target.value = "";

    if (!selectedFile) return;

    setError("");
    setSuccess(false);
    setFile(null);
    setPageCount(0);
    setPageRange("");

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
      const pdf = await PDFDocument.load(await selectedFile.arrayBuffer());

      const totalPages = pdf.getPageCount();

      if (totalPages < 2) {
        setError(
          "This PDF has only one page. At least two pages are required.",
        );
        return;
      }

      setFile(selectedFile);
      setPageCount(totalPages);
      setPageRange(`1-${totalPages}`);
    } catch {
      setError(
        "Unable to read this PDF. It may be corrupted or password-protected.",
      );
    }
  };

  const splitPDF = async () => {
    if (!file) {
      setError("Please upload a PDF file first.");
      return;
    }

    setIsSplitting(true);
    setError("");
    setSuccess(false);

    try {
      const ranges = parsePageRanges(pageRange, pageCount);
      const sourcePDF = await PDFDocument.load(await file.arrayBuffer());

      const zip = new JSZip();
      const baseName = file.name.replace(/\.pdf$/i, "");

      for (const range of ranges) {
        const outputPDF = await PDFDocument.create();

        const pageIndices = Array.from(
          { length: range.end - range.start + 1 },
          (_, index) => range.start - 1 + index,
        );

        const copiedPages = await outputPDF.copyPages(sourcePDF, pageIndices);

        copiedPages.forEach((page) => outputPDF.addPage(page));

        const outputBytes = await outputPDF.save();

        const rangeName =
          range.start === range.end
            ? `page-${range.start}`
            : `pages-${range.start}-${range.end}`;

        zip.file(`${baseName}-${rangeName}.pdf`, outputBytes);
      }

      const zipBlob = await zip.generateAsync({
        type: "blob",
        compression: "DEFLATE",
        compressionOptions: { level: 5 },
      });

      const url = URL.createObjectURL(zipBlob);
      const link = document.createElement("a");

      link.href = url;
      link.download = `${baseName}-split.zip`;

      document.body.appendChild(link);
      link.click();
      link.remove();

      window.setTimeout(() => URL.revokeObjectURL(url), 1000);

      setSuccess(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while splitting your PDF.",
      );
    } finally {
      setIsSplitting(false);
    }
  };

  const clearFile = () => {
    setFile(null);
    setPageCount(0);
    setPageRange("");
    setError("");
    setSuccess(false);

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  return (
    <div className="min-h-[calc(100dvh-76px)] w-full px-5 py-8 text-[#202124]">
      <main className="mx-auto w-full max-w-5xl">
        <section className="mb-6">
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            Split PDF
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500 sm:text-base">
            Extract selected pages from your PDF and save them as separate PDF
            files.
          </p>
        </section>

        <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-7">
          <div
            onClick={() => inputRef.current?.click()}
            className="flex min-h-[230px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-[#FAFAFA] px-5 text-center transition hover:border-[#C62828] hover:bg-red-50/40"
          >
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-red-50 text-[#C62828]">
              <UploadCloud size={27} />
            </div>

            <h2 className="text-base font-bold text-gray-800">
              Drop your PDF file here
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              or click to browse your files
            </p>

            <span className="mt-4 rounded-lg bg-[#C62828] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#A91F1F]">
              Choose PDF File
            </span>

            <p className="mt-4 text-xs text-gray-400">
              PDF format only · Maximum file size 50 MB
            </p>

            <input
              ref={inputRef}
              type="file"
              accept=".pdf,application/pdf"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          {file && (
            <div className="mt-6">
              <div className="flex items-center gap-3 rounded-lg border border-gray-200 p-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-red-50 text-[#C62828]">
                  <FileText size={22} />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-gray-800">
                    {file.name}
                  </p>

                  <p className="mt-1 text-xs text-gray-500">
                    {formatSize(file.size)} · {pageCount} pages
                  </p>
                </div>

                <button
                  type="button"
                  onClick={clearFile}
                  disabled={isSplitting}
                  title="Remove file"
                  className="rounded-lg p-2 text-gray-500 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-40"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="mt-6">
                <label
                  htmlFor="page-range"
                  className="text-sm font-bold text-gray-800"
                >
                  Select pages to split
                </label>

                <p className="mt-1 text-xs leading-5 text-gray-500">
                  Enter page numbers or ranges separated by commas.
                </p>

                <input
                  id="page-range"
                  type="text"
                  value={pageRange}
                  onChange={(event) => {
                    setPageRange(event.target.value);
                    setError("");
                    setSuccess(false);
                  }}
                  placeholder="Example: 1-3, 5, 8-10"
                  disabled={isSplitting}
                  className="mt-3 w-full rounded-lg border border-gray-300 px-4 py-3 text-sm text-gray-800 outline-none transition focus:border-[#C62828] focus:ring-2 focus:ring-red-100 disabled:bg-gray-50"
                />

                <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs text-gray-400">
                    Available pages: 1–{pageCount}
                  </p>

                  <button
                    type="button"
                    onClick={() => {
                      setPageRange(`1-${pageCount}`);
                      setError("");
                      setSuccess(false);
                    }}
                    disabled={isSplitting}
                    className="text-xs font-semibold text-[#C62828] transition hover:text-[#A91F1F] disabled:opacity-40"
                  >
                    Select all pages
                  </button>
                </div>

                <div className="mt-4 rounded-lg border border-gray-200 bg-[#FAFAFA] p-3">
                  <p className="text-xs leading-5 text-gray-500">
                    Each comma-separated page range will become a separate PDF
                    file inside your ZIP download.
                  </p>
                </div>
              </div>
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
              <CheckCircle2 size={17} />
              <span>Your PDF pages have been split successfully.</span>
            </div>
          )}

          <button
            type="button"
            onClick={splitPDF}
            disabled={!file || isSplitting}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-[#C62828] px-5 py-3.5 text-sm font-bold text-white transition hover:bg-[#A91F1F] disabled:cursor-not-allowed disabled:bg-gray-300"
          >
            {isSplitting ? (
              <>
                <LoaderCircle size={18} className="animate-spin" />
                Splitting PDF...
              </>
            ) : (
              <>
                <Scissors size={18} />
                Split PDF
              </>
            )}
          </button>

          <p className="mt-3 text-center text-xs text-gray-400">
            Your file is processed locally in your browser.
          </p>
        </section>

        <section className="mt-6 rounded-xl border border-gray-200 bg-white p-5 sm:p-6">
          <h2 className="text-sm font-bold text-gray-800">
            How to split a PDF
          </h2>

          <ol className="mt-3 space-y-2 text-sm leading-6 text-gray-500">
            <li>1. Upload your PDF file.</li>
            <li>2. Enter the page numbers or ranges you want to extract.</li>
            <li>3. Click Split PDF to download your files in a ZIP folder.</li>
          </ol>
        </section>
      </main>
    </div>
  );
}

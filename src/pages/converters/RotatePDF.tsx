import { useRef, useState } from "react";
import type { ChangeEvent } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Download,
  FileText,
  LoaderCircle,
  RotateCw,
  UploadCloud,
  X,
} from "lucide-react";
import { PDFDocument, degrees } from "pdf-lib";

const MAX_FILE_SIZE = 50 * 1024 * 1024;

type RotationAngle = 90 | -90 | 180;

export default function RotatePDF() {
  const inputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [rotation, setRotation] = useState<RotationAngle>(90);
  const [pageCount, setPageCount] = useState(0);
  const [isRotating, setIsRotating] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{
    blob: Blob;
    fileName: string;
  } | null>(null);

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
    setFile(null);
    setResult(null);
    setPageCount(0);

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

      setFile(selectedFile);
      setPageCount(pdf.getPageCount());
    } catch {
      setError(
        "Unable to read this PDF. It may be corrupted or password-protected.",
      );
    }
  };

  const rotatePDF = async () => {
    if (!file) {
      setError("Please upload a PDF file first.");
      return;
    }

    setIsRotating(true);
    setError("");
    setResult(null);

    try {
      const pdf = await PDFDocument.load(await file.arrayBuffer());

      const pages = pdf.getPages();

      pages.forEach((page) => {
        const currentAngle = page.getRotation().angle;
        const normalizedAngle = (((currentAngle + rotation) % 360) + 360) % 360;

        page.setRotation(degrees(normalizedAngle));
      });

      const rotatedBytes = await pdf.save({
        useObjectStreams: true,
      });

      const pdfBlobData = new Uint8Array(rotatedBytes).buffer as ArrayBuffer;

      const blob = new Blob([pdfBlobData], {
        type: "application/pdf",
      });

      setResult({
        blob,
        fileName: file.name.replace(/\.pdf$/i, "") + "-rotated.pdf",
      });
    } catch {
      setError(
        "Something went wrong while rotating your PDF. Please try another file.",
      );
    } finally {
      setIsRotating(false);
    }
  };

  const downloadPDF = () => {
    if (!result) return;

    const url = URL.createObjectURL(result.blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = result.fileName;

    document.body.appendChild(link);
    link.click();
    link.remove();

    window.setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 1000);
  };

  const clearFile = () => {
    setFile(null);
    setPageCount(0);
    setResult(null);
    setError("");

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const rotationOptions: {
    angle: RotationAngle;
    label: string;
    description: string;
    iconClass: string;
  }[] = [
    {
      angle: 90,
      label: "90°",
      description: "Clockwise",
      iconClass: "",
    },
    {
      angle: -90,
      label: "90°",
      description: "Counterclockwise",
      iconClass: "-scale-x-100",
    },
    {
      angle: 180,
      label: "180°",
      description: "Upside down",
      iconClass: "rotate-180",
    },
  ];

  return (
    <div className="min-h-[calc(100dvh-76px)] w-full px-5 py-8 text-[#202124]">
      <main className="mx-auto w-full max-w-5xl">
        <section className="mb-6">
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            Rotate PDF
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500 sm:text-base">
            Rotate all pages of your PDF document to the correct orientation.
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
            <div className="mt-6 flex items-center gap-3 rounded-lg border border-gray-200 p-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-red-50 text-[#C62828]">
                <FileText size={22} />
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-gray-800">
                  {file.name}
                </p>

                <p className="mt-1 text-xs text-gray-500">
                  {pageCount} {pageCount === 1 ? "page" : "pages"} ·{" "}
                  {formatSize(file.size)}
                </p>
              </div>

              <button
                type="button"
                onClick={clearFile}
                disabled={isRotating}
                title="Remove file"
                className="rounded-lg p-2 text-gray-500 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-40"
              >
                <X size={18} />
              </button>
            </div>
          )}

          {file && (
            <div className="mt-7">
              <h2 className="mb-3 text-sm font-bold text-gray-800">
                Choose rotation angle
              </h2>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {rotationOptions.map((option) => (
                  <button
                    key={option.angle}
                    type="button"
                    onClick={() => {
                      setRotation(option.angle);
                      setResult(null);
                      setError("");
                    }}
                    disabled={isRotating}
                    className={`rounded-xl border px-3 py-4 text-center transition disabled:cursor-not-allowed disabled:opacity-60 ${
                      rotation === option.angle
                        ? "border-[#C62828] bg-red-50 text-[#C62828]"
                        : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                    }`}
                  >
                    <RotateCw
                      size={23}
                      className={`mx-auto mb-2 ${option.iconClass}`}
                    />

                    <span className="block text-sm font-bold">
                      {option.label}
                    </span>

                    <span className="mt-1 block text-xs">
                      {option.description}
                    </span>
                  </button>
                ))}
              </div>

              <p className="mt-3 text-xs text-gray-400">
                The selected rotation will be applied to all {pageCount}{" "}
                {pageCount === 1 ? "page" : "pages"}.
              </p>
            </div>
          )}

          {error && (
            <div className="mt-5 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              <AlertCircle size={17} className="mt-0.5 shrink-0" />
              <p>{error}</p>
            </div>
          )}

          {result && (
            <div className="mt-6 rounded-lg border border-gray-200 p-4">
              <div className="flex items-center gap-2 text-sm font-bold text-gray-800">
                <CheckCircle2 size={18} className="text-green-600" />
                PDF rotation completed
              </div>

              <p className="mt-2 text-sm text-gray-500">
                All {pageCount} {pageCount === 1 ? "page has" : "pages have"}{" "}
                been rotated successfully.
              </p>

              <button
                type="button"
                onClick={downloadPDF}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-[#15803D] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#166534]"
              >
                <Download size={18} />
                Download Rotated PDF
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={rotatePDF}
            disabled={!file || isRotating}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-[#C62828] px-5 py-3.5 text-sm font-bold text-white transition hover:bg-[#A91F1F] disabled:cursor-not-allowed disabled:bg-gray-300"
          >
            {isRotating ? (
              <>
                <LoaderCircle size={18} className="animate-spin" />
                Rotating PDF...
              </>
            ) : (
              <>
                <RotateCw size={18} />
                Rotate PDF
              </>
            )}
          </button>

          <p className="mt-3 text-center text-xs text-gray-400">
            Your file is processed locally in your browser. No file upload is
            required.
          </p>
        </section>

        <section className="mt-6 rounded-xl border border-gray-200 bg-white p-5 sm:p-6">
          <h2 className="text-sm font-bold text-gray-800">
            How to rotate a PDF
          </h2>

          <ol className="mt-3 space-y-2 text-sm leading-6 text-gray-500">
            <li>1. Upload your PDF file.</li>
            <li>2. Choose your preferred rotation angle.</li>
            <li>3. Click Rotate PDF and download the updated document.</li>
          </ol>
        </section>
      </main>
    </div>
  );
}

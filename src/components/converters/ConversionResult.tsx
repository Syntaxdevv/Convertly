import {
  CheckCircle2,
  Download,
  LoaderCircle,
  AlertCircle,
  FileText,
} from "lucide-react";

export type ConversionStatus = "idle" | "processing" | "success" | "error";

interface ConversionResultProps {
  status: ConversionStatus;
  downloadUrl?: string;
  fileName?: string;
  error?: string;
  progress?: number;
}

export default function ConversionResult({
  status,
  downloadUrl,
  fileName = "converted-file.docx",
  error,
  progress = 0,
}: ConversionResultProps) {
  if (status === "idle") return null;

  return (
    <div className="mt-6 rounded-lg border border-gray-200 bg-white p-4 sm:p-5">
      {status === "processing" && (
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-red-50 text-[#C62828]">
              <LoaderCircle size={22} className="animate-spin" />
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-[#171717]">
                Converting your file
              </p>

              <p className="mt-1 text-xs text-gray-500">
                Please wait while your file is being processed.
              </p>
            </div>
          </div>

          <div className="mt-5 h-2 overflow-hidden rounded-full bg-gray-100">
            <div
              className="h-full rounded-full bg-[#C62828] transition-all duration-300"
              style={{
                width: `${Math.min(100, Math.max(0, progress))}%`,
              }}
            />
          </div>

          <p className="mt-2 text-right text-xs font-semibold text-gray-500">
            {Math.round(progress)}%
          </p>
        </div>
      )}

      {status === "success" && (
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-green-50 text-green-600">
              <CheckCircle2 size={23} />
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-[#171717]">
                Conversion completed
              </p>

              <p className="mt-1 text-xs text-gray-500">
                Your Word document is ready.
              </p>
            </div>
          </div>

          <div className="mt-5 flex items-center gap-3 rounded-lg border border-gray-100 bg-gray-50 p-3">
            <FileText size={21} className="shrink-0 text-[#C62828]" />

            <p className="min-w-0 flex-1 truncate text-sm font-semibold text-[#171717]">
              {fileName}
            </p>

            <span className="text-xs font-bold text-green-600">DOCX</span>
          </div>

          {downloadUrl && (
            <a
              href={downloadUrl}
              download={fileName}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-[#C62828] px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-[#A91F24]"
            >
              <Download size={17} />
              Download Word File
            </a>
          )}
        </div>
      )}

      {status === "error" && (
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-red-50 text-[#C62828]">
            <AlertCircle size={22} />
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-[#171717]">
              Conversion failed
            </p>

            <p className="mt-1 text-sm leading-6 text-gray-500">
              {error || "Something went wrong while converting your file."}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

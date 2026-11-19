import { useEffect, useRef, useState } from "react";
import type { ChangeEvent, DragEvent } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Download,
  FileImage,
  FileText,
  RefreshCw,
  UploadCloud,
  X,
} from "lucide-react";

const MAX_FILE_SIZE = 20 * 1024 * 1024;
const MAX_FILES = 20;

type ImageFile = {
  id: string;
  file: File;
  preview: string;
};

export default function ImageToPDF() {
  const inputRef = useRef<HTMLInputElement>(null);

  const [images, setImages] = useState<ImageFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [convertedUrl, setConvertedUrl] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    return () => {
      images.forEach((image) => URL.revokeObjectURL(image.preview));

      if (convertedUrl) {
        URL.revokeObjectURL(convertedUrl);
      }
    };
  }, [images, convertedUrl]);

  const clearResult = () => {
    setConvertedUrl("");
    setSuccess("");
  };

  const addFiles = (files: FileList | File[]) => {
    if (isConverting) return;

    setError("");
    clearResult();

    const selectedFiles = Array.from(files);

    if (images.length + selectedFiles.length > MAX_FILES) {
      setError(`You can upload a maximum of ${MAX_FILES} images.`);
      return;
    }

    const validFiles: ImageFile[] = [];
    const errors: string[] = [];

    for (const file of selectedFiles) {
      const extension = file.name.split(".").pop()?.toLowerCase();

      const isValid =
        ["jpg", "jpeg", "png", "webp"].includes(extension || "") &&
        ["image/jpeg", "image/png", "image/webp"].includes(file.type);

      if (!isValid) {
        errors.push(
          `${file.name} is not supported. Use JPG, PNG, or WEBP images.`,
        );
        continue;
      }

      if (file.size === 0) {
        errors.push(`${file.name} is empty.`);
        continue;
      }

      if (file.size > MAX_FILE_SIZE) {
        errors.push(`${file.name} exceeds the 20MB file size limit.`);
        continue;
      }

      validFiles.push({
        id: crypto.randomUUID(),
        file,
        preview: URL.createObjectURL(file),
      });
    }

    if (validFiles.length > 0) {
      setImages((previous) => [...previous, ...validFiles]);
    }

    if (errors.length > 0) {
      setError(errors.join(" "));
    }
  };

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      addFiles(event.target.files);
    }

    event.target.value = "";
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);

    if (isConverting) return;

    addFiles(event.dataTransfer.files);
  };

  const removeImage = (id: string) => {
    if (isConverting) return;

    setImages((previous) => previous.filter((item) => item.id !== id));

    setError("");
    clearResult();
  };

  const moveImage = (index: number, direction: -1 | 1) => {
    if (isConverting) return;

    const nextIndex = index + direction;

    if (nextIndex < 0 || nextIndex >= images.length) return;

    setImages((previous) => {
      const updated = [...previous];

      [updated[index], updated[nextIndex]] = [
        updated[nextIndex],
        updated[index],
      ];

      return updated;
    });

    setError("");
    clearResult();
  };

  const resetConverter = () => {
    if (isConverting) return;

    setImages([]);
    clearResult();
    setError("");

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const loadImage = (file: File): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const image = new window.Image();

      image.onload = () => {
        URL.revokeObjectURL(url);
        resolve(image);
      };

      image.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error(`Unable to read ${file.name}.`));
      };

      image.src = url;
    });
  };

  const convertToPDF = async () => {
    if (images.length === 0 || isConverting) return;

    setIsConverting(true);
    setError("");
    clearResult();

    try {
      const encoder = new TextEncoder();
      const objects: Uint8Array[] = [];
      const pageReferences: number[] = [];

      const addObject = (content: Uint8Array | string) => {
        const data =
          typeof content === "string" ? encoder.encode(content) : content;

        objects.push(data);
        return objects.length;
      };

      const catalogId = addObject("");
      const pagesId = addObject("");

      for (const item of images) {
        const image = await loadImage(item.file);

        const canvas = document.createElement("canvas");
        canvas.width = image.naturalWidth;
        canvas.height = image.naturalHeight;

        const context = canvas.getContext("2d");

        if (!context) {
          throw new Error("Unable to process one of your images.");
        }

        context.fillStyle = "#FFFFFF";
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.drawImage(image, 0, 0);

        const jpegBlob = await new Promise<Blob>((resolve, reject) => {
          canvas.toBlob(
            (blob) => {
              if (blob) resolve(blob);
              else reject(new Error("Unable to process image."));
            },
            "image/jpeg",
            0.92,
          );
        });

        const imageBytes = new Uint8Array(await jpegBlob.arrayBuffer());

        const pageWidth = 595.28;
        const pageHeight = 841.89;

        const scale = Math.min(
          pageWidth / canvas.width,
          pageHeight / canvas.height,
        );

        const renderedWidth = canvas.width * scale;
        const renderedHeight = canvas.height * scale;

        const x = (pageWidth - renderedWidth) / 2;
        const y = (pageHeight - renderedHeight) / 2;

        const imageHeader = encoder.encode(
          `<< /Type /XObject /Subtype /Image /Width ${canvas.width} /Height ${canvas.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${imageBytes.length} >>\nstream\n`,
        );

        const imageFooter = encoder.encode("\nendstream");

        const imageId = addObject(
          new Uint8Array([...imageHeader, ...imageBytes, ...imageFooter]),
        );

        const content = `q\n${renderedWidth} 0 0 ${renderedHeight} ${x} ${y} cm\n/Im0 Do\nQ`;

        const contentBytes = encoder.encode(content);

        const contentId = addObject(
          `<< /Length ${contentBytes.length} >>\nstream\n${content}\nendstream`,
        );

        const pageId = addObject(
          `<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /XObject << /Im0 ${imageId} 0 R >> >> /Contents ${contentId} 0 R >>`,
        );

        pageReferences.push(pageId);
      }

      objects[catalogId - 1] = encoder.encode(
        `<< /Type /Catalog /Pages ${pagesId} 0 R >>`,
      );

      objects[pagesId - 1] = encoder.encode(
        `<< /Type /Pages /Kids [${pageReferences
          .map((id) => `${id} 0 R`)
          .join(" ")}] /Count ${pageReferences.length} >>`,
      );

      const pdfParts: Uint8Array[] = [
        encoder.encode("%PDF-1.4\n%\xE2\xE3\xCF\xD3\n"),
      ];

      const offsets = [0];
      let currentOffset = pdfParts[0].length;

      objects.forEach((object, index) => {
        offsets.push(currentOffset);

        const header = encoder.encode(`${index + 1} 0 obj\n`);
        const footer = encoder.encode("\nendobj\n");

        pdfParts.push(header, object, footer);

        currentOffset += header.length + object.length + footer.length;
      });

      const xrefOffset = currentOffset;

      let xref = `xref\n0 ${objects.length + 1}\n`;
      xref += "0000000000 65535 f \n";

      for (let index = 1; index < offsets.length; index++) {
        xref += `${String(offsets[index]).padStart(10, "0")} 00000 n \n`;
      }

      const trailer = encoder.encode(
        `${xref}trailer\n<< /Size ${objects.length + 1} /Root ${catalogId} 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`,
      );

      pdfParts.push(trailer);

      const pdfBlob = new Blob(
        pdfParts.map((part) => {
          const buffer = new ArrayBuffer(part.byteLength);
          new Uint8Array(buffer).set(part);
          return buffer;
        }),
        {
          type: "application/pdf",
        },
      );

      setConvertedUrl(URL.createObjectURL(pdfBlob));
      setSuccess("Your images have been converted into a PDF.");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong during conversion.",
      );
    } finally {
      setIsConverting(false);
    }
  };

  const downloadPDF = () => {
    if (!convertedUrl) return;

    const link = document.createElement("a");
    link.href = convertedUrl;
    link.download = "convertly-images.pdf";
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const formatFileSize = (bytes: number) => {
    return bytes < 1024 * 1024
      ? `${(bytes / 1024).toFixed(1)} KB`
      : `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="min-h-[calc(100dvh-76px)] w-full px-5 py-8 text-[#202124]">
      <main className="mx-auto w-full max-w-5xl py-4 sm:py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Image to PDF
          </h1>

          <p className="mt-2 text-sm leading-6 text-[#6B7280]">
            Combine your images into a single PDF document.
          </p>
        </div>

        <div className="rounded-xl border border-[#E5E7EB] bg-white p-5 sm:p-7">
          <div
            onDragOver={(event) => {
              event.preventDefault();
              if (!isConverting) setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => {
              if (!isConverting) inputRef.current?.click();
            }}
            className={`flex min-h-[210px] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-5 py-8 text-center transition ${
              isDragging
                ? "border-[#C62828] bg-red-50"
                : "border-[#D1D5DB] bg-[#FAFAFA] hover:border-[#C62828] hover:bg-red-50/30"
            } ${isConverting ? "pointer-events-none opacity-60" : ""}`}
          >
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#FEF2F2] text-[#C62828]">
              <UploadCloud size={27} />
            </div>

            <h2 className="text-base font-semibold">Drop your images here</h2>

            <p className="mt-2 text-sm text-[#6B7280]">
              or click to browse your files
            </p>

            <span className="mt-5 rounded-lg bg-[#C62828] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#A91F1F]">
              Choose Images
            </span>

            <p className="mt-4 text-xs text-[#9CA3AF]">
              JPG, JPEG, PNG, WEBP · Up to 20MB per image · Maximum 20 images
            </p>
          </div>

          {images.length > 0 && (
            <div className="mt-7">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold">Selected Images</h2>
                  <p className="mt-1 text-xs text-[#6B7280]">
                    {images.length} image
                    {images.length !== 1 ? "s" : ""} selected
                  </p>
                </div>

                <button
                  type="button"
                  onClick={resetConverter}
                  disabled={isConverting}
                  className="text-sm font-medium text-[#C62828] transition hover:underline disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Clear all
                </button>
              </div>

              <div className="space-y-3">
                {images.map((image, index) => (
                  <div
                    key={image.id}
                    className="flex items-center gap-3 rounded-lg border border-[#E5E7EB] p-3"
                  >
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-md bg-[#F3F4F6]">
                      <img
                        src={image.preview}
                        alt={image.file.name}
                        className="h-full w-full object-contain"
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {image.file.name}
                      </p>
                      <p className="mt-1 text-xs text-[#6B7280]">
                        Page {index + 1} · {formatFileSize(image.file.size)}
                      </p>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        disabled={isConverting || index === 0}
                        onClick={() => moveImage(index, -1)}
                        className="rounded p-2 text-sm text-[#6B7280] transition hover:bg-[#F1F3F4] disabled:cursor-not-allowed disabled:opacity-30"
                        aria-label="Move image up"
                      >
                        ↑
                      </button>

                      <button
                        type="button"
                        disabled={isConverting || index === images.length - 1}
                        onClick={() => moveImage(index, 1)}
                        className="rounded p-2 text-sm text-[#6B7280] transition hover:bg-[#F1F3F4] disabled:cursor-not-allowed disabled:opacity-30"
                        aria-label="Move image down"
                      >
                        ↓
                      </button>

                      <button
                        type="button"
                        disabled={isConverting}
                        onClick={() => removeImage(image.id)}
                        className="rounded p-2 text-[#6B7280] transition hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-30"
                        aria-label="Remove image"
                      >
                        <X size={17} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                disabled={isConverting || images.length >= MAX_FILES}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-[#D1D5DB] px-4 py-3 text-sm font-semibold transition hover:bg-[#F8F9FA] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <FileImage size={17} />
                Add More Images
              </button>

              <button
                type="button"
                onClick={convertToPDF}
                disabled={isConverting}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-[#C62828] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#A91F1F] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isConverting ? (
                  <>
                    <RefreshCw size={17} className="animate-spin" />
                    Creating PDF...
                  </>
                ) : (
                  <>
                    <FileText size={17} />
                    Convert to PDF
                  </>
                )}
              </button>

              {convertedUrl && (
                <button
                  type="button"
                  onClick={downloadPDF}
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-[#D1D5DB] bg-white px-5 py-3 text-sm font-semibold transition hover:bg-[#F8F9FA]"
                >
                  <Download size={17} />
                  Download PDF
                </button>
              )}
            </div>
          )}

          {error && (
            <div className="mt-5 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <AlertCircle size={17} className="mt-0.5 shrink-0" />
              <p>{error}</p>
            </div>
          )}

          {success && (
            <div className="mt-5 flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
              <CheckCircle2 size={17} />
              {success}
            </div>
          )}
        </div>

        <div className="mt-6 rounded-lg border border-[#E5E7EB] bg-white p-5">
          <h2 className="text-sm font-semibold">About this converter</h2>

          <p className="mt-2 text-sm leading-6 text-[#6B7280]">
            Upload multiple images and combine them into one PDF. Each image
            will be placed on its own page while maintaining its aspect ratio.
            You can also rearrange the page order before converting. Files are
            processed locally in your browser.
          </p>
        </div>
      </main>

      <input
        ref={inputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
        multiple
        onChange={handleInputChange}
        className="hidden"
      />
    </div>
  );
}

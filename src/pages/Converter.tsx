import { useParams } from "react-router-dom";

import { tools } from "../data/tools";
import ConverterNavbar from "../components/layout/ConverterNavbar";

import PDFToWord from "./converters/PDFToWord";
import WordToPDF from "./converters/WordToPDF";
import PDFToExcel from "./converters/PDFToExcel";
import ExcelToPDF from "./converters/ExcelToPDF";
import PPTToPDF from "./converters/PPTToPDF";
import PDFToJPG from "./converters/PDFToJPG";
import PDFToPNG from "./converters/PDFToPNG";
import PDFToTXT from "./converters/PDFToTXT";

import JPGToPNG from "./converters/JPGToPNG";
import PNGToJPG from "./converters/PNGToJPG";
import JPGToWEBP from "./converters/JPGToWEBP";
import PNGToWEBP from "./converters/PNGToWEBP";
import WEBPToJPG from "./converters/WEBPToJPG";
import WEBPToPNG from "./converters/WEBPToPNG";
import SVGToPNG from "./converters/SVGToPNG";
import ImageToPDF from "./converters/ImageToPDF";
import ImageCompressor from "./converters/ImageCompressor";
import ImageResizer from "./converters/ImageResizer";

import ExcelToCSV from "./converters/ExcelToCSV";
import CSVToExcel from "./converters/CSVToExcel";
import ExcelToJSON from "./converters/ExcelToJSON";
import JSONToExcel from "./converters/JSONToExcel";
import CSVToJSON from "./converters/CSVToJSON";
import JSONToCSV from "./converters/JSONToCSV";

import MergePDF from "./converters/MergePDF";
import SplitPDF from "./converters/SplitPDF";
import CompressPDF from "./converters/CompressPDF";
import RotatePDF from "./converters/RotatePDF";

export default function Converter() {
  const { slug } = useParams();

  const tool = tools.find((item) => item.slug === slug);

  if (!tool) {
    return (
      <div className="relative min-h-screen bg-[#FAFAFA]">
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 z-10"
          style={{
            backgroundImage:
              "radial-gradient(circle, rgba(0,0,0,0.13) 1px, transparent 1px)",
            backgroundSize: "20px 20px",
          }}
        />

        <div className="relative z-20">
          <ConverterNavbar />

          <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
            <h1 className="text-2xl font-bold text-[#171717]">
              Converter not found
            </h1>
          </main>
        </div>
      </div>
    );
  }

  let converter;

  switch (slug) {
    case "pdf-to-word":
      converter = <PDFToWord />;
      break;

    case "word-to-pdf":
      converter = <WordToPDF />;
      break;

    case "pdf-to-excel":
      converter = <PDFToExcel />;
      break;

    case "excel-to-pdf":
      converter = <ExcelToPDF />;
      break;

    case "ppt-to-pdf":
      converter = <PPTToPDF />;
      break;

    case "pdf-to-jpg":
      converter = <PDFToJPG />;
      break;

    case "pdf-to-png":
      converter = <PDFToPNG />;
      break;

    case "pdf-to-txt":
      converter = <PDFToTXT />;
      break;

    case "jpg-to-png":
      converter = <JPGToPNG />;
      break;

    case "png-to-jpg":
      converter = <PNGToJPG />;
      break;

    case "jpg-to-webp":
      converter = <JPGToWEBP />;
      break;

    case "png-to-webp":
      converter = <PNGToWEBP />;
      break;

    case "webp-to-jpg":
      converter = <WEBPToJPG />;
      break;

    case "webp-to-png":
      converter = <WEBPToPNG />;
      break;

    case "svg-to-png":
      converter = <SVGToPNG />;
      break;

    case "image-to-pdf":
      converter = <ImageToPDF />;
      break;

    case "image-compressor":
      converter = <ImageCompressor />;
      break;

    case "image-resizer":
      converter = <ImageResizer />;
      break;

    case "excel-to-csv":
      converter = <ExcelToCSV />;
      break;

    case "csv-to-excel":
      converter = <CSVToExcel />;
      break;

    case "excel-to-json":
      converter = <ExcelToJSON />;
      break;

    case "json-to-excel":
      converter = <JSONToExcel />;
      break;

    case "csv-to-json":
      converter = <CSVToJSON />;
      break;

    case "json-to-csv":
      converter = <JSONToCSV />;
      break;

    case "merge-pdf":
      converter = <MergePDF />;
      break;

    case "split-pdf":
      converter = <SplitPDF />;
      break;

    case "compress-pdf":
      converter = <CompressPDF />;
      break;

    case "rotate-pdf":
      converter = <RotatePDF />;
      break;

    default:
      converter = (
        <main className="min-h-screen px-5 py-10">
          <div className="mx-auto max-w-3xl">
            <section className="mt-8 rounded-xl border border-gray-200 bg-white p-8">
              <p className="text-xs font-bold uppercase tracking-wider text-[#C62828]">
                CONVERTLY TOOL
              </p>

              <h1 className="mt-3 text-3xl font-bold text-[#171717]">
                {tool.name}
              </h1>

              <p className="mt-3 text-sm leading-6 text-gray-500">
                {tool.description}
              </p>

              <div className="mt-8 rounded-lg border-2 border-dashed border-gray-200 px-6 py-16 text-center">
                <p className="font-semibold text-[#171717]">
                  Converter workspace
                </p>

                <p className="mt-2 text-sm text-gray-500">
                  This converter is not implemented yet.
                </p>
              </div>
            </section>
          </div>
        </main>
      );
  }

  return (
    <div className="relative min-h-screen bg-[#FAFAFA]">
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-10"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(0,0,0,0.13) 1px, transparent 1px)",
          backgroundSize: "20px 20px",
        }}
      />

      <div className="relative z-20">
        <ConverterNavbar />
        {converter}
      </div>
    </div>
  );
}

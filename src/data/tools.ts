
import {
    FileText,
    Image,
    FileSpreadsheet,
    FileJson,
    Minimize2,
    Maximize2,
    Combine,
    Scissors,
    RotateCw,
} from "lucide-react";

import type { LucideIcon } from "lucide-react";

export interface ConverterTool {
    name: string;
    description: string;
    slug: string;
    category: string;
    icon: LucideIcon;
    keywords: string[];
}

export const tools: ConverterTool[] = [

    // DOCUMENT CONVERTERS

    {
        name: "PDF to Word",
        description: "Convert PDF files into editable Word documents.",
        slug: "pdf-to-word",
        category: "Documents",
        icon: FileText,
        keywords: ["pdf", "word", "docx"],
    },
    {
        name: "Word to PDF",
        description: "Convert Word documents into PDF files.",
        slug: "word-to-pdf",
        category: "Documents",
        icon: FileText,
        keywords: ["word", "docx", "pdf"],
    },
    {
        name: "PDF to Excel",
        description: "Convert PDF tables into Excel spreadsheets.",
        slug: "pdf-to-excel",
        category: "Documents",
        icon: FileSpreadsheet,
        keywords: ["pdf", "excel", "xlsx"],
    },
    {
        name: "Excel to PDF",
        description: "Convert Excel spreadsheets into PDF files.",
        slug: "excel-to-pdf",
        category: "Documents",
        icon: FileSpreadsheet,
        keywords: ["excel", "xlsx", "pdf"],
    },
    {
        name: "PPT to PDF",
        description: "Convert PowerPoint presentations into PDF files.",
        slug: "ppt-to-pdf",
        category: "Documents",
        icon: FileText,
        keywords: ["ppt", "pptx", "powerpoint", "pdf"],
    },
    {
        name: "PDF to JPG",
        description: "Convert PDF pages into JPG images.",
        slug: "pdf-to-jpg",
        category: "Documents",
        icon: Image,
        keywords: ["pdf", "jpg", "jpeg"],
    },
    {
        name: "PDF to PNG",
        description: "Convert PDF pages into PNG images.",
        slug: "pdf-to-png",
        category: "Documents",
        icon: Image,
        keywords: ["pdf", "png"],
    },
    {
        name: "PDF to TXT",
        description: "Extract text from PDF documents.",
        slug: "pdf-to-txt",
        category: "Documents",
        icon: FileText,
        keywords: ["pdf", "txt", "text"],
    },

    // IMAGE CONVERTERS

    {
        name: "JPG to PNG",
        description: "Convert JPG images into PNG format.",
        slug: "jpg-to-png",
        category: "Images",
        icon: Image,
        keywords: ["jpg", "jpeg", "png"],
    },
    {
        name: "PNG to JPG",
        description: "Convert PNG images into JPG format.",
        slug: "png-to-jpg",
        category: "Images",
        icon: Image,
        keywords: ["png", "jpg", "jpeg"],
    },
    {
        name: "JPG to WEBP",
        description: "Convert JPG images into WEBP format.",
        slug: "jpg-to-webp",
        category: "Images",
        icon: Image,
        keywords: ["jpg", "jpeg", "webp"],
    },
    {
        name: "PNG to WEBP",
        description: "Convert PNG images into WEBP format.",
        slug: "png-to-webp",
        category: "Images",
        icon: Image,
        keywords: ["png", "webp"],
    },
    {
        name: "WEBP to JPG",
        description: "Convert WEBP images into JPG format.",
        slug: "webp-to-jpg",
        category: "Images",
        icon: Image,
        keywords: ["webp", "jpg", "jpeg"],
    },
    {
        name: "WEBP to PNG",
        description: "Convert WEBP images into PNG format.",
        slug: "webp-to-png",
        category: "Images",
        icon: Image,
        keywords: ["webp", "png"],
    },
    {
        name: "SVG to PNG",
        description: "Convert SVG files into PNG images.",
        slug: "svg-to-png",
        category: "Images",
        icon: Image,
        keywords: ["svg", "png"],
    },
    {
        name: "Image to PDF",
        description: "Convert images into PDF documents.",
        slug: "image-to-pdf",
        category: "Images",
        icon: FileText,
        keywords: ["image", "jpg", "png", "pdf"],
    },
    {
        name: "Image Compressor",
        description: "Reduce image file sizes.",
        slug: "image-compressor",
        category: "Images",
        icon: Minimize2,
        keywords: ["image", "compress", "jpg", "png"],
    },
    {
        name: "Image Resizer",
        description: "Resize images to your preferred dimensions.",
        slug: "image-resizer",
        category: "Images",
        icon: Maximize2,
        keywords: ["image", "resize", "dimensions"],
    },

    // SPREADSHEET CONVERTERS

    {
        name: "Excel to CSV",
        description: "Convert Excel spreadsheets into CSV files.",
        slug: "excel-to-csv",
        category: "Spreadsheets",
        icon: FileSpreadsheet,
        keywords: ["excel", "xlsx", "csv"],
    },
    {
        name: "CSV to Excel",
        description: "Convert CSV files into Excel spreadsheets.",
        slug: "csv-to-excel",
        category: "Spreadsheets",
        icon: FileSpreadsheet,
        keywords: ["csv", "excel", "xlsx"],
    },
    {
        name: "Excel to JSON",
        description: "Convert Excel data into JSON format.",
        slug: "excel-to-json",
        category: "Spreadsheets",
        icon: FileJson,
        keywords: ["excel", "xlsx", "json"],
    },
    {
        name: "JSON to Excel",
        description: "Convert JSON data into Excel spreadsheets.",
        slug: "json-to-excel",
        category: "Spreadsheets",
        icon: FileSpreadsheet,
        keywords: ["json", "excel", "xlsx"],
    },
    {
        name: "CSV to JSON",
        description: "Convert CSV data into JSON format.",
        slug: "csv-to-json",
        category: "Spreadsheets",
        icon: FileJson,
        keywords: ["csv", "json"],
    },
    {
        name: "JSON to CSV",
        description: "Convert JSON data into CSV format.",
        slug: "json-to-csv",
        category: "Spreadsheets",
        icon: FileJson,
        keywords: ["json", "csv"],
    },

    // PDF TOOLS

    {
        name: "Merge PDF",
        description: "Combine multiple PDF files into one document.",
        slug: "merge-pdf",
        category: "PDF Tools",
        icon: Combine,
        keywords: ["merge", "combine", "pdf"],
    },
    {
        name: "Split PDF",
        description: "Separate PDF pages into individual files.",
        slug: "split-pdf",
        category: "PDF Tools",
        icon: Scissors,
        keywords: ["split", "separate", "pdf"],
    },
    {
        name: "Compress PDF",
        description: "Reduce PDF file size.",
        slug: "compress-pdf",
        category: "PDF Tools",
        icon: Minimize2,
        keywords: ["compress", "reduce", "pdf", "size"],
    },
    {
        name: "Rotate PDF",
        description: "Rotate PDF pages to the correct orientation.",
        slug: "rotate-pdf",
        category: "PDF Tools",
        icon: RotateCw,
        keywords: ["rotate", "orientation", "pdf"],
    },

];

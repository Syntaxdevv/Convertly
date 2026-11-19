import { ChevronDown } from "lucide-react";

import ScrollReveal from "../components/animations/ScrollReveal";

const faqs = [
  {
    question: "What is Convertly?",
    answer:
      "Convertly is an all-in-one file conversion website designed to help users find tools for converting documents, images, spreadsheets, and media files.",
  },
  {
    question: "What file formats does Convertly support?",
    answer:
      "Convertly lists conversion options for formats such as PDF, DOCX, JPG, PNG, WEBP, XLSX, CSV, MP4, MP3, and WAV. Available conversions depend on the tools implemented in the website.",
  },
  {
    question: "How do I convert a file?",
    answer:
      "Choose a converter, select the file you want to process, and choose your preferred output format. Follow the instructions shown by the selected tool.",
  },
  {
    question: "Can I use Convertly without creating an account?",
    answer:
      "Convertly is designed to provide a straightforward file conversion experience. Account requirements may depend on the features available in the website.",
  },
  {
    question: "Is Convertly free to use?",
    answer:
      "The website is intended to provide accessible file conversion tools. Any usage limits or additional requirements will be displayed when applicable.",
  },
  {
    question: "Are my uploaded files safe?",
    answer:
      "Only upload files you have permission to use. File handling and storage depend on the implementation of each conversion tool.",
  },
];

export default function FAQ() {
  return (
    <section
      id="faq"
      className="relative isolate scroll-mt-20 overflow-hidden border-b border-gray-100 bg-[#FAFAFA] py-24"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          backgroundImage: `
            radial-gradient(circle, rgba(0,0,0,0.20) 0.7px, transparent 0.9px),
            linear-gradient(rgba(0,0,0,0.025) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,0,0,0.025) 1px, transparent 1px)
          `,
          backgroundSize: "18px 18px, 72px 72px, 72px 72px",
          backgroundPosition: "center center",
        }}
      />

      <div className="relative z-10 mx-auto max-w-6xl px-6 lg:px-10">
        <div className="grid gap-14 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
          <ScrollReveal>
            <div>
              <p className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-[#C62828]">
                FAQ
              </p>

              <h2 className="text-4xl font-extrabold leading-tight tracking-tight text-[#151515] sm:text-5xl">
                Questions?
                <br />
                We've got
                <br />
                answers.
              </h2>

              <p className="mt-6 max-w-sm text-base leading-7 text-gray-500">
                Find answers to common questions about using Convertly and its
                file conversion tools.
              </p>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={0.15}>
            <div className="divide-y divide-gray-200 border-y border-gray-200">
              {faqs.map((faq, index) => (
                <details
                  key={faq.question}
                  className="group py-6"
                  open={index === 0}
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-5 text-left">
                    <span className="text-base font-bold text-[#242424] transition-colors group-hover:text-[#C62828] sm:text-lg">
                      {faq.question}
                    </span>

                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-gray-200 text-gray-500 transition-all group-open:rotate-180 group-open:border-[#C62828] group-open:text-[#C62828]">
                      <ChevronDown size={17} />
                    </span>
                  </summary>

                  <p className="max-w-2xl pr-10 pt-5 text-sm leading-7 text-gray-500">
                    {faq.answer}
                  </p>
                </details>
              ))}
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}

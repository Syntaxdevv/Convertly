import { ChevronDown } from "lucide-react";

import ScrollReveal from "../components/animations/ScrollReveal";

const faqs = [
  {
    question: "What is Convertly?",
    answer:
      "Convertly is an online file conversion platform that provides simple tools for converting documents and other file formats without complicated steps.",
  },
  {
    question: "What file formats can I convert?",
    answer:
      "Convertly supports different file conversion tools, including PDF, Word, PowerPoint, Excel, JPG, PNG, and TXT conversions. Available tools can be explored directly on the website.",
  },
  {
    question: "How do I convert a file?",
    answer:
      "Choose the conversion tool you need, upload your file, and click the convert button. Once processing is complete, you can download your converted file.",
  },
  {
    question: "Do I need to create an account?",
    answer:
      "No account is required for the available conversion tools. You can use the website directly and start converting your files.",
  },
  {
    question: "Is Convertly free to use?",
    answer:
      "Yes, Convertly is free to use. Some conversion tools that rely on external processing services have a daily usage limit to help manage service availability.",
  },
  {
    question: "How many conversions can I make per day?",
    answer:
      "External API-powered converters have a daily limit of 3 conversions per device. Your usage resets daily according to Philippine time (Asia/Manila).",
  },
  {
    question: "Is my daily limit shared across converters?",
    answer:
      "Yes. Your daily usage is shared across supported external API-powered conversion tools. Using one converter counts toward the same daily limit.",
  },
  {
    question: "Can I use Convertly on different devices?",
    answer:
      "Convertly identifies usage by browser and device identifier. Using another device or browser may have a separate usage count.",
  },
  {
    question: "Are my uploaded files safe?",
    answer:
      "Files are submitted to the processing service required by the selected conversion tool. Avoid uploading confidential, sensitive, or personal files unless you are comfortable with the processing involved.",
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
                Find answers to common questions about Convertly, its conversion
                tools, and daily usage limits.
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

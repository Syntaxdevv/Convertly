import { useRef } from "react";

import { motion, useScroll, useSpring } from "framer-motion";

import { FileUp, FileText, FileCheck, RefreshCw, Download } from "lucide-react";

const steps = [
  {
    number: "01",
    label: "FILE UPLOAD",
    title: "Start with your file",
    description:
      "Select the document, image, or media file you want to convert. Choose a file from your device and prepare it for conversion.",
    action: "Select a file from your device",
    actionIcon: FileUp,
  },
  {
    number: "02",
    label: "CONVERSION FORMAT",
    title: "Pick the format you need",
    description:
      "Choose your preferred output format from the available conversion options. Find the format that fits your next task.",
    action: "Choose your output format",
    actionIcon: RefreshCw,
  },
  {
    number: "03",
    label: "OUTPUT FILE",
    title: "Get your converted file",
    description:
      "Once processing is complete, your output file will be ready to download. Save it to your device and use it whenever you need it.",
    action: "Download your finished file",
    actionIcon: Download,
  },
];

function StepPreview({ step }: { step: number }) {
  if (step === 0) {
    return (
      <>
        <div className="flex items-center justify-between border-b border-gray-100 pb-5">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
            FILE UPLOAD
          </span>

          <span className="rounded-md bg-red-50 px-3 py-1 text-[10px] font-bold text-[#C62828]">
            STEP 01
          </span>
        </div>

        <div className="mt-7 rounded-xl border-2 border-dashed border-gray-200 bg-white px-5 py-10 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-red-50 text-[#C62828]">
            <FileUp size={27} strokeWidth={1.8} />
          </div>

          <h4 className="mt-5 text-lg font-bold text-[#242424]">
            Choose your file
          </h4>

          <p className="mt-2 text-sm text-gray-400">
            Drag and drop or browse your device
          </p>

          <div className="mx-auto mt-6 w-fit rounded-lg bg-[#C62828] px-5 py-2.5 text-xs font-bold text-white">
            Browse files
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-gray-100 bg-white p-4">
            <p className="text-[11px] text-gray-400">File type</p>

            <p className="mt-1 text-sm font-bold">PDF, DOCX</p>
          </div>

          <div className="rounded-xl border border-gray-100 bg-white p-4">
            <p className="text-[11px] text-gray-400">Upload</p>

            <p className="mt-1 text-sm font-bold text-green-600">Ready</p>
          </div>
        </div>
      </>
    );
  }

  if (step === 1) {
    return (
      <>
        <div className="flex items-center justify-between border-b border-gray-100 pb-5">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
            CONVERSION FORMAT
          </span>

          <span className="rounded-md bg-red-50 px-3 py-1 text-[10px] font-bold text-[#C62828]">
            STEP 02
          </span>
        </div>

        <div className="mt-6 space-y-3">
          {[
            {
              name: "PDF Document",
              extension: ".pdf",
            },
            {
              name: "Word Document",
              extension: ".docx",
            },
            {
              name: "JPG Image",
              extension: ".jpg",
            },
            {
              name: "PNG Image",
              extension: ".png",
            },
          ].map((item, index) => (
            <div
              key={item.extension}
              className={`flex items-center justify-between rounded-xl border p-4 ${
                index === 1
                  ? "border-[#C62828] bg-red-50"
                  : "border-gray-100 bg-white"
              }`}
            >
              <div className="flex items-center gap-3">
                <FileText
                  size={19}
                  className={index === 1 ? "text-[#C62828]" : "text-gray-400"}
                />

                <span className="text-sm font-bold text-[#242424]">
                  {item.name}
                </span>
              </div>

              <span
                className={`text-xs font-semibold ${
                  index === 1 ? "text-[#C62828]" : "text-gray-400"
                }`}
              >
                {item.extension}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-5 flex items-center justify-between rounded-xl border border-gray-100 bg-white p-4">
          <span className="text-xs font-medium text-gray-500">
            Selected format
          </span>

          <span className="text-xs font-bold text-[#C62828]">DOCX</span>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between border-b border-gray-100 pb-5">
        <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
          OUTPUT FILE
        </span>

        <span className="rounded-md bg-red-50 px-3 py-1 text-[10px] font-bold text-[#C62828]">
          STEP 03
        </span>
      </div>

      <div className="mt-7 rounded-xl border border-gray-100 bg-white p-5">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-red-50 text-[#C62828]">
            <FileCheck size={28} strokeWidth={1.8} />
          </div>

          <div className="min-w-0 flex-1">
            <h4 className="truncate text-sm font-bold text-[#242424]">
              converted-file.docx
            </h4>

            <p className="mt-1 text-xs text-gray-400">Output preview</p>
          </div>

          <span className="rounded-full bg-green-50 px-3 py-1 text-[10px] font-bold text-green-600">
            Ready
          </span>
        </div>

        <div className="mt-7 h-1.5 overflow-hidden rounded-full bg-gray-100">
          <div className="h-full w-full rounded-full bg-[#C62828]" />
        </div>

        <div className="mt-5 flex justify-between text-xs">
          <span className="text-gray-400">Conversion status</span>

          <span className="font-bold text-green-600">Complete</span>
        </div>

        <div className="mt-7 flex items-center justify-center gap-2 rounded-lg bg-[#C62828] py-3.5 text-sm font-bold text-white">
          <Download size={17} />
          Download file
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-gray-100 bg-white p-4">
          <p className="text-[11px] text-gray-400">Output</p>

          <p className="mt-1 text-sm font-bold">DOCX</p>
        </div>

        <div className="rounded-xl border border-gray-100 bg-white p-4">
          <p className="text-[11px] text-gray-400">Status</p>

          <p className="mt-1 text-sm font-bold text-green-600">Ready</p>
        </div>
      </div>
    </>
  );
}

export default function HowItWorks() {
  const timelineRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: timelineRef,
    offset: ["start 70%", "end 70%"],
  });

  const lineProgress = useSpring(scrollYProgress, {
    stiffness: 80,
    damping: 25,
    mass: 0.5,
  });

  return (
    <section
      id="how-it-works"
      className="relative isolate scroll-mt-20 overflow-hidden border-b border-gray-100 bg-[#FAFAFA] py-24"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          backgroundColor: "#FAFAFA",
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
        <motion.div
          initial={{
            opacity: 0,
            y: 25,
          }}
          whileInView={{
            opacity: 1,
            y: 0,
          }}
          viewport={{
            once: true,
            amount: 0.5,
          }}
          transition={{
            duration: 0.7,
          }}
          className="mx-auto mb-24 max-w-2xl text-center"
        >
          <p className="mb-5 text-xs font-bold uppercase tracking-[0.2em] text-[#C62828]">
            HOW CONVERTLY WORKS
          </p>

          <h2 className="text-4xl font-extrabold leading-[1.05] tracking-tight text-[#151515] sm:text-5xl md:text-6xl">
            Three steps.
            <br />
            One simple process.
          </h2>

          <p className="mx-auto mt-6 max-w-xl text-base leading-7 text-gray-500">
            From selecting your file to getting your output, converting files
            should be straightforward.
          </p>
        </motion.div>

        <div ref={timelineRef} className="relative">
          <div className="absolute bottom-10 left-1/2 top-10 hidden w-px -translate-x-1/2 bg-gray-200 md:block" />

          <motion.div
            style={{
              scaleY: lineProgress,
            }}
            className="absolute bottom-10 left-1/2 top-10 hidden w-[2px] origin-top -translate-x-1/2 bg-[#C62828] md:block"
          />

          <div className="space-y-20 md:space-y-28">
            {steps.map((step, index) => {
              const ActionIcon = step.actionIcon;
              const isLeft = index % 2 === 0;

              return (
                <div
                  key={step.number}
                  className={`relative grid items-center gap-10 md:grid-cols-2 md:gap-20 ${
                    isLeft ? "" : "md:[&>*:first-child]:order-2"
                  }`}
                >
                  <motion.div
                    initial={{
                      opacity: 0,
                      x: isLeft ? -60 : 60,
                    }}
                    whileInView={{
                      opacity: 1,
                      x: 0,
                    }}
                    viewport={{
                      once: true,
                      amount: 0.25,
                    }}
                    transition={{
                      duration: 0.7,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                    className={`relative ${isLeft ? "md:pr-12" : "md:pl-12"}`}
                  >
                    <div className="mb-5 flex items-center gap-3">
                      <span className="text-sm font-extrabold tracking-widest text-[#C62828]">
                        {step.number}
                      </span>

                      <span className="h-px w-8 bg-red-200" />

                      <span className="text-[11px] font-bold tracking-[0.15em] text-gray-400">
                        {step.label}
                      </span>
                    </div>

                    <h3 className="text-3xl font-extrabold leading-tight tracking-tight text-[#151515] sm:text-4xl">
                      {step.title}
                    </h3>

                    <p className="mt-5 max-w-md text-base leading-7 text-gray-500">
                      {step.description}
                    </p>

                    <div className="mt-7 flex items-center gap-3 text-sm font-bold text-[#242424]">
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-red-50 text-[#C62828]">
                        <ActionIcon size={17} />
                      </span>

                      {step.action}
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{
                      scale: 0,
                      opacity: 0,
                    }}
                    whileInView={{
                      scale: 1,
                      opacity: 1,
                    }}
                    viewport={{
                      once: false,
                      amount: 0.5,
                    }}
                    transition={{
                      duration: 0.5,
                      delay: 0.15,
                    }}
                    className="absolute left-1/2 top-1/2 z-10 hidden h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-[4px] border-white bg-[#C62828] shadow-[0_0_0_1px_#C62828] md:block"
                  />

                  <motion.div
                    initial={{
                      opacity: 0,
                      x: isLeft ? 60 : -60,
                      y: 20,
                    }}
                    whileInView={{
                      opacity: 1,
                      x: 0,
                      y: 0,
                    }}
                    viewport={{
                      once: true,
                      amount: 0.2,
                    }}
                    transition={{
                      duration: 0.8,
                      delay: 0.1,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                    className={`rounded-2xl border border-gray-200 bg-white/90 p-5 shadow-sm transition-colors hover:border-red-200 sm:p-7 ${
                      isLeft ? "md:ml-12" : "md:mr-12"
                    }`}
                  >
                    <StepPreview step={index} />
                  </motion.div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

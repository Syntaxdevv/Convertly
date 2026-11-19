import { ArrowUpRight } from "lucide-react";
import ScrollReveal from "../components/animations/ScrollReveal";

export default function About() {
  return (
    <section
      id="about"
      className="relative isolate overflow-hidden bg-[#FAFAFA] py-16 sm:py-20"
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
        <ScrollReveal>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#C62828]">
              A little about Convertly
            </span>
          </div>
        </ScrollReveal>

        <div className="mt-8 grid items-center gap-12 lg:mt-10 lg:grid-cols-[1.2fr_0.8fr] lg:gap-20">
          <ScrollReveal>
            <div>
              <h2 className="max-w-3xl text-[clamp(2.8rem,5.5vw,5rem)] font-extrabold leading-[1.04] tracking-[-0.055em] text-[#171717]">
                Different
                <br />
                formats.
                <br />
                <span className="text-[#C62828]">One destination.</span>
              </h2>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={0.15}>
            <div className="max-w-[390px] lg:justify-self-end">
              <p className="text-[15px] leading-[1.9] tracking-[-0.01em] text-[#686868] sm:text-base">
                Convertly is a web-based project built to make exploring file
                conversion tools easier.
              </p>

              <p className="mt-5 text-[15px] leading-[1.9] tracking-[-0.01em] text-[#686868] sm:text-base">
                With different tools organized in one place, users can find
                options for working with documents, images, spreadsheets, and
                media files without unnecessary searching.
              </p>

              <a
                href="#tools"
                className="mt-8 inline-flex items-center gap-2 border-b border-[#C62828] pb-2 text-[13px] font-semibold tracking-[-0.01em] text-[#242424] transition-all duration-200 hover:gap-3 hover:text-[#C62828]"
              >
                Explore Convertly
                <ArrowUpRight size={15} />
              </a>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}

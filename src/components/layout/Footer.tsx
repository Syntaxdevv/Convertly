import { Heart } from "lucide-react";

export default function Footer() {
  return (
    <footer className="relative isolate overflow-hidden border-t border-gray-200 bg-[#FAFAFA]">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          backgroundImage: `
                        radial-gradient(circle, rgba(0,0,0,0.16) 0.7px, transparent 0.9px),
                        linear-gradient(rgba(0,0,0,0.025) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(0,0,0,0.025) 1px, transparent 1px)
                    `,
          backgroundSize: "18px 18px, 72px 72px, 72px 72px",
          backgroundPosition: "center center",
        }}
      />

      <div className="relative z-10 mx-auto flex max-w-6xl flex-col items-center justify-center gap-3 px-6 py-8 sm:flex-row sm:gap-5 lg:px-10">
        <p className="text-xs font-medium tracking-wide text-gray-500">
          © {new Date().getFullYear()} Convertly.
        </p>

        <span className="hidden h-4 w-px bg-gray-300 sm:block" />

        <p className="flex items-center gap-1.5 text-xs tracking-wide text-gray-500">
          Created by
          <span className="font-bold text-[#242424]">Sheik</span>
          <Heart size={13} fill="#C62828" stroke="#C62828" className="ml-0.5" />
        </p>
      </div>
    </footer>
  );
}

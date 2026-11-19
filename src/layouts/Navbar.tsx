import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";

export default function Navbar() {
  return (
    <header className="border-b border-slate-100 bg-white">
      <nav className="mx-auto flex h-[76px] max-w-7xl items-center justify-between px-6 lg:px-10">
        <Link
          to="/"
          className="text-[26px] font-bold tracking-tight text-[#17365d]"
        >
          convertly<span className="text-[#009b9b]">.</span>
        </Link>

        <div className="hidden items-center gap-9 text-sm font-medium text-slate-600 md:flex">
          <a href="#tools" className="transition hover:text-[#009b9b]">
            All tools
          </a>
          <a href="#how-it-works" className="transition hover:text-[#009b9b]">
            How it works
          </a>
          <a href="#about" className="transition hover:text-[#009b9b]">
            About
          </a>
        </div>

        <a
          href="#tools"
          className="flex items-center gap-2 rounded-lg bg-[#17365d] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#214875]"
        >
          Explore tools
          <ArrowUpRight size={16} />
        </a>
      </nav>
    </header>
  );
}

import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";

export default function Navbar() {
  return (
    <header className="border-b border-gray-100 bg-white">
      <nav className="mx-auto flex h-[76px] max-w-7xl items-center justify-between px-6 lg:px-10">
        <Link
          to="/"
          className="text-[26px] font-black tracking-[-0.06em] text-[#242424]"
        >
          convertly<span className="text-[#C62828">.</span>
        </Link>

        <div className="hidden items-center gap-9 text-sm font-medium text-gray-600 md:flex">
          <a href="#tools" className="transition-colors hover:text-[#C62828]">
            All tools
          </a>

          <a
            href="#how-it-works"
            className="transition-colors hover:text-[#C62828" >
            How it works
          </a>

          <a href="#about" className="transition-colors hover:text-[#C62828">
            About
          </a>
        </div>

        <a
          href="#tools"
          className="flex items-center gap-2 rounded-full bg-[#C62828] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#A91F1F]">
          Browse converters
          <ArrowUpRight size={16} />
        </a>
      </nav>
    </header>
  );
}

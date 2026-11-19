
import { Link } from "react-router-dom";

export default function ConverterNavbar() {
  return (
    <header className="border-b border-gray-100 bg-white">
      <nav className="mx-auto flex h-[76px] max-w-7xl items-center justify-between px-6 lg:px-10">
        <Link
          to="/"
          className="text-[26px] font-black tracking-[-0.06em] text-[#242424]">
          convertly<span className="text-[#C62828]">.</span>
        </Link>
      </nav>
    </header>
  );
}


import {
  Search,
  ArrowRight,
  FileText,
  Image as ImageIcon,
  FileSpreadsheet,
} from "lucide-react";

import { Link } from "react-router-dom";

import { tools } from "../data/tools";

interface HeroProps {
  search: string;
  onSearchChange: (value: string) => void;
  onSearchSubmit: () => void;
}

const categories = [
  { name: "Documents", icon: FileText },
  { name: "Images", icon: ImageIcon },
  { name: "Spreadsheets", icon: FileSpreadsheet },
];

export default function Hero({
  search,
  onSearchChange,
  onSearchSubmit,
}: HeroProps) {
  const query = search.toLowerCase().trim();

  const searchTerms = query.split(/\s+/).filter(Boolean);

  const filteredTools = tools.filter((tool) => {
    const searchableText = [
      tool.name,
      tool.description,
      tool.category,
      tool.slug.replace(/-/g, " "),
      ...tool.keywords,
    ]
      .join(" ")
      .toLowerCase();

    return searchTerms.every((term) => searchableText.includes(term));
  });

  const searchResults = filteredTools.slice(0, 7);

  return (
    <section className="relative isolate overflow-hidden bg-[#FAFAFA]">
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

      <div className="relative z-10 mx-auto max-w-6xl px-6 pb-20 pt-28 text-center sm:pt-36 lg:px-10">
        <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-red-100 bg-white px-4 py-2 text-xs font-bold tracking-wide text-[#C62828]">
          <span className="h-2 w-2 rounded-full bg-[#C62828]" />A SIMPLE WAY TO
          CONVERT FILES
        </div>

        <h1 className="mx-auto max-w-4xl text-5xl font-extrabold leading-[1.02] tracking-[-0.055em] text-[#151515] sm:text-6xl lg:text-7xl">
          Your files.
          <br />
          Your <span className="text-[#C62828">format.</span>
        </h1>

        <p className="mx-auto mt-7 max-w-2xl text-base leading-7 text-gray-500 sm:text-lg">
          Find the right converter for your documents, images,and spreadsheets files. Make file conversion straightforward.
        </p>

        <div className="mx-auto mt-10 max-w-2xl">
          <div className="relative">
            <div className="relative z-20 flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-2 shadow-sm transition-all duration-200 focus-within:border-[#C62828] focus-within:shadow-md">
              <Search size={21} className="ml-3 shrink-0 text-gray-400" />

              <input
                type="text"
                value={search}
                onChange={(event) => onSearchChange(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    onSearchSubmit();
                  }

                  if (event.key === "Escape") {
                    onSearchChange("");
                  }
                }}
                placeholder="Search by file type or format..."
                autoComplete="off"
                className="h-12 min-w-0 flex-1 bg-transparent text-sm text-[#242424] outline-none placeholder:text-gray-400"
              />

              {search && (
                <button
                  type="button"
                  onClick={() => onSearchChange("")}
                  className="shrink-0 px-2 text-lg text-gray-400 transition hover:text-[#C62828]"
                  aria-label="Clear search"
                >
                  ×
                </button>
              )}

              <button
                type="button"
                onClick={onSearchSubmit}
                className="hidden items-center gap-2 rounded-lg bg-[#C62828] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#A91F1F] sm:flex"
              >
                Search
                <ArrowRight size={16} />
              </button>
            </div>

            {query && (
              <div className="absolute left-0 right-0 top-full z-30 mt-2 overflow-hidden rounded-xl border border-gray-200 bg-white text-left shadow-xl">
                <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
                    Matching converters
                  </span>

                  <span className="text-xs text-gray-400">
                    {filteredTools.length} found
                  </span>
                </div>

                {searchResults.length > 0 ? (
                  <div className="max-h-[320px] overflow-y-auto p-2">
                    {searchResults.map((tool) => {
                      const Icon = tool.icon;

                      return (
                        <Link
                          key={tool.slug}
                          to={`/convert/${tool.slug}`}
                          className="group flex items-center gap-3 rounded-lg px-3 py-3 transition-colors hover:bg-red-50"
                        >
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-gray-100 text-gray-500 transition-colors group-hover:bg-red-100 group-hover:text-[#C62828]">
                            <Icon size={18} />
                          </div>

                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-[#242424] group-hover:text-[#C62828]">
                              {tool.name}
                            </p>

                            <p className="mt-0.5 truncate text-xs text-gray-400">
                              {tool.description}
                            </p>
                          </div>

                          <ArrowRight
                            size={16}
                            className="shrink-0 text-gray-300 transition group-hover:translate-x-1 group-hover:text-[#C62828]"
                          />
                        </Link>
                      );
                    })}
                  </div>
                ) : (
                  <div className="px-4 py-8 text-center">
                    <Search size={24} className="mx-auto text-gray-300" />

                    <p className="mt-3 text-sm font-semibold text-[#242424]">
                      No converters found
                    </p>

                    <p className="mt-1 text-xs text-gray-400">
                      Try another file type or format.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-x-10 gap-y-5 text-xs font-semibold text-gray-400">
          {categories.map((category) => {
            const Icon = category.icon;

            return (
              <div key={category.name} className="flex items-center gap-2">
                <Icon size={16} />
                {category.name}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

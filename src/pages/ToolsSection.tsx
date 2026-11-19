import { Search, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

import { tools } from "../data/tools";
import ScrollReveal from "../components/animations/ScrollReveal";

interface ToolsSectionProps {
  search: string;
  onClearSearch: () => void;
}

const categories = ["Documents", "Images", "Spreadsheets", "PDF Tools"];

export default function ToolsSection({
  search,
  onClearSearch,
}: ToolsSectionProps) {
  const query = search.toLowerCase().trim();

  const filteredTools = tools.filter((tool) =>
    [tool.name, tool.description, tool.category, ...tool.keywords].some(
      (value) => value.toLowerCase().includes(query),
    ),
  );

  const groupedTools = categories.map((category) => ({
    name: category,
    items: filteredTools.filter((tool) => tool.category === category),
  }));

  return (
    <section
      id="tools"
      className="relative isolate scroll-mt-20 overflow-hidden bg-[#FAFAFA] py-16"
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
        <ScrollReveal>
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold tracking-tight text-[#242424] sm:text-4xl">
              {search ? "Search Results" : "Available Converters"}
            </h2>

            <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-gray-500">
              Choose a tool to convert your files into another format.
            </p>

            {search && (
              <button
                type="button"
                onClick={onClearSearch}
                className="mt-3 text-sm font-medium text-[#C62828] hover:underline"
              >
                Clear search
              </button>
            )}
          </div>
        </ScrollReveal>

        {filteredTools.length > 0 ? (
          <div className="space-y-10">
            {groupedTools.map(
              (group) =>
                group.items.length > 0 && (
                  <div key={group.name}>
                    <ScrollReveal>
                      <div className="mb-4 flex items-center justify-between border-b border-gray-200 pb-3">
                        <h3 className="text-lg font-bold text-[#242424]">
                          {group.name}
                        </h3>

                        <span className="text-xs text-gray-400">
                          {group.items.length} tools
                        </span>
                      </div>
                    </ScrollReveal>

                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {group.items.map((tool, index) => {
                        const Icon = tool.icon;

                        return (
                          <ScrollReveal key={tool.slug} delay={index * 0.04}>
                            <Link
                              to={`/convert/${tool.slug}`}
                              className="group flex h-full items-start gap-3 border border-gray-200 bg-white/80 p-4 transition-colors hover:border-[#C62828] hover:bg-white"
                            >
                              <div className="flex h-9 w-9 shrink-0 items-center justify-center bg-gray-100 text-gray-600 transition-colors group-hover:bg-red-50 group-hover:text-[#C62828]">
                                <Icon size={18} />
                              </div>

                              <div className="min-w-0 flex-1">
                                <h4 className="text-sm font-semibold text-[#242424]">
                                  {tool.name}
                                </h4>

                                <p className="mt-1.5 text-xs leading-5 text-gray-500">
                                  {tool.description}
                                </p>
                              </div>

                              <ArrowRight
                                size={16}
                                className="mt-1 shrink-0 text-gray-400 transition-transform group-hover:translate-x-1 group-hover:text-[#C62828]"
                              />
                            </Link>
                          </ScrollReveal>
                        );
                      })}
                    </div>
                  </div>
                ),
            )}
          </div>
        ) : (
          <ScrollReveal>
            <div className="border border-gray-200 bg-white/80 py-14 text-center">
              <Search size={26} className="mx-auto text-gray-400" />

              <h3 className="mt-4 text-sm font-semibold text-[#242424]">
                No converters found
              </h3>

              <p className="mt-2 text-xs text-gray-500">
                Try searching for another file format.
              </p>

              <button
                type="button"
                onClick={onClearSearch}
                className="mt-4 text-sm font-semibold text-[#C62828] hover:underline"
              >
                View all converters
              </button>
            </div>
          </ScrollReveal>
        )}
      </div>
    </section>
  );
}

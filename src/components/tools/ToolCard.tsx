import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import type { ConverterTool } from "../../data/tools";

interface ToolCardProps {
  tool: ConverterTool;
}

export default function ToolCard({ tool }: ToolCardProps) {
  const Icon = tool.icon;

  return (
    <Link
      to={`/convert/${tool.slug}`}
      className="group flex items-start gap-4 rounded-xl border border-slate-200 bg-white p-5 transition hover:border-[#009b9b] hover:shadow-sm">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-[#17365d] group-hover:bg-[#e8f7f7] group-hover:text-[#009b9b]">
        <Icon size={21} strokeWidth={1.8} />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-semibold text-[#17365d]">{tool.name}</h3>
          <ArrowUpRight
            size={17}
            className="shrink-0 text-slate-400 transition group-hover:text-[#009b9b]"
          />
        </div>

        <p className="mt-1 text-sm leading-6 text-slate-500">
          {tool.description}
        </p>

        <span className="mt-3 inline-block text-xs font-medium text-[#009b9b]">
          {tool.category}
        </span>
      </div>
    </Link>
  );
}

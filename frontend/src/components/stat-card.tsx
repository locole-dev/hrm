import type { ReactNode } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type StatCardProps = {
  title: string;
  value: string;
  hint?: string;
  icon?: ReactNode;
  badge?: string;
  tone?: "emerald" | "amber" | "coral" | "slate";
  visual?: ReactNode;
  className?: string;
};

const toneMap = {
  emerald: {
    chip: "bg-[#13b67d] text-white",
    iconWrap: "bg-[#e7f8f1] text-[#13b67d]",
  },
  amber: {
    chip: "bg-[#ffca28] text-[#5b4300]",
    iconWrap: "bg-[#fff5d9] text-[#e1a500]",
  },
  coral: {
    chip: "bg-[#11a36b] text-white",
    iconWrap: "bg-[#e8f4ee] text-[#11a36b]",
  },
  slate: {
    chip: "bg-[#dfe6eb] text-[#3a4a57]",
    iconWrap: "bg-[#edf2f5] text-[#4c6270]",
  },
} satisfies Record<NonNullable<StatCardProps["tone"]>, { chip: string; iconWrap: string }>;

export function StatCard({
  title,
  value,
  hint,
  icon,
  badge,
  tone = "emerald",
  visual,
  className,
}: StatCardProps) {
  const palette = toneMap[tone];

  return (
    <Card
      className={cn(
        "rounded-[1.5rem] border border-[#e6ece8] bg-white shadow-[0_10px_24px_rgba(34,62,50,0.06)]",
        className,
      )}
    >
      <CardHeader className="flex flex-row items-start justify-between space-y-0 px-5 pb-2 pt-5">
        <div className="space-y-1">
          <p className="text-xs font-medium text-[#3a4a57]">{title}</p>
          <CardTitle className="text-[2rem] font-semibold tracking-[-0.08em] text-[#182126]">
            {value}
          </CardTitle>
        </div>
        <div className="flex items-center gap-3">
          {badge ? (
            <div className={cn("rounded-full px-2.5 py-1 text-[0.7rem] font-semibold", palette.chip)}>
              {badge}
            </div>
          ) : null}
          {icon ? (
            <div className={cn("rounded-xl p-2.5", palette.iconWrap)}>
              {icon}
            </div>
          ) : null}
        </div>
      </CardHeader>
      {(hint || visual) ? (
        <CardContent className="space-y-3 px-5 pb-5 pt-0">
          {visual ? <div>{visual}</div> : null}
          {hint ? <div className="text-xs leading-5 text-[#70808b]">{hint}</div> : null}
        </CardContent>
      ) : null}
    </Card>
  );
}

import { cn } from "@/lib/cn";

type Tone = "blue" | "green" | "amber" | "grey" | "orange";

const tones: Record<Tone, string> = {
  blue: "bg-primary/10 text-primary-dark",
  green: "bg-emerald-50 text-emerald-700",
  amber: "bg-amber-50 text-warning",
  orange: "bg-orange-50 text-orange-700",
  grey: "bg-background text-muted",
};

export function Badge({
  tone = "grey",
  children,
  className,
}: {
  tone?: Tone;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

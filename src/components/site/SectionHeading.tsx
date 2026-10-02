import { cn } from "@/lib/cn";

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  light = false,
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  light?: boolean;
  className?: string;
}) {
  return (
    <div className={cn(align === "center" && "mx-auto max-w-2xl text-center", className)}>
      {eyebrow && <p className="eyebrow">{eyebrow}</p>}
      <h2 className={cn("mt-2 text-3xl sm:text-4xl", light && "text-white")}>{title}</h2>
      {description && (
        <p className={cn("mt-4 text-base leading-relaxed text-muted", light && "text-white/70")}>{description}</p>
      )}
    </div>
  );
}

import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/cn";

/**
 * MOVONHUB brand lockup.
 *
 * Uses the authoritative original `MovonHub Logo.png` (whitespace-trimmed
 * derivative — artwork and proportions preserved; never redrawn/recoloured).
 * Beside it, the "MovonHub" wordmark mirrors the logo's two-tone identity:
 * "M" in the logo's blue family and "H" in the logo's slate family.
 *
 * - variant "dark"  → for light backgrounds
 * - variant "light" → for dark backgrounds (logo on a light plate)
 */
export function Logo({
  variant = "dark",
  href = "/",
  className,
  showWordmark = true,
}: {
  variant?: "dark" | "light";
  href?: string;
  className?: string;
  showWordmark?: boolean;
}) {
  const colors =
    variant === "light"
      ? { m: "#4C91FF", h: "#94A3B8", base: "#F8FAFC" }
      : { m: "#1E7BFF", h: "#2B3947", base: "#1F2A37" };

  const image = (
    <Image
      src="/brand/movonhub-logo.png"
      alt=""
      width={805}
      height={475}
      priority
      className="h-8 w-auto shrink-0 sm:h-9"
    />
  );

  return (
    <Link
      href={href}
      aria-label="MovonHub home"
      className={cn("inline-flex items-center gap-2.5", className)}
    >
      {variant === "light" ? (
        <span className="inline-flex items-center rounded-xl bg-white px-2.5 py-1.5 shadow-sm">{image}</span>
      ) : (
        image
      )}
      {showWordmark && (
        <span className="text-lg font-extrabold tracking-tight sm:text-xl" aria-hidden="true">
          <span style={{ color: colors.m }}>M</span>
          <span style={{ color: colors.base }}>ovon</span>
          <span style={{ color: colors.h }}>H</span>
          <span style={{ color: colors.base }}>ub</span>
        </span>
      )}
    </Link>
  );
}

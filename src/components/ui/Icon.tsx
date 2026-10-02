import {
  Baby,
  Calculator,
  Gauge,
  Home,
  LayoutGrid,
  MessageCircle,
  Sparkles,
  Wrench,
  type LucideIcon,
} from "lucide-react";

const map: Record<string, LucideIcon> = {
  baby: Baby,
  calculator: Calculator,
  gauge: Gauge,
  home: Home,
  "layout-grid": LayoutGrid,
  "message-circle": MessageCircle,
  sparkles: Sparkles,
  wrench: Wrench,
};

export function Icon({ name, className }: { name?: string; className?: string }) {
  const Cmp = (name && map[name]) || Sparkles;
  return <Cmp className={className} aria-hidden="true" />;
}

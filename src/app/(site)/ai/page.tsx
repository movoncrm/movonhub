import type { Metadata } from "next";
import { Badge } from "@/components/ui/Badge";
import { SectionHeading } from "@/components/site/SectionHeading";
import { Bot, GitCompare, HelpCircle, MessageSquareText, PackageSearch, Receipt, ShieldQuestion } from "lucide-react";
import { getI18n } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return {
    title: t("ai.title"),
    description: t("ai.body"),
    alternates: { canonical: "/ai" },
  };
}

export default async function AiPage() {
  const { t } = await getI18n();
  const configured = Boolean(process.env.AI_API_KEY && process.env.AI_PROVIDER);

  const capabilities = [
    { icon: PackageSearch, title: t("ai.c1Title"), body: t("ai.c1Body") },
    { icon: GitCompare, title: t("ai.c2Title"), body: t("ai.c2Body") },
    { icon: Receipt, title: t("ai.c3Title"), body: t("ai.c3Body") },
    { icon: ShieldQuestion, title: t("ai.c4Title"), body: t("ai.c4Body") },
    { icon: MessageSquareText, title: t("ai.c5Title"), body: t("ai.c5Body") },
    { icon: HelpCircle, title: t("ai.c6Title"), body: t("ai.c6Body") },
  ];

  return (
    <div className="container-page py-14">
      <div className="grid items-start gap-10 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <SectionHeading eyebrow={t("ai.eyebrow")} title={t("ai.title")} description={t("ai.body")} />
          <div className="mt-6">
            <Badge tone={configured ? "green" : "amber"}>
              {configured ? t("ai.configured") : t("ai.notConfigured")}
            </Badge>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted">
              {configured ? t("ai.configuredBody") : t("ai.notConfiguredBody")}
            </p>
          </div>

          <div className="mt-8 flex items-start gap-3 rounded-2xl border border-borderline bg-background p-5">
            <Bot className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <p className="text-sm leading-relaxed text-muted">{t("ai.grounding")}</p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {capabilities.map((cap) => (
            <div key={cap.title} className="card-surface p-5">
              <cap.icon className="h-5 w-5 text-primary" />
              <h3 className="mt-3 text-sm font-bold">{cap.title}</h3>
              <p className="mt-1 text-xs leading-relaxed text-muted">{cap.body}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

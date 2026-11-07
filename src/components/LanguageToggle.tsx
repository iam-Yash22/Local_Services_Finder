import { useTranslation } from "react-i18next";
import { Languages } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LanguageToggle() {
  const { i18n, t } = useTranslation();
  const current = i18n.language?.startsWith("hi") ? "hi" : "en";
  const toggle = () => i18n.changeLanguage(current === "en" ? "hi" : "en");

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggle}
      className="gap-1.5 font-medium"
      aria-label={`${t("common.language")}: ${current === "en" ? t("common.hindi") : t("common.english")}`}
    >
      <Languages className="h-4 w-4" />
      <span className={current === "en" ? "text-primary" : "text-muted-foreground"}>EN</span>
      <span className="text-muted-foreground/50">/</span>
      <span className={current === "hi" ? "text-primary" : "text-muted-foreground"}>हिं</span>
    </Button>
  );
}

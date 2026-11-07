import { MapPin } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function Footer() {
  const { t } = useTranslation();
  return (
    <footer className="border-t border-border bg-card mt-auto">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
          <div className="flex items-center gap-2 font-semibold">
            <MapPin className="h-5 w-5 text-primary" />
            <span>LocalFind</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} LocalFind. {t("footer.description")}
          </p>
        </div>
      </div>
    </footer>
  );
}

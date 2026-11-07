import { Search, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTranslation } from "react-i18next";
import { translateCategory } from "@/i18n/labels";

const CATEGORIES = [
  "All Categories",
  "Plumbing",
  "Electrical",
  "Cleaning",
  "Painting",
  "Carpentry",
  "Landscaping",
  "Moving",
  "Tutoring",
  "Photography",
  "Catering",
];

interface SearchBarProps {
  search: string;
  onSearchChange: (v: string) => void;
  category: string;
  onCategoryChange: (v: string) => void;
  city: string;
  onCityChange: (v: string) => void;
}

export default function SearchBar({
  search, onSearchChange, category, onCategoryChange, city, onCityChange,
}: SearchBarProps) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder={t("search.placeholder")}
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>
      <Select value={category} onValueChange={onCategoryChange}>
        <SelectTrigger className="w-full sm:w-48">
          <SelectValue placeholder={t("search.category")} />
        </SelectTrigger>
        <SelectContent>
          {CATEGORIES.map((c) => (
            <SelectItem key={c} value={c}>{translateCategory(c, t)}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <div className="relative w-full sm:w-44">
        <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder={t("search.city")}
          value={city}
          onChange={(e) => onCityChange(e.target.value)}
          className="pl-9"
        />
      </div>
    </div>
  );
}

export { CATEGORIES };

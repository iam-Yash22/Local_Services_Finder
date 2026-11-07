import { Link } from "react-router-dom";
import { MapPin, Star, Tag, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { translateCategory, translateTag } from "@/i18n/labels";

interface ServiceCardProps {
  id: string;
  title: string;
  category: string;
  description: string;
  city: string;
  providerName: string;
  averageRating: number;
  reviewCount: number;
  priceRange?: string;
  tags?: string[];
}

export default function ServiceCard({
  id, title, category, description, city, providerName, averageRating, reviewCount, priceRange, tags,
}: ServiceCardProps) {
  const { t } = useTranslation();
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -6, scale: 1.02 }}
      className="h-full"
    >
      <Link to={`/services/${id}`} className="group block h-full">
        <div className="h-full rounded-2xl border border-border/50 glass-card p-6 transition-all duration-300 hover:shadow-elevated hover:border-primary/20">
          {/* Provider Name */}
          <div className="flex items-center gap-2 mb-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
              <User className="h-4 w-4 text-primary" />
            </div>
            <span className="font-bold text-foreground text-sm tracking-wide">
              {providerName}
            </span>
          </div>

          {/* Category & Price */}
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="secondary" className="text-xs font-medium">
              <Tag className="mr-1 h-3 w-3" />{translateCategory(category, t)}
            </Badge>
            {priceRange && (
              <span className="text-xs font-semibold text-accent">{priceRange}</span>
            )}
          </div>

          {/* Title */}
          <h3 className="font-bold text-lg leading-tight group-hover:text-primary transition-colors line-clamp-1">
            {title}
          </h3>

          {/* Description */}
          <p className="mt-1.5 text-sm text-muted-foreground line-clamp-2 leading-relaxed">
            {description}
          </p>

          {/* Tags */}
          {tags && tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {tags.slice(0, 4).map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-primary/8 px-2 py-0.5 text-[10px] font-semibold text-primary border border-primary/15"
                >
                  {translateTag(tag, t)}
                </span>
              ))}
              {tags.length > 4 && (
                <span className="text-[10px] text-muted-foreground font-medium">+{tags.length - 4}</span>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <div className="flex items-center gap-0.5">
                <Star className="h-4 w-4 fill-warning text-warning" />
                <span className="text-sm font-bold">
                  {averageRating > 0 ? averageRating.toFixed(1) : t("services.new")}
                </span>
              </div>
              <span className="text-xs text-muted-foreground">
                ({reviewCount})
              </span>
            </div>
            <span className="flex items-center gap-1 text-xs text-muted-foreground font-medium">
              <MapPin className="h-3.5 w-3.5" />{city}
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

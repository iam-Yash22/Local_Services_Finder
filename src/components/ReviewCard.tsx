import { Star } from "lucide-react";
import { useTranslation } from "react-i18next";

interface ReviewCardProps {
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export default function ReviewCard({ userName, rating, comment, createdAt }: ReviewCardProps) {
  const { i18n } = useTranslation();
  return (
    <div className="rounded-xl border border-border/50 glass-card p-4 transition-shadow duration-200 hover:shadow-elevated">
      <div className="flex items-center justify-between mb-2">
        <span className="font-medium text-sm">{userName}</span>
        <div className="flex items-center gap-0.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={`h-3.5 w-3.5 transition-colors ${i < rating ? "fill-warning text-warning" : "text-muted-foreground/30"}`}
            />
          ))}
        </div>
      </div>
      <p className="text-sm text-muted-foreground">{comment}</p>
      <p className="mt-2 text-xs text-muted-foreground/70">
        {new Date(createdAt).toLocaleDateString(i18n.language.startsWith("hi") ? "hi-IN" : "en-IN")}
      </p>
    </div>
  );
}

import { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import { apiRequest, ApiService } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import ReviewCard from "@/components/ReviewCard";
import ProviderGallery from "@/components/ProviderGallery";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, MapPin, Phone, Star, Tag, DollarSign, ArrowUpDown } from "lucide-react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { translateCategory } from "@/i18n/labels";

type SortMode = "newest" | "highest";
interface ServiceReview {
  id: string;
  user_id: string;
  service_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  profiles: { name: string } | null;
}
interface ServiceDetailData extends ApiService {
  profiles: { name: string; email: string; phone: string | null; city: string } | null;
  reviews: ServiceReview[];
}

export default function ServiceDetail() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const { user, role } = useAuth();
  const [service, setService] = useState<ServiceDetailData | null>(null);
  const [reviews, setReviews] = useState<ServiceReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sortMode, setSortMode] = useState<SortMode>("newest");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiRequest<ServiceDetailData>(`/services/${id}`);
      setService(data);
      setReviews(data.reviews);
    } catch (error) {
      setService(null);
      setReviews([]);
      if (!(error instanceof Error && (error.message === "Service not found" || error.message === t("serviceDetail.notFound")))) {
        toast.error(error instanceof Error ? error.message : t("errors.unableToLoadDetails"));
      }
    } finally {
      setLoading(false);
    }
  }, [id, t]);

  useEffect(() => {
    if (id) fetchData();
  }, [id, fetchData]);

  const handleReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || role !== "user") {
      toast.error(t("serviceDetail.signInToReview"));
      return;
    }
    setSubmitting(true);
    try {
      await apiRequest(`/services/${id}/reviews`, {
        method: "POST",
        body: JSON.stringify({ rating, comment }),
      });
      toast.success(t("serviceDetail.submitted"));
      setComment("");
      setRating(5);
      setHoverRating(0);
      await fetchData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("errors.unableToSubmitReview"));
    } finally {
      setSubmitting(false);
    }
  };

  const sortedReviews = [...reviews].sort((a, b) => {
    if (sortMode === "highest") return b.rating - a.rating;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!service) {
    return <div className="py-20 text-center text-muted-foreground">{t("serviceDetail.notFound")}</div>;
  }

  const avgRating = service.avg_rating;
  const ratingCount = service.review_count;
  const displayRating = hoverRating || rating;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="mx-auto max-w-4xl px-4 py-8 sm:px-6"
    >
      {/* Service Header */}
      <div className="rounded-2xl border border-border/50 glass-card p-6 sm:p-8">
        <div className="flex flex-wrap items-start gap-3 mb-3">
          <Badge variant="secondary"><Tag className="mr-1 h-3 w-3" />{translateCategory(service.category, t)}</Badge>
          {service.price_range && (
            <Badge variant="outline"><DollarSign className="mr-1 h-3 w-3" />{service.price_range}</Badge>
          )}
        </div>
        <h1 className="text-3xl font-bold">{service.title}</h1>
        <p className="mt-3 text-muted-foreground">{service.description}</p>

        <div className="mt-5 flex flex-wrap gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1"><MapPin className="h-4 w-4" />{service.city}</span>
          {service.phone && <span className="flex items-center gap-1"><Phone className="h-4 w-4" />{service.phone}</span>}
          <span className="flex items-center gap-1">
            <Star className="h-4 w-4 fill-warning text-warning" />
            {avgRating > 0
              ? `${avgRating.toFixed(1)} (${ratingCount} ${t("reviews.ratings")})`
              : t("reviews.noRatings")}
          </span>
        </div>

        <div className="mt-6 rounded-xl border border-border/50 bg-primary/5 p-4">
          <h3 className="font-semibold text-sm mb-1">{t("serviceDetail.provider")}</h3>
          <p className="font-medium">{service.profiles?.name}</p>
          <p className="text-sm text-muted-foreground">{service.profiles?.city}</p>
        </div>
      </div>

      {/* Portfolio Gallery */}
      <ProviderGallery serviceId={id!} providerId={service.provider_id} />

      {/* Reviews */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">
            {t("serviceDetail.customerReviews")} ({reviews.length})
            {avgRating > 0 && (
              <span className="ml-2 text-base font-normal text-muted-foreground">
                {t("reviews.average")} {avgRating.toFixed(1)} ★
              </span>
            )}
          </h2>
          {reviews.length > 1 && (
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 text-xs"
              onClick={() => setSortMode(sortMode === "newest" ? "highest" : "newest")}
            >
              <ArrowUpDown className="h-3.5 w-3.5" />
              {sortMode === "newest" ? t("reviews.newest") : t("reviews.highestRated")}
            </Button>
          )}
        </div>
        {reviews.length === 0 ? (
          <p className="text-muted-foreground text-sm">{t("reviews.noReviews")}</p>
        ) : (
          <div className="space-y-3">
            {sortedReviews.map((r, i) => (
              <motion.div
                key={r.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
              >
                <ReviewCard
                  userName={r.profiles?.name || t("reviews.anonymous")}
                  rating={r.rating}
                  comment={r.comment || ""}
                  createdAt={r.created_at}
                />
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Add Review Form */}
      {user && role === "user" && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-8 rounded-xl border border-border/50 glass-card p-6"
        >
          <h3 className="font-semibold mb-4">{t("reviews.leaveReview")}</h3>
          <form onSubmit={handleReview} className="space-y-4">
            <div>
              <Label>{t("reviews.rating")}</Label>
              <div className="flex gap-1 mt-1">
                {[1, 2, 3, 4, 5].map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setRating(v)}
                    onMouseEnter={() => setHoverRating(v)}
                    onMouseLeave={() => setHoverRating(0)}
                  >
                    <Star
                      className={`h-7 w-7 cursor-pointer transition-all duration-200 ${
                        v <= displayRating
                          ? "fill-warning text-warning scale-110"
                          : "text-muted-foreground/30 hover:text-warning/50"
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label htmlFor="comment">{t("reviews.comment")}</Label>
              <Textarea id="comment" value={comment} onChange={(e) => setComment(e.target.value)} placeholder={t("reviews.shareExperience")} className="bg-card" />
            </div>
            <Button type="submit" disabled={submitting} className="gradient-primary border-0">
              {submitting ? t("reviews.submitting") : t("reviews.submit")}
            </Button>
          </form>
        </motion.div>
      )}
    </motion.div>
  );
}

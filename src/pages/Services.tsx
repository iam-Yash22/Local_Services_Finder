import { useEffect, useState } from "react";
import { apiRequest, ApiService } from "@/lib/api";
import SearchBar from "@/components/SearchBar";
import ServiceCard from "@/components/ServiceCard";
import { Loader2, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { translateTag } from "@/i18n/labels";

const ALL_TAGS = [
  "24/7", "Affordable", "Verified", "Top Rated", "Emergency",
  "Home Service", "Walk-In", "Freelancer", "Custom Work",
  "Industrial", "Catering", "Event",
];

export default function Services() {
  const { t } = useTranslation();
  const [services, setServices] = useState<ApiService[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All Categories");
  const [city, setCity] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    setLoading(true);
    try {
      setServices(await apiRequest<ApiService[]>("/services"));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("errors.unableToLoadServices"));
    } finally {
      setLoading(false);
    }
  };

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const filtered = services.filter((s) => {
    const matchSearch = !search || s.title.toLowerCase().includes(search.toLowerCase()) || s.description.toLowerCase().includes(search.toLowerCase());
    const matchCategory = category === "All Categories" || s.category === category;
    const matchCity = !city || s.city.toLowerCase().includes(city.toLowerCase());
    const matchTags = selectedTags.length === 0 || selectedTags.every((tag) => s.tags.includes(tag));
    return matchSearch && matchCategory && matchCity && matchTags;
  });

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0f0a1e] text-white">
      {/* Background gradient + glow blobs */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_hsl(265_80%_25%/0.55),_transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_hsl(220_90%_30%/0.45),_transparent_55%)]" />
        <div className="absolute -top-40 -left-32 h-[420px] w-[420px] rounded-full bg-purple-600/25 blur-[120px]" />
        <div className="absolute top-1/3 -right-32 h-[460px] w-[460px] rounded-full bg-blue-600/25 blur-[130px]" />
        <div className="absolute bottom-0 left-1/3 h-[380px] w-[380px] rounded-full bg-fuchsia-600/15 blur-[120px]" />
      </div>

      {/* Subtle star field */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.18]"
        style={{
          backgroundImage:
            "radial-gradient(1px 1px at 20% 30%, white, transparent), radial-gradient(1px 1px at 70% 60%, white, transparent), radial-gradient(1.5px 1.5px at 40% 80%, white, transparent), radial-gradient(1px 1px at 85% 20%, white, transparent), radial-gradient(1px 1px at 10% 70%, white, transparent)",
          backgroundSize: "600px 600px",
        }}
      />

      <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-10 text-center"
        >
          <div className="mx-auto mb-5 inline-flex items-center gap-2 rounded-full border border-purple-400/30 bg-white/5 px-4 py-1.5 text-xs font-medium text-purple-200 backdrop-blur-md">
            <Sparkles className="h-3.5 w-3.5 text-purple-300" />
            {t("services.discover")}
          </div>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
            {t("services.headingPrefix")}{" "}
            <span className="bg-gradient-to-r from-purple-300 via-fuchsia-300 to-blue-300 bg-clip-text text-transparent">
              {t("services.headingHighlight")}
            </span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base text-white/60 sm:text-lg">
            {t("services.description")}
          </p>
        </motion.div>

        {/* Glass search panel */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="relative rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-xl shadow-[0_0_60px_-15px_rgba(168,85,247,0.35)] sm:p-5"
        >
          <div className="absolute inset-0 -z-10 rounded-2xl bg-gradient-to-r from-purple-500/10 via-transparent to-blue-500/10" />
          <div className="[&_input]:bg-white/5 [&_input]:border-white/10 [&_input]:text-white [&_input]:placeholder:text-white/40 [&_input:focus-visible]:ring-purple-400/50 [&_button]:bg-white/5 [&_button]:border-white/10 [&_button]:text-white">
            <SearchBar
              search={search} onSearchChange={setSearch}
              category={category} onCategoryChange={setCategory}
              city={city} onCityChange={setCity}
            />
          </div>

          {/* Tag Filters */}
          <div className="mt-4 flex flex-wrap gap-2">
            {ALL_TAGS.map((tag) => {
              const active = selectedTags.includes(tag);
              return (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={`rounded-full px-3.5 py-1.5 text-xs font-medium border transition-all duration-200 ${
                    active
                      ? "border-purple-400/60 bg-gradient-to-r from-purple-500/30 to-fuchsia-500/30 text-white shadow-[0_0_15px_-2px_rgba(168,85,247,0.6)]"
                      : "border-white/10 bg-white/5 text-white/70 hover:border-purple-400/40 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  {translateTag(tag, t)}
                </button>
              );
            })}
            {selectedTags.length > 0 && (
              <button
                onClick={() => setSelectedTags([])}
                className="rounded-full border border-red-400/30 bg-red-500/10 px-3.5 py-1.5 text-xs font-medium text-red-300 transition-colors hover:bg-red-500/20"
              >
                {t("services.clearAll")}
              </button>
            )}
          </div>
        </motion.div>

        {/* Results meta */}
        {!loading && (
          <div className="mt-6 flex items-center justify-between text-sm text-white/50">
            <span>
              <span className="font-semibold text-white/80">{filtered.length}</span>{" "}
              {t("services.resultsFound", {
                count: filtered.length,
                label: filtered.length === 1 ? t("services.service") : t("services.servicesPlural"),
              })}
            </span>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="h-8 w-8 animate-spin text-purple-300" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-24 text-center">
            <p className="text-lg font-semibold text-white/80">{t("services.noResults")}</p>
            <p className="mt-1 text-sm text-white/50">{t("services.tryAdjusting")}</p>
          </div>
        ) : (
          <div className="mt-4 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence mode="popLayout">
              {filtered.map((s) => (
                <motion.div
                  key={s.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="group relative"
                >
                  {/* glow on hover */}
                  <div className="pointer-events-none absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-purple-500/0 via-fuchsia-500/0 to-blue-500/0 opacity-0 blur transition-opacity duration-300 group-hover:from-purple-500/40 group-hover:via-fuchsia-500/30 group-hover:to-blue-500/40 group-hover:opacity-100" />
                  <div className="relative rounded-2xl [&_a>div]:!bg-white/[0.04] [&_a>div]:!border-white/10 [&_a>div]:!backdrop-blur-xl [&_h3]:!text-white [&_.text-foreground]:!text-white">
                    <ServiceCard
                      id={s.id}
                      title={s.title}
                      category={s.category}
                      description={s.description}
                      city={s.city}
                      providerName={s.profiles?.name || t("services.unknownProvider")}
                      averageRating={s.avg_rating}
                      reviewCount={s.review_count}
                      priceRange={s.price_range ?? undefined}
                      tags={s.tags}
                    />
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}

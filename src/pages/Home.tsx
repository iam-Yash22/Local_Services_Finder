import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Search, Shield, Star, MapPin, Users, Zap, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { apiRequest } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { translateCategory } from "@/i18n/labels";

const FEATURES = [
  { icon: Search, title: "home.findServices", desc: "home.findServicesDescription", step: "01" },
  { icon: Star, title: "home.verifiedReviews", desc: "home.verifiedReviewsDescription", step: "02" },
  { icon: Shield, title: "home.trustedProviders", desc: "home.trustedProvidersDescription", step: "03" },
];

const STATS = [
  { icon: Users, value: "10K+", label: "home.happyCustomers" },
  { icon: Zap, value: "500+", label: "home.serviceProviders" },
  { icon: MapPin, value: "50+", label: "home.citiesCovered" },
];

const ORBIT_AVATARS = [
  { size: 48, orbitRadius: 140, startAngle: 0, speed: 25, color: "from-purple-500 to-pink-500" },
  { size: 40, orbitRadius: 140, startAngle: 120, speed: 25, color: "from-blue-500 to-cyan-500" },
  { size: 44, orbitRadius: 140, startAngle: 240, speed: 25, color: "from-amber-400 to-orange-500" },
  { size: 36, orbitRadius: 200, startAngle: 60, speed: 35, color: "from-emerald-400 to-teal-500" },
  { size: 42, orbitRadius: 200, startAngle: 180, speed: 35, color: "from-violet-500 to-purple-600" },
  { size: 38, orbitRadius: 200, startAngle: 300, speed: 35, color: "from-rose-400 to-red-500" },
];

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.5 } }),
};

function OrbitSystem() {
  return (
    <div className="relative w-[420px] h-[420px] mx-auto">
      {/* Orbit rings */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-[280px] h-[280px] rounded-full border border-white/[0.07]" />
      </div>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-[400px] h-[400px] rounded-full border border-white/[0.05]" />
      </div>

      {/* Orbiting avatars */}
      {ORBIT_AVATARS.map((a, i) => (
        <motion.div
          key={i}
          className="absolute top-1/2 left-1/2 z-20"
          style={{ width: a.size, height: a.size, marginLeft: -a.size / 2, marginTop: -a.size / 2 }}
          animate={{
            x: [
              Math.cos((a.startAngle * Math.PI) / 180) * a.orbitRadius,
              Math.cos(((a.startAngle + 360) * Math.PI) / 180) * a.orbitRadius,
            ],
            y: [
              Math.sin((a.startAngle * Math.PI) / 180) * a.orbitRadius,
              Math.sin(((a.startAngle + 360) * Math.PI) / 180) * a.orbitRadius,
            ],
          }}
          transition={{ duration: a.speed, repeat: Infinity, ease: "linear" }}
        >
          <div
            className={`w-full h-full rounded-full bg-gradient-to-br ${a.color} shadow-lg shadow-purple-500/20 border-2 border-white/20 flex items-center justify-center`}
          >
            <Users className="w-4 h-4 text-white/80" />
          </div>
        </motion.div>
      ))}
    </div>
  );
}

export default function Home() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [serviceCategories, setServiceCategories] = useState<string[]>([]);

  useEffect(() => {
    apiRequest<string[]>("/public/service-categories")
      .then(setServiceCategories)
      .catch((error: unknown) => {
        toast.error(error instanceof Error ? error.message : t("errors.unableToLoadCategories"));
      });
  }, [t]);

  const browsePath = user ? "/services" : "/login";

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative overflow-hidden min-h-[90vh] flex items-center"
        style={{ background: "linear-gradient(135deg, #0f0a1e 0%, #1a1145 25%, #1e1b4b 40%, #172554 60%, #0c1222 100%)" }}
      >
        {/* Glow effects */}
        <div className="absolute top-1/4 left-1/3 w-[500px] h-[500px] rounded-full bg-purple-600/20 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] rounded-full bg-blue-600/15 blur-[100px] pointer-events-none" />
        <div className="absolute top-0 right-0 w-[300px] h-[300px] rounded-full bg-violet-500/10 blur-[80px] pointer-events-none" />

        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:py-0 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left — copy */}
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <span className="inline-flex items-center rounded-full border border-purple-400/30 bg-purple-500/10 px-4 py-1.5 text-xs font-semibold text-purple-300 tracking-wide uppercase mb-8 backdrop-blur-sm">
                🚀 {t("home.heroBadge")}
              </span>
              <h1 className="text-4xl sm:text-5xl lg:text-[3.5rem] font-extrabold leading-[1.1] tracking-tight text-white">
                {t("home.heroPrefix")}{" "}
                <span className="bg-gradient-to-r from-purple-400 via-violet-400 to-blue-400 bg-clip-text text-transparent">
                  {t("home.heroHighlightText")}
                </span>{" "}
                {t("home.heroSuffix")}
              </h1>
              <p className="mt-6 text-lg text-white/60 max-w-lg leading-relaxed">
                {t("home.heroDescription")}
              </p>
              <div className="mt-10 flex flex-col sm:flex-row gap-4">
                <Link to={browsePath} className="w-full sm:w-auto shrink-0">
                  <Button
                    size="lg"
                    className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white border-0 text-sm sm:text-base px-6 sm:px-8 h-12 sm:h-14 rounded-full shadow-[0_0_30px_rgba(139,92,246,0.4)] transition-shadow hover:shadow-[0_0_40px_rgba(139,92,246,0.6)]"
                  >
                    {user ? t("home.explore") : t("home.signInToBrowse")}
                    <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
                  </Button>
                </Link>
                <Link to="/register" className="w-full sm:w-auto shrink-0">
                  <Button
                    size="lg"
                    className="w-full sm:w-auto bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white border-0 text-sm sm:text-base px-6 sm:px-8 h-12 sm:h-14 rounded-full shadow-[0_0_20px_rgba(245,158,11,0.3)] transition-shadow hover:shadow-[0_0_30px_rgba(245,158,11,0.5)]"
                  >
                    {t("home.join")}
                  </Button>
                </Link>
              </div>
            </motion.div>

            {/* Right — orbital */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, delay: 0.3 }}
              className="hidden lg:flex justify-center"
            >
              <OrbitSystem />
            </motion.div>
          </div>
        </div>

      </section>

      {!user && serviceCategories.length > 0 && (
        <section className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6">
          <div className="mb-8 text-center">
            <span className="text-xs font-bold uppercase tracking-widest text-primary">{t("home.browsePreview")}</span>
            <h2 className="mt-2 text-3xl font-extrabold sm:text-4xl">{t("home.categoriesTitle")}</h2>
            <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
              {t("home.categoriesSubtitle")}
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {serviceCategories.map((category, index) => (
              <div
                key={`${category}-${index}`}
                className="rounded-2xl border border-border bg-card p-5 shadow-card"
              >
                <h3 className="font-bold text-primary">{translateCategory(category, t)}</h3>
                <div aria-hidden="true" className="mt-4 select-none space-y-3 blur-sm">
                  <p className="font-semibold">{t("auth.provider")}</p>
                  <p>{t("profile.phone")}: +91 98765 43210</p>
                  <p>{t("home.previewDetails")}</p>
                </div>
                <Link to="/login" className="mt-3 inline-block text-sm font-medium text-primary hover:underline">
                  {t("home.signInToExplore")}
                </Link>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Stats */}
      <section className="border-b border-border bg-card relative -mt-0 z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-4xl px-4 sm:px-6 py-12"
        >
          <div className="rounded-2xl bg-card border border-border shadow-elevated p-8 grid grid-cols-1 gap-8 sm:grid-cols-3">
            {STATS.map((s) => (
              <div key={s.label} className="flex items-center gap-4 justify-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 shrink-0">
                  <s.icon className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className={`text-2xl font-extrabold ${!user && s.label === "home.serviceProviders" ? "select-none blur-sm" : ""}`}>
                    {s.value}
                  </p>
                  <p className="text-sm text-muted-foreground">{t(s.label)}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-xs font-bold uppercase tracking-widest text-primary">{t("home.simpleProcess")}</span>
          <h2 className="text-3xl font-extrabold mt-2 sm:text-4xl">{t("home.howItWorks")}</h2>
          <p className="mt-3 text-muted-foreground max-w-md mx-auto">
            {t("home.howItWorksDescription")}
          </p>
        </motion.div>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              custom={i}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              className="group relative rounded-2xl border border-border bg-card p-8 text-center transition-all duration-300 hover:shadow-elevated hover:-translate-y-1"
            >
              <span className="absolute top-4 right-4 text-4xl font-extrabold text-muted/50">{f.step}</span>
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl gradient-primary shadow-elevated">
                <f.icon className="h-8 w-8 text-primary-foreground" />
              </div>
              <h3 className="font-bold text-xl">{t(f.title)}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{t(f.desc)}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 gradient-primary opacity-95" />
        <div className="absolute -top-20 -right-20 h-64 w-64 rounded-full bg-accent/30 blur-3xl" />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 text-center"
        >
          <h2 className="text-3xl font-extrabold text-primary-foreground sm:text-4xl">{t("home.ctaTitle")}</h2>
          <p className="mt-4 text-primary-foreground/75 max-w-md mx-auto text-lg">
            {t("home.ctaDescription")}
          </p>
          <Link to="/register">
            <Button size="lg" className="mt-8 bg-primary-foreground text-foreground hover:bg-primary-foreground/90 text-base px-8 py-6 rounded-full font-bold shadow-elevated">
              {t("home.createFreeAccount")} <ChevronRight className="ml-1 h-5 w-5" />
            </Button>
          </Link>
        </motion.div>
      </section>
    </div>
  );
}

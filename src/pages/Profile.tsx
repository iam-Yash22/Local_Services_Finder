import { useState, useEffect, useCallback } from "react";
import { apiRequest, ApiService } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import ServiceCard from "@/components/ServiceCard";
import ProviderGallery from "@/components/ProviderGallery";
import { toast } from "sonner";
import { User, Loader2, Briefcase } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function Profile() {
  const { t } = useTranslation();
  const { user, role, profile, refreshProfile } = useAuth();
  const [name, setName] = useState(profile?.name || "");
  const [city, setCity] = useState(profile?.city || "");
  const [phone, setPhone] = useState(profile?.phone || "");
  const [saving, setSaving] = useState(false);
  const [myServices, setMyServices] = useState<ApiService[]>([]);
  const [loadingServices, setLoadingServices] = useState(false);

  useEffect(() => {
    if (profile) {
      setName(profile.name);
      setCity(profile.city);
      setPhone(profile.phone || "");
    }
  }, [profile]);

  const fetchMyServices = useCallback(async () => {
    if (!user) return;
    setLoadingServices(true);
    try {
      setMyServices(await apiRequest<ApiService[]>("/profile/services"));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("errors.unableToLoadYourServices"));
    } finally {
      setLoadingServices(false);
    }
  }, [user, t]);

  useEffect(() => {
    if (user && role === "provider") fetchMyServices();
  }, [user, role, fetchMyServices]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    try {
      await apiRequest("/profile", {
        method: "PATCH",
        body: JSON.stringify({ name, city, phone }),
      });
      toast.success(t("profile.saved"));
      await refreshProfile();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("errors.unableToUpdateProfile"));
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <div className="rounded-2xl border border-border bg-card p-8 shadow-card">
        <div className="mb-6 flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full gradient-primary">
            <User className="h-7 w-7 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{profile?.name || t("profile.title")}</h1>
            <Badge variant="secondary" className="mt-1 capitalize">{role ? t(`auth.${role}`) : ""}</Badge>
          </div>
        </div>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <Label htmlFor="name">{t("profile.name")}</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <Label>{t("profile.email")}</Label>
            <Input value={profile?.email || ""} disabled className="bg-muted" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="city">{t("profile.city")}</Label>
              <Input id="city" value={city} onChange={(e) => setCity(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="phone">
                {t("profile.phone")}{role === "user" && !profile?.phone ? t("profile.phoneSetOnce") : ""}
              </Label>
              <Input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={role !== "user" || Boolean(profile?.phone)}
              />
            </div>
          </div>
          <Button type="submit" className="gradient-primary border-0" disabled={saving}>
            {saving ? t("profile.saving") : t("profile.save")}
          </Button>
        </form>
      </div>

      {role === "provider" && (
        <div className="mt-8">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-primary" />
            {t("profile.myServices")}
          </h2>
          {loadingServices ? (
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          ) : myServices.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-card/50 p-8 text-center">
              <p className="text-muted-foreground text-sm">
                {t("profile.noServices")}
              </p>
            </div>
          ) : (
            <div className="space-y-8">
              {myServices.map((s) => (
                <div key={s.id} className="rounded-2xl border border-border bg-card p-5 shadow-card">
                  <ServiceCard
                    id={s.id}
                    title={s.title}
                    category={s.category}
                    description={s.description}
                    city={s.city}
                    providerName={profile?.name || t("profile.you")}
                    averageRating={0}
                    reviewCount={0}
                    priceRange={s.price_range ?? undefined}
                  />
                  <ProviderGallery serviceId={s.id} providerId={user.id} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

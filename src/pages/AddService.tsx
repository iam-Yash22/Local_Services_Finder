import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CATEGORIES } from "@/components/SearchBar";
import { toast } from "sonner";
import { Wrench } from "lucide-react";
import { useTranslation } from "react-i18next";
import { translateCategory } from "@/i18n/labels";

export default function AddService() {
  const { t } = useTranslation();
  const { user, role } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ title: "", category: "", description: "", city: "", phone: "", price_range: "" });
  const [loading, setLoading] = useState(false);

  if (role !== "provider") {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted-foreground">{t("addService.providerOnly")}</p>
      </div>
    );
  }

  const categories = CATEGORIES.filter((c) => c !== "All Categories");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    try {
      await apiRequest("/services", {
        method: "POST",
        body: JSON.stringify(form),
      });
      toast.success(t("addService.added"));
      navigate("/services");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("addService.unableToAdd"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <div className="rounded-2xl border border-border bg-card p-8 shadow-card">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl gradient-primary">
            <Wrench className="h-6 w-6 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold">{t("addService.title")}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t("addService.subtitle")}</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">{t("addService.serviceTitle")}</Label>
            <Input id="title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          </div>
          <div>
            <Label>{t("addService.category")}</Label>
            <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
              <SelectTrigger><SelectValue placeholder={t("addService.selectCategory")} /></SelectTrigger>
              <SelectContent>
                {categories.map((c) => <SelectItem key={c} value={c}>{translateCategory(c, t)}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="desc">{t("addService.description")}</Label>
            <Textarea id="desc" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="city">{t("profile.city")}</Label>
              <Input id="city" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} required />
            </div>
            <div>
              <Label htmlFor="phone">{t("addService.phoneOptional")}</Label>
              <Input id="phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
          </div>
          <div>
            <Label htmlFor="price">{t("addService.priceOptional")}</Label>
            <Input id="price" placeholder={t("addService.priceExample")} value={form.price_range} onChange={(e) => setForm({ ...form, price_range: e.target.value })} />
          </div>
          <Button type="submit" className="w-full gradient-primary border-0" disabled={loading}>
            {loading ? t("addService.adding") : t("nav.addService")}
          </Button>
        </form>
      </div>
    </div>
  );
}

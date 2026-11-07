import { useState, useEffect, useRef, useCallback } from "react";
import { apiAssetUrl, apiRequest } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import { ImageIcon, Plus, Trash2, Loader2, Upload } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import ImageLightbox from "./ImageLightbox";
import { useTranslation } from "react-i18next";

interface GalleryImage {
  id: string;
  image_url: string;
  caption: string;
}

export default function ProviderGallery({ serviceId, providerId }: { serviceId: string; providerId?: string }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);
  const [caption, setCaption] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isOwner = user && providerId && user.id === providerId;

  const fetchImages = useCallback(async () => {
    try {
      setImages(await apiRequest<GalleryImage[]>(`/services/${serviceId}/gallery`));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("errors.unableToLoadPortfolio"));
    } finally {
      setLoading(false);
    }
  }, [serviceId]);

  useEffect(() => {
    fetchImages();
  }, [fetchImages]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("caption", caption);
        await apiRequest(`/services/${serviceId}/gallery`, {
          method: "POST",
          body: formData,
        });
      }
      toast.success(t("portfolio.updated"));
      setCaption("");
      await fetchImages();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("errors.uploadFailed"));
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDelete = async (img: GalleryImage) => {
    try {
      await apiRequest(`/gallery/${img.id}`, { method: "DELETE" });
      toast.success(t("portfolio.removed"));
      await fetchImages();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("errors.unableToRemoveImage"));
    }
  };

  if (loading) return null;

  return (
    <div className="mt-8">
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
        <ImageIcon className="h-5 w-5 text-primary" /> {t("portfolio.title")}
      </h2>

      {/* Upload section for owners */}
      {isOwner && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 rounded-xl border border-dashed border-primary/30 bg-primary/5 p-5"
        >
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
            <div className="flex-1 space-y-2">
              <label className="text-sm font-medium text-foreground">{t("portfolio.addToPortfolio")}</label>
              <Input
                placeholder={t("portfolio.captionPlaceholder")}
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                className="bg-card"
              />
            </div>
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/mp4,video/webm"
                multiple
                onChange={handleUpload}
                className="hidden"
              />
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="gradient-primary border-0 gap-2"
              >
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                {uploading ? t("portfolio.uploading") : t("portfolio.upload")}
              </Button>
            </div>
          </div>
        </motion.div>
      )}

      {images.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("portfolio.empty")}</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <AnimatePresence>
            {images.map((img, i) => (
              <motion.div
                key={img.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: i * 0.06 }}
                className="group relative cursor-pointer overflow-hidden rounded-xl border border-border glass-card"
                onClick={() => setLightboxIndex(i)}
              >
                <div className="aspect-square overflow-hidden">
                  {img.image_url.match(/\.(mp4|webm)$/i) ? (
                    <video
                      src={apiAssetUrl(img.image_url)}
                      className="h-full w-full object-cover"
                      muted
                      playsInline
                      onMouseEnter={(e) => (e.target as HTMLVideoElement).play()}
                      onMouseLeave={(e) => (e.target as HTMLVideoElement).pause()}
                    />
                  ) : (
                    <img
                      src={apiAssetUrl(img.image_url)}
                      alt={img.caption || t("portfolio.workSample")}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                    />
                  )}
                </div>
                {img.caption && (
                  <p className="px-2 py-1.5 text-xs text-muted-foreground truncate">{img.caption}</p>
                )}
                {isOwner && (
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(img); }}
                    aria-label={t("portfolio.removeImage")}
                    className="absolute top-2 right-2 rounded-full bg-destructive/90 p-1.5 text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {lightboxIndex !== null && (
        <ImageLightbox images={images} initialIndex={lightboxIndex} onClose={() => setLightboxIndex(null)} />
      )}
    </div>
  );
}

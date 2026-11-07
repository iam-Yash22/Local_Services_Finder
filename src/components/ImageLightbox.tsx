import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";

interface ImageLightboxProps {
  images: { id: string; image_url: string; caption: string }[];
  initialIndex: number;
  onClose: () => void;
}

export default function ImageLightbox({ images, initialIndex, onClose }: ImageLightboxProps) {
  const { t } = useTranslation();
  const [index, setIndex] = useState(initialIndex);

  const prev = () => setIndex((i) => (i > 0 ? i - 1 : images.length - 1));
  const next = () => setIndex((i) => (i < images.length - 1 ? i + 1 : 0));

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-foreground/80 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="relative max-w-4xl max-h-[85vh] mx-4"
          onClick={(e) => e.stopPropagation()}
        >
          <img
            src={images[index].image_url}
            alt={images[index].caption || t("portfolio.galleryImage")}
            className="rounded-xl object-contain max-h-[80vh] w-auto mx-auto"
          />
          {images[index].caption && (
            <p className="text-center text-sm text-primary-foreground mt-3">{images[index].caption}</p>
          )}

          <button onClick={onClose} aria-label={t("common.close")} className="absolute -top-4 -right-4 p-2 rounded-full bg-card text-foreground shadow-elevated hover:scale-110 transition-transform">
            <X className="h-5 w-5" />
          </button>

          {images.length > 1 && (
            <>
              <button onClick={prev} aria-label={t("common.previous")} className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-card/90 text-foreground shadow-elevated hover:scale-110 transition-transform">
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button onClick={next} aria-label={t("common.next")} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-card/90 text-foreground shadow-elevated hover:scale-110 transition-transform">
                <ChevronRight className="h-5 w-5" />
              </button>
            </>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

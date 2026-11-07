import type { TFunction } from "i18next";

const categoryKeys: Record<string, string> = {
  "All Categories": "all",
  Plumbing: "plumbing",
  Electrical: "electrical",
  Cleaning: "cleaning",
  Painting: "painting",
  Carpentry: "carpentry",
  Landscaping: "landscaping",
  Moving: "moving",
  Tutoring: "tutoring",
  Photography: "photography",
  Catering: "catering",
};

const tagKeys: Record<string, string> = {
  "24/7": "allDay",
  Affordable: "affordable",
  Verified: "verified",
  "Top Rated": "topRated",
  Emergency: "emergency",
  "Home Service": "homeService",
  "Walk-In": "walkIn",
  Freelancer: "freelancer",
  "Custom Work": "customWork",
  Industrial: "industrial",
  Catering: "catering",
  Event: "event",
};

export function translateCategory(category: string, t: TFunction): string {
  const key = categoryKeys[category];
  return key ? t(`categories.${key}`) : category;
}

export function translateTag(tag: string, t: TFunction): string {
  const key = tagKeys[tag];
  return key ? t(`tags.${key}`) : tag;
}

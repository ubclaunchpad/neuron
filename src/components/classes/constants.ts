export const CLASS_CATEGORIES = [
    "Online Exercise",
    "Creative & Expressive",
    "Care Partner Workshops",
    "Food & Nutrition",
    "In-Person Exercise",
    "One-on-One Exercise",
    "Other Opportunities",
] as const;

export const DEFAULT_CLASS_CATEGORY: (typeof CLASS_CATEGORIES)[number] =
    "Other Opportunities";

export const gallery = {
  title: "Galéria",
  lead: "A klub saját fotói hamarosan érkeznek.",
  placeholderCount: 9,
  placeholderLabel: "Fotó helye",
} as const;

export type GalleryContent = typeof gallery;

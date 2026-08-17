export interface Testimonial {
  id: string;
  quote: string;
  name: string;
  location: string;
  featured?: boolean;
}

/**
 * Attribution style: first name + last initial when known (e.g. "James M."),
 * otherwise "Verified Client". Always include city/state when available.
 */
export const testimonials: Testimonial[] = [
  {
    id: "homecoming-maryland",
    featured: true,
    name: "Verified Client",
    location: "Maryland",
    quote:
      "I sold this watch years ago and have been looking for it ever since. When I saw the photos, I recognized the scratches I put on it — and most importantly, my mark on the case back. I originally bought it overseas at the commissary around 1996. About ten years ago I traded it toward my first Rolex, and it remains my biggest regret. I was wearing it when both of my sons were born, and at many other life events. The bracelet is different now, but that's okay — I like it. I could not be happier to have it back. Thank you for the sale and the easy transaction."
  }
];

export function getFeaturedTestimonial() {
  return testimonials.find((item) => item.featured) ?? testimonials[0] ?? null;
}

export function getSupportingTestimonials() {
  return testimonials.filter((item) => !item.featured);
}

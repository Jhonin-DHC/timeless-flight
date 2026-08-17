import { getFeaturedTestimonial, getSupportingTestimonials } from "@/data/testimonials";

export function TestimonialsSection() {
  const featured = getFeaturedTestimonial();
  const supporting = getSupportingTestimonials();

  if (!featured && supporting.length === 0) return null;

  return (
    <section className="space-y-5">
      <div>
        <p className="text-sm uppercase tracking-[0.2em] text-[var(--brand-c)]">Client stories</p>
        <h2 className="section-title mt-2">Trusted by collectors who come back</h2>
      </div>

      {featured ? (
        <article className="glass-panel space-y-5">
          <p className="text-2xl font-medium leading-snug text-[var(--brand-c)] md:text-3xl">
            “I could not be happier to have it back.”
          </p>
          <blockquote className="max-w-4xl text-base leading-relaxed text-[var(--muted)] md:text-lg">
            {featured.quote}
          </blockquote>
          <p className="text-sm font-semibold">
            {featured.name}
            {featured.location ? (
              <span className="font-normal text-[var(--muted)]"> · {featured.location}</span>
            ) : null}
          </p>
        </article>
      ) : null}

      {supporting.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {supporting.map((item) => (
            <article key={item.id} className="glass-card space-y-3">
              <blockquote className="text-sm leading-relaxed text-[var(--muted)]">“{item.quote}”</blockquote>
              <p className="text-sm font-semibold">
                {item.name}
                {item.location ? (
                  <span className="font-normal text-[var(--muted)]"> · {item.location}</span>
                ) : null}
              </p>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
}

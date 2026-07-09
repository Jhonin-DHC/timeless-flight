import Image from "next/image";
import Link from "next/link";
import { ListingModalTrigger } from "@/components/listing-modal-trigger";

const watchTitle = "Breitling Navitimer Super 8 (Ref. EB2040 / AB2040)";

const specs = [
  { label: "Case", value: "46mm diameter (about 50mm including bezel notches), 14.4mm thickness" },
  { label: "Material", value: "Titanium (EB2040, green dial) or steel (AB2040, black dial)" },
  { label: "Movement", value: "Breitling B20 automatic (Tudor-base architecture), COSC chronometer" },
  { label: "Power Reserve", value: "Over 70 hours" },
  { label: "Water Resistance", value: "30m" },
  { label: "Strap", value: "Leather NATO strap" }
];

export default function BreitlingNavitimerSuper8Page() {
  return (
    <article className="space-y-8">
      <section className="glass-panel space-y-4">
        <p className="text-xs uppercase tracking-[0.2em] text-[var(--brand-c)]">Breitling specialist feature</p>
        <h1 className="section-title">{watchTitle}</h1>
        <p className="section-copy max-w-3xl">
          The Super 8 is the opposite of a discreet pilot watch. It is Breitling&apos;s modern instrument-first tribute
          to the military Ref. 637 stopwatch, a model associated with bomber crew navigation workflows in the WWII era.
        </p>
        <div className="flex flex-wrap gap-3">
          <ListingModalTrigger listingName={watchTitle} />
          <Link href="/checkout" className="btn-gradient-secondary">
            Go to cart checkout
          </Link>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="glass-card space-y-3">
          <h2 className="text-2xl font-semibold">Why collectors care</h2>
          <p className="text-sm leading-relaxed text-[var(--muted)]">
            Breitling designed the Super 8 around usability cues from the historical cockpit timer format: oversized
            proportions, a highly grippable crown, and a left-side placement intended to improve comfort while wearing
            the watch on the left wrist.
          </p>
          <p className="text-sm leading-relaxed text-[var(--muted)]">
            It does not copy the original stopwatch one-to-one. Instead, it translates that operational DNA into a
            three-hand wristwatch with modern chronometer-grade performance.
          </p>
        </div>
        <div className="relative min-h-72 overflow-hidden rounded-2xl border border-white/15">
          <Image
            src="https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3"
            alt="Breitling Navitimer Super 8 inspired presentation"
            fill
            className="object-cover"
            sizes="(max-width: 1024px) 100vw, 50vw"
          />
        </div>
      </section>

      <section className="glass-card space-y-4">
        <h2 className="text-2xl font-semibold">Technical profile</h2>
        <div className="grid gap-3 md:grid-cols-2">
          {specs.map((item) => (
            <div key={item.label} className="rounded-xl border border-white/15 p-4">
              <h3 className="font-semibold">{item.label}</h3>
              <p className="mt-2 text-sm text-[var(--muted)]">{item.value}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="glass-card space-y-4">
        <h2 className="text-2xl font-semibold">Specialist&apos;s Note</h2>
        <p className="text-sm leading-relaxed text-[var(--muted)]">
          The Super 8 sits at the &quot;tool-first&quot; end of the Navitimer family. At 46mm, it delivers an instrument
          presence that feels intentionally oversized, with cockpit legibility prioritized over dress-watch restraint.
          For buyers who want authentic aviation character rather than vintage cosplay, this reference is one of the
          most compelling modern Breitling options.
        </p>
      </section>
    </article>
  );
}

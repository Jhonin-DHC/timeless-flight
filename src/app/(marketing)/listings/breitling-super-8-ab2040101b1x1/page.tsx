import Image from "next/image";
import Link from "next/link";
import { ListingModalTrigger } from "@/components/listing-modal-trigger";

const watchTitle = "Breitling Super 8 (AB2040101B1X1)";

const specialistSpecs = [
  {
    attribute: "Diameter",
    detail: "46mm case (about 50mm with bezel)",
    why: "Maximum legibility in high-stress environments."
  },
  {
    attribute: "Crown",
    detail: "Screw-locked crown at 9 o'clock",
    why: "Reduces wrist bite and honors the thigh-timer layout."
  },
  {
    attribute: "Movement",
    detail: "Caliber B20 (COSC)",
    why: "70-hour weekend-proof reserve from the Breitling/Tudor architecture."
  },
  {
    attribute: "Crystal",
    detail: "Cambered sapphire with anti-reflective treatment",
    why: "Clear readability with minimal glare in bright conditions."
  }
];

export default function BreitlingSuper8AB2040Page() {
  return (
    <article className="space-y-8">
      <section className="glass-panel space-y-4">
        <p className="text-xs uppercase tracking-[0.2em] text-[var(--brand-c)]">Breitling specialist feature</p>
        <h1 className="section-title">{watchTitle}</h1>
        <p className="section-copy max-w-3xl">
          Arguably one of the most specialist references in modern Breitling. The Super 8 is not designed as a dress
          watch first. It is a cockpit tool translated for the wrist, rooted in the Reference 637 timing instrument.
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
          <h2 className="text-2xl font-semibold">The thigh-strapped bomber timer story</h2>
          <p className="text-sm leading-relaxed text-[var(--muted)]">
            In WWII-era bomber operations, pilots were managing throttles, flight controls, and mission timing under
            intense conditions. A tiny wristwatch was not ideal when wearing heavy gloves and dealing with vibration.
          </p>
          <p className="text-sm leading-relaxed text-[var(--muted)]">
            Breitling&apos;s Huit Aviation department answered that with the oversized Reference 637, strapped to the
            pilot&apos;s thigh. The modern Super 8 keeps that DNA alive: oversized controls, instant readability, and
            mission-timer logic in a contemporary wrist format.
          </p>
          <p className="text-sm font-medium text-white">
            Born on a bomber pilot&apos;s thigh. Reborn for the wrist of the modern explorer.
          </p>
        </div>
        <div className="relative min-h-72 overflow-hidden rounded-2xl border border-white/15">
          <Image
            src="https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3"
            alt="Breitling Super 8 macro with rugged pilot-inspired character"
            fill
            className="object-cover"
            sizes="(max-width: 1024px) 100vw, 50vw"
          />
        </div>
      </section>

      <section className="glass-card space-y-4">
        <h2 className="text-2xl font-semibold">Technical points generalists miss</h2>
        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-xl border border-white/15 p-4">
            <h3 className="font-semibold">Destro crown layout</h3>
            <p className="mt-2 text-sm text-[var(--muted)]">
              The 9 o&apos;clock crown is a functional comfort decision. On a case this large, right-side crown placement
              would increase wrist bite during movement.
            </p>
          </div>
          <div className="rounded-xl border border-white/15 p-4">
            <h3 className="font-semibold">Breitling x Tudor caliber exchange</h3>
            <p className="mt-2 text-sm text-[var(--muted)]">
              Caliber B20 is based on Tudor&apos;s MT5612 architecture, delivering robust 70-hour autonomy and chronometer
              precision with Breitling aviation identity.
            </p>
          </div>
          <div className="rounded-xl border border-white/15 p-4">
            <h3 className="font-semibold">Red arrow navigation marker</h3>
            <p className="mt-2 text-sm text-[var(--muted)]">
              The bi-directional bezel with red pointer provides low-tech reliability for elapsed-time checkpoints like
              Time Over Target planning.
            </p>
          </div>
        </div>
      </section>

      <section className="glass-card space-y-4">
        <h2 className="text-2xl font-semibold">Then and now</h2>
        <p className="text-sm text-[var(--muted)]">
          Storyboard concept for media: left side shows a 1940s thigh-mounted Ref. 637 timer in a bomber cockpit;
          right side shows the AB2040101B1X1 on a modern wrist with leather NATO. This visual bridge explains why the
          Super 8 feels like equipment first and watch second.
        </p>
      </section>

      <section className="glass-card overflow-x-auto">
        <h2 className="mb-4 text-2xl font-semibold">Specialist specs table</h2>
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-white/15 text-[var(--muted)]">
              <th className="py-2 pr-4 font-medium">Attribute</th>
              <th className="py-2 pr-4 font-medium">Detail</th>
              <th className="py-2 font-medium">Why it matters</th>
            </tr>
          </thead>
          <tbody>
            {specialistSpecs.map((row) => (
              <tr key={row.attribute} className="border-b border-white/10 align-top">
                <td className="py-2 pr-4 font-medium">{row.attribute}</td>
                <td className="py-2 pr-4 text-[var(--muted)]">{row.detail}</td>
                <td className="py-2 text-[var(--muted)]">{row.why}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </article>
  );
}

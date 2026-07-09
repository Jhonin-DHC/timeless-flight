import Image from "next/image";
import Link from "next/link";
import { ListingModalTrigger } from "@/components/listing-modal-trigger";

const watchTitle = "Breitling Lady Navitimer 2500 (Ref. 80200)";

const keyDetails = [
  {
    feature: "Case Size",
    detail: "30mm-33mm",
    why: "Among the smallest fully functional slide-rule watches produced by Breitling."
  },
  {
    feature: "Bezel",
    detail: "60-bead rotating bezel",
    why: "A vintage cue tracing back to the 1952 Navitimer, with practical pilot-inspired grip."
  },
  {
    feature: "Crystal",
    detail: "Mineral or sapphire (year-dependent)",
    why: "Era-correct variation that reflects production-period authenticity."
  },
  {
    feature: "Dial",
    detail: "Panda or blue variants",
    why: "High-contrast layouts help the compact slide-rule scale remain legible."
  }
];

const mathGuide = [
  {
    title: "Multiplication (The party trick)",
    goal: "Multiply $12 x 3.",
    move: "Align 12 on the outer rotating bezel with the 10 unit index on the inner dial.",
    result: "Read 3 on the inner dial and you get 36 on the outer bezel."
  },
  {
    title: "Currency conversion (The travel tool)",
    goal: "Convert USD to EUR when $1 = EUR 0.92.",
    move: "Align 92 on the outer bezel with the 10 unit index on the inner dial.",
    result: "Read 50 on the inner dial and you get 46 on the outer bezel."
  },
  {
    title: "Tip calculator",
    goal: "Calculate a 15% tip on a $60 bill.",
    move: "Align 15 on the outer bezel with 10 on the inner dial.",
    result: "Read 60 on the inner dial and you get 9 on the outer bezel."
  }
];

const videoScript = [
  {
    time: "0:00-0:05",
    visual: "Extreme macro over the beaded bezel, lit like a polished silver mountain range.",
    audio: "In 1952, Breitling gave pilots a computer for the sky. In the 1980s... they made it elegant."
  },
  {
    time: "0:05-0:12",
    visual: "Full shot of the Lady Navitimer 2500 resting on a silk map or vintage flight log.",
    audio: "The Lady Navitimer 2500. A 30mm masterpiece that proves precision has no size."
  },
  {
    time: "0:12-0:20",
    visual: "Close-up alignment of the red 10 index while the bezel turns with controlled clicks.",
    audio: "Do not let the size fool you. This is a fully functional logarithmic slide rule. Currency, distance, and time, calculated at a glance."
  },
  {
    time: "0:20-0:25",
    visual: "Lifestyle frame with the watch worn while reviewing a flight plan with fountain pen in hand.",
    audio: "It is not just a watch. It is a legacy of aviation, refined for the modern wrist."
  },
  {
    time: "0:25-0:30",
    visual: "Final logo lockup over a macro of the Panda dial.",
    audio: "The Breitling Lady Navitimer. The Icon, Condensed. Timeless Flight."
  }
];

export default function BreitlingLadyNavitimerPage() {
  return (
    <article className="space-y-8">
      <section className="glass-panel space-y-4">
        <p className="text-xs uppercase tracking-[0.2em] text-[var(--brand-c)]">Breitling specialist feature</p>
        <h1 className="section-title">{watchTitle}</h1>
        <p className="section-copy max-w-3xl">
          The hidden gem of the 1980s and 90s. While most collectors picture Navitimers as 40mm+ cockpit instruments,
          the 2500 series condensed that logic into a refined 30mm-33mm form without losing the soul of the original.
        </p>
        <div className="flex flex-wrap gap-3">
          <ListingModalTrigger listingName={watchTitle} />
          <Link href="/checkout" className="btn-gradient-secondary">
            Go to cart checkout
          </Link>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="glass-card">
          <h2 className="text-2xl font-semibold">The Navigator&apos;s Daughter</h2>
          <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
            In the quartz-dominant 1980s, Breitling searched for ways to preserve aviation DNA in modern proportions.
            The Lady Navitimer 2500 became a scaled instrument, not a simplified one: a miniature answer to the legendary
            Ref. 806 ethos, adapted for collectors who wanted technical identity in an elegant footprint.
          </p>
          <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
            Same logic. Same legend. Refined for a different wrist.
          </p>
        </div>
        <div className="relative min-h-64 overflow-hidden rounded-2xl border border-white/15">
          <Image
            src="https://images.unsplash.com/photo-1523170335258-f5ed11844a49"
            alt="Breitling Lady Navitimer styled with aviation and business attire"
            fill
            className="object-cover"
            sizes="(max-width: 1024px) 100vw, 50vw"
          />
        </div>
      </section>

      <section className="glass-card space-y-4">
        <h2 className="text-2xl font-semibold">Technical highlights specialists care about</h2>
        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-xl border border-white/15 p-4">
            <h3 className="font-semibold">Beaded bezel</h3>
            <p className="mt-2 text-sm text-[var(--muted)]">
              The rice-grain style is not decorative fluff. It comes from pilot-first usability and adds a jewelry-grade
              light play in Lady Navitimer proportions.
            </p>
          </div>
          <div className="rounded-xl border border-white/15 p-4">
            <h3 className="font-semibold">Logarithmic slide rule</h3>
            <p className="mt-2 text-sm text-[var(--muted)]">
              Multiplication, division, and conversion functions remain fully practical despite compact scale.
            </p>
          </div>
          <div className="rounded-xl border border-white/15 p-4">
            <h3 className="font-semibold">High-precision quartz</h3>
            <p className="mt-2 text-sm text-[var(--muted)]">
              Typically ETA-based (commonly 956.112 family): dependable accuracy for a true grab-and-go Navitimer.
            </p>
          </div>
        </div>
      </section>

      <section className="glass-card space-y-4">
        <h2 className="text-2xl font-semibold">Math on the Wrist</h2>
        <p className="text-sm text-[var(--muted)]">
          The real magic of the Lady Navitimer 2500 is proving it is a true wrist computer, not just a beautiful dial.
          The logarithmic slide rule works like two rulers moving against each other.
        </p>
        <div className="grid gap-3">
          {mathGuide.map((example) => (
            <div key={example.title} className="rounded-xl border border-white/15 p-4">
              <h3 className="font-semibold">{example.title}</h3>
              <p className="mt-2 text-sm text-[var(--muted)]">
                <span className="font-medium text-white">Goal:</span> {example.goal}
              </p>
              <p className="mt-1 text-sm text-[var(--muted)]">
                <span className="font-medium text-white">Move:</span> {example.move}
              </p>
              <p className="mt-1 text-sm text-[var(--muted)]">
                <span className="font-medium text-white">Result:</span> {example.result}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="glass-card space-y-4">
        <h2 className="text-2xl font-semibold">AI Video Script: The Miniature Masterpiece</h2>
        <p className="text-sm text-[var(--muted)]">
          Tone: elegant, sophisticated, and brainy. Visual direction: high-contrast macro shots on dark backgrounds
          with sharp highlights on polished steel.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-white/15 text-[var(--muted)]">
                <th className="py-2 pr-4 font-medium">Time</th>
                <th className="py-2 pr-4 font-medium">Visual Scene</th>
                <th className="py-2 font-medium">Audio / Voiceover</th>
              </tr>
            </thead>
            <tbody>
              {videoScript.map((scene) => (
                <tr key={scene.time} className="border-b border-white/10 align-top">
                  <td className="py-2 pr-4 font-medium">{scene.time}</td>
                  <td className="py-2 pr-4 text-[var(--muted)]">{scene.visual}</td>
                  <td className="py-2 text-[var(--muted)]">{scene.audio}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="glass-card space-y-3">
          <h2 className="text-2xl font-semibold">The Icon, Condensed</h2>
          <p className="text-sm text-[var(--muted)]">
            Everything you love about the world&apos;s most famous pilot&apos;s watch, in a sophisticated 30mm case.
          </p>
          <p className="text-sm text-[var(--muted)]">
            Styling direction: pair with a silk blouse, leather flight jacket, or tailored business attire for
            &ldquo;chic technical&rdquo; energy rather than pure jewelry sparkle.
          </p>
        </div>
        <div className="glass-card overflow-x-auto">
          <table className="w-full min-w-[460px] text-left text-sm">
            <thead>
              <tr className="border-b border-white/15 text-[var(--muted)]">
                <th className="py-2 pr-4 font-medium">Feature</th>
                <th className="py-2 pr-4 font-medium">Detail</th>
                <th className="py-2 font-medium">Why it&apos;s special</th>
              </tr>
            </thead>
            <tbody>
              {keyDetails.map((row) => (
                <tr key={row.feature} className="border-b border-white/10 align-top">
                  <td className="py-2 pr-4 font-medium">{row.feature}</td>
                  <td className="py-2 pr-4 text-[var(--muted)]">{row.detail}</td>
                  <td className="py-2 text-[var(--muted)]">{row.why}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="glass-card">
        <h2 className="text-2xl font-semibold">Specialist&apos;s Note</h2>
        <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
          The Ref. 80200 is a collector favorite because it retains the beaded bezel design cue from the very first
          1952 Navitimer. You get the same tactical grip concept used by pilots, rendered in a size that sits cleanly
          under a cuff.
        </p>
      </section>
    </article>
  );
}

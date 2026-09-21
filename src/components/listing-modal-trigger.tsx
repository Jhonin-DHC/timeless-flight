"use client";

import { useState } from "react";
import { Modal } from "@/components/modal";
import { SITE_PHONE_DISPLAY, SITE_PHONE_HREF } from "@/lib/site";

interface ListingModalTriggerProps {
  listingName: string;
}

export function ListingModalTrigger({ listingName }: ListingModalTriggerProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="btn-gradient-primary w-fit">
        Request availability
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title="Request this watch">
        <p className="text-sm text-[var(--muted)]">
          You are interested in <span className="text-white">{listingName}</span>. Call{" "}
          <a href={SITE_PHONE_HREF} className="font-semibold text-[var(--brand-a)]">
            {SITE_PHONE_DISPLAY}
          </a>{" "}
          and we&apos;ll confirm availability.
        </p>
      </Modal>
    </>
  );
}

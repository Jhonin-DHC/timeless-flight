"use client";

import { useState } from "react";
import { Modal } from "@/components/modal";

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
          You are interested in <span className="text-white">{listingName}</span>. This is where a GHL form or API call can be connected next.
        </p>
      </Modal>
    </>
  );
}

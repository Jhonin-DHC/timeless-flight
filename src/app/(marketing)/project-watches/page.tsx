import { ListingsClient } from "@/components/listings-client";
import { filterBySection, getPublishedListings } from "@/lib/listings-service";

export const dynamic = "force-dynamic";

export default async function ProjectWatchesPage() {
  const listings = filterBySection(await getPublishedListings(), "project");

  return (
    <ListingsClient
      listings={listings}
      heading="Project Watches"
      intro="Watches sold as projects — restoration, repair, missing parts, or otherwise needing work. Please read each description carefully."
      presetSection="project"
    />
  );
}

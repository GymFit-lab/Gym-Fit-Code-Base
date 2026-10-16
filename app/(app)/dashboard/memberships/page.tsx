import type { Metadata } from "next";

import { MembershipsView } from "@/components/gym/memberships-view";
import { gymContent } from "@/content/gym";

export const metadata: Metadata = { title: gymContent.memberships.metaTitle };

export default function MembershipsPage() {
  return <MembershipsView />;
}

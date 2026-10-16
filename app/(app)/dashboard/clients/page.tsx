import type { Metadata } from "next";

import { ClientsView } from "@/components/gym/clients-view";
import { gymContent } from "@/content/gym";

export const metadata: Metadata = { title: gymContent.clients.metaTitle };

export default function ClientsPage() {
  return <ClientsView />;
}

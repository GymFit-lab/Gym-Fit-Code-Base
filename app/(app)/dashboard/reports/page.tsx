import type { Metadata } from "next";

import { ReportsView } from "@/components/gym/reports-view";
import { gymContent } from "@/content/gym";

export const metadata: Metadata = { title: gymContent.reports.metaTitle };

export default function ReportsPage() {
  return <ReportsView />;
}

import type { Metadata } from "next";

import { PaymentsView } from "@/components/gym/payments-view";
import { gymContent } from "@/content/gym";

export const metadata: Metadata = { title: gymContent.payments.metaTitle };

export default function PaymentsPage() {
  return <PaymentsView />;
}

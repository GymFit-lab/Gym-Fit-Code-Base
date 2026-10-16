import type { Metadata } from "next";

import { TrainersView } from "@/components/gym/trainers-view";
import { gymContent } from "@/content/gym";

export const metadata: Metadata = { title: gymContent.trainers.metaTitle };

export default function TrainersPage() {
  return <TrainersView />;
}

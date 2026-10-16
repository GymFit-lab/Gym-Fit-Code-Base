import type { Metadata } from "next";

import { AttendanceView } from "@/components/gym/attendance-view";
import { gymContent } from "@/content/gym";

export const metadata: Metadata = { title: gymContent.attendance.metaTitle };

export default function AttendancePage() {
  return <AttendanceView />;
}

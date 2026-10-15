import { PlaceholderPage, placeholderMetadata } from "@/components/placeholder-page";
import { placeholderPages } from "@/content/pages";

const page = placeholderPages.about;

export const metadata = placeholderMetadata(page);

export default function Page() {
  return <PlaceholderPage page={page} />;
}

import { Footer } from "@/components/landing/footer";
import { Navbar } from "@/components/landing/navbar";

/** Public site chrome: marketing navbar + footer around the landing, auth and info pages. */
export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <main id="main">{children}</main>
      <Footer />
    </>
  );
}

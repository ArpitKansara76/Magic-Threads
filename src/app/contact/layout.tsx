import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Us | Magic Threads - Premium Chaniya Choli & Festive Wear",
  description: "Get in touch with Magic Threads. Have questions about our designer Chaniya Choli collections, bulk pricing, or customization options? Reach out to us via WhatsApp, phone, or email.",
  keywords: "Contact Magic Threads, Chaniya Choli Ahmedabad, customer service, festive wear inquiry, custom stitching",
};

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

import type { Metadata } from "next";
import { Playfair_Display, Outfit } from "next/font/google";
import "./globals.css";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-serif",
  weight: ["400", "600", "700"],
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Navrang Chaniya Choli | Premium Indian Festive & Bridal Catalog",
  description: "Browse our exclusive collection of traditional Gujarati mirror-work Chaniya Cholis, heavy zardosi bridal lehengas, and pastel georgette fusions. Quick inquiry via WhatsApp.",
  keywords: "Chaniya Choli, Lehenga Choli, Navratri dress, Bridal Lehenga, Gujarati traditional dress, Garba dress, WhatsApp shopping",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${playfair.variable} ${outfit.variable}`} suppressHydrationWarning>
      <body suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}


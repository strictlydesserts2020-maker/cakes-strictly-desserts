import type { Metadata, Viewport } from "next";
import "./globals.css";
import GoogleAnalytics from "@/components/GoogleAnalytics";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.strictlydesserts.in"),
  title: "Strictly Desserts — Luxury Custom Cakes in Anna Nagar, Chennai",
  description:
    "Handcrafted birthday, wedding, bento & customised cakes baked fresh in Anna Nagar, Chennai. Order online or on WhatsApp from Strictly Desserts.",
  keywords:
    "cakes Chennai, custom cakes Anna Nagar, birthday cake Chennai, wedding cake Chennai, bento cake, eggless cake Chennai, Strictly Desserts",
  authors: [{ name: "Strictly Desserts" }],
  robots: "index, follow",
  alternates: {
    canonical: "https://www.strictlydesserts.in",
  },
  openGraph: {
    title: "Strictly Desserts — Luxury Custom Cakes in Anna Nagar, Chennai",
    description:
      "Handcrafted birthday, wedding, bento & customised cakes baked fresh in Anna Nagar, Chennai. Order online or on WhatsApp.",
    url: "https://www.strictlydesserts.in",
    siteName: "Strictly Desserts",
    type: "website",
    locale: "en_IN",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "Strictly Desserts — Luxury Custom Cakes in Chennai" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Strictly Desserts — Luxury Custom Cakes in Anna Nagar, Chennai",
    description: "Handcrafted birthday, wedding, bento & customised cakes baked fresh in Anna Nagar, Chennai.",
    images: ["/opengraph-image"],
  },
};

export const viewport: Viewport = {
  themeColor: "#C2748A",
  width: "device-width",
  initialScale: 1,
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Bakery",
  name: "Strictly Desserts",
  url: "https://www.strictlydesserts.in",
  description: "Handcrafted birthday, wedding, bento & customised cakes in Anna Nagar, Chennai.",
  address: {
    "@type": "PostalAddress",
    streetAddress: "Anna Nagar East",
    addressLocality: "Chennai",
    addressRegion: "Tamil Nadu",
    postalCode: "600040",
    addressCountry: "IN",
  },
  geo: { "@type": "GeoCoordinates", latitude: "13.0856", longitude: "80.2128" },
  servesCuisine: ["Bakery", "Desserts", "Custom Cakes"],
  priceRange: "₹₹",
  openingHoursSpecification: [{
    "@type": "OpeningHoursSpecification",
    dayOfWeek: ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"],
    opens: "09:00",
    closes: "21:00",
  }],
  sameAs: ["https://www.instagram.com/strictly.desserts"],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=Lato:wght@300;400;700&display=swap" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      </head>
      <body>
        {children}
        <GoogleAnalytics />
      </body>
    </html>
  );
}

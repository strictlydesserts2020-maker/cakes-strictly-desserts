import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Strictly Desserts — Luxury Custom Cakes in Anna Nagar, Chennai",
  description:
    "Handcrafted birthday, wedding, bento & customised cakes baked fresh in Anna Nagar, Chennai. Order online or on WhatsApp from Strictly Desserts.",
  keywords:
    "cakes Chennai, custom cakes Anna Nagar, birthday cake Chennai, wedding cake Chennai, bento cake, eggless cake Chennai, Strictly Desserts",
  authors: [{ name: "Strictly Desserts" }],
  robots: "index, follow",
};

export const viewport: Viewport = {
  themeColor: "#C2748A",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin=""
        />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,400;0,9..144,500;0,9..144,600;1,9..144,300;1,9..144,400;1,9..144,500&family=DM+Sans:ital,opsz,wght@0,0.40,300;0,9.40,400;0,9.40,500;0,9.40,600;0,9.40,700;1,9.40,300&display=swap"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}

import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TreadSight — AI Tire Copilot",
  description:
    "Time travel your tire. AI-powered tread depth analysis, wear prediction, and smart recommendations.",
  keywords: ["tire", "tread depth", "AI", "safety", "wear prediction"],
  openGraph: {
    title: "TreadSight — AI Tire Copilot",
    description: "Time travel your tire. See how your tires will look in the future.",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#0a0a0f",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-[#0a0a0f] text-[#f0f0f5] antialiased">
        <div className="relative noise-overlay min-h-screen">
          {children}
        </div>
      </body>
    </html>
  );
}

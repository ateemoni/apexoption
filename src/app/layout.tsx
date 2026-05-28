import type { Metadata } from "next";
import { Geist_Mono, Syne } from "next/font/google";
import "./globals.css";

const syne = Syne({
  subsets: ["latin"],
  variable: "--font-syne",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "ApexOption",
  description: "Professional Forex Trading Platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${syne.variable} ${geistMono.variable} font-sans bg-[#0b0e14] text-white antialiased`}>
        {children}
      </body>
    </html>
  );
}
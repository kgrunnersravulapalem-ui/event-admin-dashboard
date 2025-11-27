import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Tanuku Road Run - Admin Dashboard",
    template: "%s | Tanuku Road Run",
  },
  description: "Official admin dashboard for Tanuku Road Run. Manage participants, organizations, enrollments, and event data for the annual road running event in Tanuku.",
  keywords: [
    "Tanuku Road Run",
    "Road Run ",
    "Tanuku",
    "Running Event",
    "Marathon",
    "5K Run",
    "10K Run",
    "3K Run",
    "Event Management",
    "Participant Registration",
    "Admin Dashboard",
  ],
  authors: [{ name: "Tanuku Road Run Organizers" }],
  creator: "Tanuku Road Run",
  publisher: "Tanuku Road Run",
  robots: {
    index: false,
    follow: false,
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    siteName: "Tanuku Road Run  Admin",
    title: "Tanuku Road Run  - Admin Dashboard",
    description: "Official admin dashboard to manage participants and event data for Tanuku Road Run .",
  },
  twitter: {
    card: "summary",
    title: "Tanuku Road Run  - Admin Dashboard",
    description: "Official admin dashboard to manage participants and event data for Tanuku Road Run .",
  },
  icons: {
    icon: "/favicon.svg",
    apple: "/apple-touch-icon.svg",
  },
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}

import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import ToastProvider from "@/components/ToastProvider";
import { appConfig } from "@/lib/appConfig";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: {
    default: `${appConfig.eventName} - Admin Dashboard`,
    template: `%s | ${appConfig.eventName}`,
  },
  description: `Official admin dashboard for ${appConfig.eventName}. Manage participants, organizations, enrollments, and event data for the annual road running event.`,
  keywords: [
    appConfig.eventName,
    "Road Run",
    "Running Event",
    "Marathon",
    "5K Run",
    "10K Run",
    "3K Run",
    "Event Management",
    "Participant Registration",
    "Admin Dashboard",
  ],
  authors: [{ name: `${appConfig.eventOrganization} Organizers` }],
  creator: appConfig.eventOrganization,
  publisher: appConfig.eventOrganization,
  robots: {
    index: false,
    follow: false,
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    siteName: `${appConfig.eventName} Admin`,
    title: `${appConfig.eventName} - Admin Dashboard`,
    description: `Official admin dashboard to manage participants and event data for ${appConfig.eventName}.`,
  },
  twitter: {
    card: "summary",
    title: `${appConfig.eventName} - Admin Dashboard`,
    description: `Official admin dashboard to manage participants and event data for ${appConfig.eventName}.`,
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
        <ToastProvider />
        {children}
      </body>
    </html>
  );
}

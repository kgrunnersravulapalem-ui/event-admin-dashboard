import type { Metadata } from "next";
import { appConfig } from "@/lib/appConfig";

export const metadata: Metadata = {
  title: "New Enrollment",
  description: `Register new participants for ${appConfig.eventName}. Choose race category (3K, 5K, 10K) and enter participant details.`,
};

export default function EnrollLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

import type { Metadata } from "next";
import { appConfig } from "@/lib/appConfig";

export const metadata: Metadata = {
  title: "Dashboard",
  description: `Overview of ${appConfig.eventName} event statistics, participant counts, and quick actions for event management.`,
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

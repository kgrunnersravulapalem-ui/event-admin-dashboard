import type { Metadata } from "next";
import { appConfig } from "@/lib/appConfig";

export const metadata: Metadata = {
  title: "Participants",
  description: `View, filter, search, and manage all registered participants for ${appConfig.eventName}. Export participant data to CSV.`,
};

export default function ParticipantsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

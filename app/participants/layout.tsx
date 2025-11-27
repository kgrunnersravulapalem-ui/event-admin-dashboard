import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Participants",
  description: "View, filter, search, and manage all registered participants for Tanuku Road Run 2025. Export participant data to CSV.",
};

export default function ParticipantsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

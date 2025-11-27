import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Organizations",
  description: "Manage participating organizations for Tanuku Road Run 2025. Add, edit, and remove organization entries.",
};

export default function OrganizationsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

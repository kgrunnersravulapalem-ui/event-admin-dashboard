import type { Metadata } from "next";
import { appConfig } from "@/lib/appConfig";

export const metadata: Metadata = {
  title: "Organizations",
  description: `Manage participating organizations for ${appConfig.eventName}. Add, edit, and remove organization entries.`,
};

export default function OrganizationsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

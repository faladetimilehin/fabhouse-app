import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import AgentAnalyticsDashboard from "@/components/AgentAnalyticsDashboard";

export const metadata = {
  title: "Analytics | FabHouse Agent Dashboard",
  description: "View your property analytics and performance metrics",
};

export default async function AnalyticsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  const role = (session.user as any).role;
  if (!["agent", "developer", "admin"].includes(role)) {
    redirect("/");
  }

  return <AgentAnalyticsDashboard />;
}

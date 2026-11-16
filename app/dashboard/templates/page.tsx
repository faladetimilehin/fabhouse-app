import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import ListingTemplatePicker from "@/components/ListingTemplatePicker";

export const metadata = {
  title: "Listing Templates | FabHouse",
  description: "Manage your listing templates",
};

export default async function TemplatesPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  const role = (session.user as any).role;
  if (!["agent", "developer", "admin"].includes(role)) {
    redirect("/");
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <ListingTemplatePicker />
    </div>
  );
}

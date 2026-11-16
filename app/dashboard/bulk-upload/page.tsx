import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import BulkUploadClient from "@/components/BulkUploadClient";

export const metadata = {
  title: "Bulk Upload Properties | FabHouse",
  description: "Upload multiple properties at once",
};

export default async function BulkUploadPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  const role = (session.user as any).role;
  if (!["agent", "developer", "admin"].includes(role)) {
    redirect("/");
  }

  return <BulkUploadClient />;
}

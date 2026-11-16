export const dynamic = "force-dynamic";

import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { dbConnect } from "@/lib/mongodb";
import Property from "@/models/Property";
import PropertyForm, { PropertyFormValues } from "@/components/PropertyForm";

export default async function EditListingPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  await dbConnect();

  let property: any;
  try {
    property = await Property.findById(params.id).lean();
  } catch {
    notFound();
  }
  if (!property) notFound();

  const isOwner = property.owner.toString() === (session.user as any).id;
  const isAdmin = (session.user as any).role === "admin";
  if (!isOwner && !isAdmin) redirect("/dashboard");

  const initialValues: PropertyFormValues = {
    title: property.title,
    description: property.description,
    type: property.type,
    purpose: property.purpose,
    price: String(property.price),
    currency: property.currency,
    priceQualifier: property.priceQualifier ?? "fixed",
    state: property.location.state,
    city: property.location.city,
    address: property.location.address ?? "",
    postcode: property.location.postcode ?? "",
    bedrooms: property.bedrooms !== undefined ? String(property.bedrooms) : "",
    bathrooms: property.bathrooms !== undefined ? String(property.bathrooms) : "",
    sizeSqFt: property.sizeSqFt !== undefined ? String(property.sizeSqFt) : "",
    landSize: property.landSize ?? "",
    tenure: property.tenure ?? "",
    amenities: (property.amenities ?? []).join(", "),
  };

  return (
    <div className="max-w-2xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-bold text-navy mb-1">Edit listing</h1>
      <p className="text-navy/60 mb-6">Update the details below.</p>
      <PropertyForm
        mode="edit"
        propertyId={property._id.toString()}
        initialValues={initialValues}
        initialImages={property.images ?? []}
        initialVideos={property.videos ?? []}
      />
    </div>
  );
}

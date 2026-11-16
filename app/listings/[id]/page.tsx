export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { dbConnect } from "@/lib/mongodb";
import Property from "@/models/Property";
import AddressFingerprint from "@/models/AddressFingerprint";
import { MapPin, BedDouble, Bath, BadgeCheck, Phone, Ruler, FileText, TrendingDown, MessageCircle, ShieldCheck } from "lucide-react";
import InquiryForm from "@/components/InquiryForm";
import StayRequestForm from "@/components/StayRequestForm";
import AffordabilityCalculator from "@/components/AffordabilityCalculator";
import SaveListingButton from "@/components/SaveListingButton";
import { formatPrice, formatPricePeriod, formatTenure, formatSize, formatReducedDate } from "@/lib/formatting";
import { buildWhatsAppLink, isValidWhatsAppPhone } from "@/lib/whatsapp";
import { getMarket } from "@/config/markets";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  await dbConnect();

  let property: any;
  try {
    property = await Property.findById(id).lean();
  } catch {
    return { title: "Listing not found | Fabhouse" };
  }
  if (!property) return { title: "Listing not found | Fabhouse" };

  const priceText = formatPrice(property.price, property.currency, property.priceQualifier);
  const locationText = `${property.location.city}, ${property.location.state}`;
  const description = `${priceText} — ${property.bedrooms ? `${property.bedrooms} bed ` : ""}${property.type} in ${locationText}. ${property.description.slice(0, 120)}`;
  const image = property.images?.[0];

  return {
    title: `${property.title} | Fabhouse`,
    description,
    openGraph: {
      title: property.title,
      description,
      type: "website",
      images: image ? [{ url: image, width: 1200, height: 630, alt: property.title }] : undefined,
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title: property.title,
      description,
      images: image ? [image] : undefined,
    },
  };
}

export default async function PropertyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await dbConnect();

  let property: any;
  try {
    property = await Property.findById(id).populate("owner", "name isVerified phone email").lean();
  } catch {
    notFound();
  }
  if (!property) notFound();

  // Check how many other listings share this address (provenance trail)
  let addressListingCount = 0;
  if (property.addressHash) {
    const fp = await AddressFingerprint.findOne({ hash: property.addressHash }).lean() as any;
    if (fp) addressListingCount = (fp.listings?.length ?? 1) - 1; // subtract this listing
  }

  const size = formatSize(property.sizeSqFt);
  const tenureLabel = formatTenure(property.tenure);
  const reducedDate = formatReducedDate(property.priceReducedAt);
  const fullAddress = [property.location.address, property.location.city, property.location.state, property.location.postcode, getMarket(property.location.countryCode).name]
    .filter(Boolean)
    .join(", ");

  const STATUS_BANNER: Record<string, string> = {
    sold: "This property has been sold and is no longer available.",
    rented: "This property has been rented and is no longer available.",
    archived: "This listing has been withdrawn by the agent.",
    pending: "This listing is awaiting review and isn't public yet.",
    rejected: "This listing isn't currently available.",
  };
  const statusBanner = STATUS_BANNER[property.status];

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      {statusBanner && (
        <div className="bg-navy text-white text-sm font-medium rounded-lg px-4 py-3 mb-6 text-center">
          {statusBanner}
        </div>
      )}

      {addressListingCount > 0 && (
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-300 rounded-lg px-4 py-3 mb-6">
          <span className="text-amber-600 text-lg leading-none">⚠️</span>
          <div>
            <p className="text-sm font-semibold text-amber-800">
              {addressListingCount} other agent{addressListingCount > 1 ? "s have" : " has"} listed a property at this address.
            </p>
            <p className="text-xs text-amber-700 mt-0.5">
              This could mean multiple agents represent the same property. Verify ownership before paying any fees.
            </p>
          </div>
        </div>
      )}
      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          <div className="relative aspect-[16/10] bg-navy/5 rounded-lg overflow-hidden flex items-center justify-center mb-4">
            {property.images?.[0] ? (
              <Image
                src={property.images[0]}
                alt={property.title}
                fill
                priority
                sizes="(max-width: 768px) 100vw, 66vw"
                className="object-cover"
              />
            ) : (
              <span className="text-navy/30">No image yet</span>
            )}
          </div>

          {property.images?.length > 1 && (
            <div className="grid grid-cols-4 gap-2 mb-6">
              {property.images.slice(1, 5).map((img: string, i: number) => (
                <div key={i} className="relative aspect-square rounded-md overflow-hidden">
                  <Image src={img} alt="" fill sizes="200px" className="object-cover" />
                </div>
              ))}
            </div>
          )}

          {property.videos?.length > 0 && (
            <div className="mb-6">
              <h2 className="font-semibold text-navy mb-2">Walkthrough video</h2>
              <div className="space-y-3">
                {property.videos.map((videoUrl: string, i: number) => (
                  <video key={i} src={videoUrl} controls className="w-full rounded-lg bg-black" />
                ))}
              </div>
            </div>
          )}

          <h1 className="text-2xl font-bold text-navy">{property.title}</h1>
          <p className="text-navy/60 flex items-center gap-1 mt-1">
            <MapPin className="w-4 h-4" /> {fullAddress}
          </p>

          <div className="flex items-center gap-6 mt-4 text-navy/70 flex-wrap">
            {property.bedrooms !== undefined && (
              <span className="flex items-center gap-1"><BedDouble className="w-4 h-4" /> {property.bedrooms} beds</span>
            )}
            {property.bathrooms !== undefined && (
              <span className="flex items-center gap-1"><Bath className="w-4 h-4" /> {property.bathrooms} baths</span>
            )}
            {size && (
              <span className="flex items-center gap-1"><Ruler className="w-4 h-4" /> {size.sqFt} / {size.sqM}</span>
            )}
            {property.landSize && (
              <span className="flex items-center gap-1"><Ruler className="w-4 h-4" /> {property.landSize}</span>
            )}
            <span className="capitalize">{property.type}</span>
          </div>

          {tenureLabel && (
            <p className="flex items-center gap-1 text-navy/70 mt-2 text-sm">
              <FileText className="w-4 h-4" /> Tenure: {tenureLabel}
            </p>
          )}

          <h2 className="font-semibold text-navy mt-6 mb-2">Description</h2>
          <p className="text-navy/70 whitespace-pre-line">{property.description}</p>

          {/* Safety tips — inspired by PropertyPro.ng */}
          <div className="mt-6 border border-amber-200 bg-amber-50 rounded-lg p-4">
            <h3 className="font-semibold text-amber-800 mb-2 flex items-center gap-2">
              <span>⚠️</span> Safety Tips
            </h3>
            <ul className="text-sm text-amber-700 space-y-1 list-disc list-inside">
              <li>Do not pay any inspection fee without seeing the agent and property in person.</li>
              <li>Only pay rental or sales fees after verifying the landlord or owner.</li>
              <li>Ensure you meet the agent in an open, public location first.</li>
              <li>Fabhouse is not liable for any monetary transaction between you and the agent.</li>
            </ul>
          </div>

          {property.amenities?.length > 0 && (
            <>
              <h2 className="font-semibold text-navy mt-6 mb-2">Amenities</h2>
              <div className="flex flex-wrap gap-2">
                {property.amenities.map((a: string) => (
                  <span key={a} className="bg-white border border-navy/10 text-navy/70 text-sm px-3 py-1 rounded-full">
                    {a}
                  </span>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Sidebar */}
        <div>
          <div className="bg-white border border-navy/10 rounded-lg p-5 sticky top-24">
            <p className="text-2xl font-bold text-navy">
              {formatPrice(property.price, property.currency, property.priceQualifier)}
              <span className="text-sm font-normal text-navy/50">{formatPricePeriod(property.purpose, property.pricePeriod)}</span>
            </p>
            {reducedDate && (
              <p className="flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-50 rounded px-2 py-1 mt-1 w-fit">
                <TrendingDown className="w-3 h-3" /> Reduced on {reducedDate}
              </p>
            )}
            <p className="text-sm text-navy/50 capitalize mt-1">For {property.purpose === "shortlet" ? "short-let" : property.purpose}</p>
            {property.purpose === "shortlet" && property.reviewEvidence?.checkedAt && (
              <p className="mt-2 rounded bg-blue-50 px-3 py-2 text-xs text-blue-800">
                Fabhouse completed the listed short-stay checks on {new Date(property.reviewEvidence.checkedAt).toLocaleDateString()}. This is not a property-title guarantee or inspection certificate.
              </p>
            )}

            {/* Identity review does not verify property ownership or title. */}
            {property.owner?.isVerified && (
              <div className="flex items-center gap-2 mt-3 bg-green-50 border border-green-200 rounded-md px-3 py-2">
                <ShieldCheck className="w-4 h-4 text-green-600 shrink-0" />
                <span className="text-xs font-semibold text-green-700">Contact identity checked by Fabhouse</span>
              </div>
            )}

            {property.status === "active" && (
              <div className="mt-3">
                <SaveListingButton propertyId={property._id.toString()} variant="full" />
              </div>
            )}

            {property.purpose === "sale" && property.priceQualifier !== "poa" && property.status === "active" && (
              <AffordabilityCalculator price={property.price} currency={property.currency} />
            )}

            {property.status === "active" && (
              <div className="border-t border-navy/10 mt-4 pt-4">
                {property.owner?._id ? (
                  <Link
                    href={`/agents/${property.owner._id}`}
                    className="font-semibold text-navy flex items-center gap-1 hover:text-gold-dark transition"
                  >
                    {property.owner?.isVerified && <BadgeCheck className="w-4 h-4 text-gold" />}
                    {property.owner?.name ?? "Fabhouse Agent"}
                  </Link>
                ) : (
                  <p className="font-semibold text-navy flex items-center gap-1">
                    {property.owner?.isVerified && <BadgeCheck className="w-4 h-4 text-gold" />}
                    {property.owner?.name ?? "Fabhouse Agent"}
                  </p>
                )}
                {property.owner?.phone && isValidWhatsAppPhone(property.owner.phone, property.location.countryCode ?? "NG") && (
                  <a
                    href={buildWhatsAppLink(
                      property.owner.phone,
                      property.purpose === "shortlet"
                        ? `Hi, I'm interested in "${property.title}" on Fabhouse. Do you have availability for my dates?`
                        : `Hi, I'm interested in "${property.title}" on Fabhouse. Is it still available?`,
                      property.location.countryCode ?? "NG"
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 flex items-center justify-center gap-2 bg-[#25D366] text-white font-semibold py-2.5 rounded-md hover:bg-[#1fb958] transition"
                  >
                    <MessageCircle className="w-4 h-4" /> {property.purpose === "shortlet" ? "Ask about dates on WhatsApp" : "Message on WhatsApp"}
                  </a>
                )}
                {property.owner?.phone && (
                  <a
                    href={`tel:${property.owner.phone}`}
                    className="mt-2 flex items-center justify-center gap-2 bg-navy text-white font-semibold py-2.5 rounded-md hover:bg-navy-light transition"
                  >
                    <Phone className="w-4 h-4" /> Call {property.owner.phone}
                  </a>
                )}
                <a
                  href={`mailto:${property.owner?.email ?? ""}?subject=Inquiry about ${encodeURIComponent(property.title)}`}
                  className="mt-2 block text-center border border-navy text-navy font-semibold py-2.5 rounded-md hover:bg-navy hover:text-white transition"
                >
                  Email agent directly
                </a>

                {property.purpose === "shortlet" ? property.reviewEvidence?.checkedAt ? (
                  <StayRequestForm propertyId={property._id.toString()} />
                ) : (
                  <><p className="mt-4 rounded bg-amber-50 p-3 text-xs text-amber-900">Date requests are paused while Fabhouse completes this short-stay listing review. Contact the host directly to ask about availability.</p><InquiryForm propertyId={property._id.toString()} isShortlet /></>
                ) : <InquiryForm propertyId={property._id.toString()} />}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

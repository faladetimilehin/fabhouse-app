import Link from "next/link";
import Image from "next/image";
import { MapPin, BedDouble, Bath, BadgeCheck, Star, TrendingDown, Video } from "lucide-react";
import { formatPrice, formatPricePeriod, formatReducedDate } from "@/lib/formatting";
import SaveListingButton from "@/components/SaveListingButton";
import { getMarket } from "@/config/markets";

interface PropertyCardProps {
  property: {
    _id: string;
    title: string;
    price: number;
    pricePeriod?: string;
    currency: string;
    priceQualifier?: string;
    priceReducedAt?: string;
    type: string;
    purpose: string;
    location: { city: string; state: string; countryCode?: string };
    bedrooms?: number;
    bathrooms?: number;
    images: string[];
    videos?: string[];
    isFeatured?: boolean;
    owner?: { name: string; isVerified?: boolean };
  };
  isSaved?: boolean;
}

export default function PropertyCard({ property, isSaved }: PropertyCardProps) {
  const reducedDate = formatReducedDate(property.priceReducedAt);
  const purposeLabel = property.purpose === "shortlet" ? "Short-let" : property.purpose;
  const countryLabel = getMarket(property.location.countryCode).name;

  return (
    <Link
      href={`/listings/${property._id}`}
      className="bg-white rounded-lg overflow-hidden border border-navy/10 hover:shadow-lg transition group"
    >
      <div className="relative aspect-[4/3] bg-navy/5 flex items-center justify-center overflow-hidden">
        {property.images?.[0] ? (
          <Image
            src={property.images[0]}
            alt={property.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover group-hover:scale-105 transition duration-300"
          />
        ) : (
          <span className="text-navy/30 text-sm">No image yet</span>
        )}
        {property.isFeatured && (
          <span className="absolute top-2 left-2 bg-gold text-navy text-xs font-bold px-2 py-1 rounded flex items-center gap-1">
            <Star className="w-3 h-3" /> Featured
          </span>
        )}
        <span className="absolute bottom-2 left-2 bg-navy/80 text-white text-xs font-semibold px-2 py-1 rounded capitalize">
          For {purposeLabel}
        </span>
        {property.videos && property.videos.length > 0 && (
          <span className="absolute bottom-2 right-2 bg-black/70 text-white text-xs font-semibold px-2 py-1 rounded flex items-center gap-1">
            <Video className="w-3 h-3" /> Video
          </span>
        )}
        <SaveListingButton propertyId={property._id} initiallySaved={isSaved} />
      </div>

      <div className="p-4">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-bold text-navy text-lg">
            {formatPrice(property.price, property.currency, property.priceQualifier)}
            <span className="text-sm font-normal text-navy/50">{formatPricePeriod(property.purpose, property.pricePeriod)}</span>
          </p>
          {reducedDate && (
            <span className="flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-50 px-2 py-0.5 rounded">
              <TrendingDown className="w-3 h-3" /> Reduced {reducedDate}
            </span>
          )}
        </div>
        <h3 className="font-semibold text-navy mt-1 line-clamp-1">{property.title}</h3>
        <p className="text-sm text-navy/60 flex items-center gap-1 mt-1">
          <MapPin className="w-3.5 h-3.5" /> {property.location.city}, {property.location.state}{property.location.countryCode && property.location.countryCode !== "NG" ? `, ${countryLabel}` : ""}
        </p>

        {(property.bedrooms || property.bathrooms) && (
          <div className="flex items-center gap-4 mt-2 text-sm text-navy/60">
            {property.bedrooms !== undefined && (
              <span className="flex items-center gap-1"><BedDouble className="w-4 h-4" /> {property.bedrooms}</span>
            )}
            {property.bathrooms !== undefined && (
              <span className="flex items-center gap-1"><Bath className="w-4 h-4" /> {property.bathrooms}</span>
            )}
          </div>
        )}

        {property.owner && (
          <p className="text-xs text-navy/50 mt-3 flex items-center gap-1 border-t border-navy/10 pt-2">
            {property.owner.isVerified && <BadgeCheck className="w-3.5 h-3.5 text-gold" />}
            {property.owner.name}
          </p>
        )}
      </div>
    </Link>
  );
}

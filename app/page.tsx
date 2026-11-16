import Link from "next/link";
import { Home, MapPin, ShieldCheck, Building2, Trees } from "lucide-react";

const propertyTypes = [
  { label: "Houses", type: "house", icon: Home },
  { label: "Flats & Apartments", type: "flat", icon: Building2 },
  { label: "Land", type: "land", icon: Trees },
  { label: "Commercial", type: "commercial", icon: Building2 },
];

export default function HomePage() {
  return (
    <div>
      {/* Hero */}
      <section className="bg-navy text-white px-6 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold leading-tight">
            Find property in Nigeria you can actually trust.
          </h1>
          <p className="mt-4 text-white/80 text-lg">
            Verified listings for buyers and renters at home — and for Nigerians abroad
            investing back home.
          </p>

          <form action="/listings" className="mt-8 bg-white rounded-lg p-2 flex flex-col sm:flex-row gap-2 max-w-2xl mx-auto">
            <div className="flex items-center flex-1 px-3">
              <MapPin className="w-4 h-4 text-navy/50 mr-2 shrink-0" />
              <input
                name="q"
                placeholder="Search by city, state, or keyword"
                className="w-full py-2 text-navy outline-none placeholder:text-navy/40"
              />
            </div>
            <button
              type="submit"
              className="bg-gold text-navy font-semibold px-6 py-2.5 rounded-md hover:bg-gold-light transition"
            >
              Search
            </button>
          </form>
        </div>
      </section>

      {/* Property types */}
      <section className="px-6 py-14 max-w-5xl mx-auto">
        <h2 className="text-2xl font-bold text-navy mb-6">Browse by property type</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {propertyTypes.map(({ label, type, icon: Icon }) => (
            <Link
              key={type}
              href={`/listings?type=${type}`}
              className="bg-white border border-navy/10 rounded-lg p-6 flex flex-col items-center gap-3 hover:border-gold hover:shadow-md transition"
            >
              <Icon className="w-8 h-8 text-gold" />
              <span className="font-semibold text-navy text-center">{label}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Trust strip */}
      <section className="px-6 py-14 bg-white">
        <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-8 text-center">
          <div className="flex flex-col items-center gap-3">
            <ShieldCheck className="w-8 h-8 text-gold" />
            <h3 className="font-semibold text-navy">Verified agents</h3>
            <p className="text-sm text-navy/60">Every agent and developer profile carries a trust badge you can check before you deal.</p>
          </div>
          <div className="flex flex-col items-center gap-3">
            <Home className="w-8 h-8 text-gold" />
            <h3 className="font-semibold text-navy">Built for the diaspora</h3>
            <p className="text-sm text-navy/60">Clear photos, video, and pricing so you can shortlist property without flying home first.</p>
          </div>
          <div className="flex flex-col items-center gap-3">
            <MapPin className="w-8 h-8 text-gold" />
            <h3 className="font-semibold text-navy">No middlemen markup</h3>
            <p className="text-sm text-navy/60">Message agents and landlords directly — your commission structure stays yours.</p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-16 text-center">
        <h2 className="text-2xl font-bold text-navy">Have a property to list?</h2>
        <p className="text-navy/60 mt-2">It's free to list on Fabhouse during launch.</p>
        <Link
          href="/register"
          className="inline-block mt-6 bg-navy text-white font-semibold px-6 py-3 rounded-md hover:bg-navy-light transition"
        >
          List your property
        </Link>
      </section>
    </div>
  );
}

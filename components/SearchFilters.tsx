"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, ChevronDown } from "lucide-react";
import { getMarket, MARKETS } from "@/config/markets";

export default function SearchFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [filters, setFilters] = useState({
    q: searchParams.get("q") || "",
    minPrice: searchParams.get("minPrice") || "",
    maxPrice: searchParams.get("maxPrice") || "",
    bedrooms: searchParams.get("bedrooms") || "",
    bathrooms: searchParams.get("bathrooms") || "",
    type: searchParams.get("type") || "",
    purpose: searchParams.get("purpose") || "sale",
    state: searchParams.get("state") || "",
    country: searchParams.get("country") || "all",
    priceCurrency: searchParams.get("priceCurrency") || getMarket(searchParams.get("country")).currency,
    featured: searchParams.get("featured") === "true",
  });

  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    
    const params = new URLSearchParams();
    
    if (filters.q) params.set("q", filters.q);
    if (filters.minPrice) params.set("minPrice", filters.minPrice);
    if (filters.maxPrice) params.set("maxPrice", filters.maxPrice);
    if (filters.bedrooms) params.set("bedrooms", filters.bedrooms);
    if (filters.bathrooms) params.set("bathrooms", filters.bathrooms);
    if (filters.type) params.set("type", filters.type);
    if (filters.purpose) params.set("purpose", filters.purpose);
    if (filters.state) params.set("state", filters.state);
    if (filters.country) params.set("country", filters.country);
    if (filters.priceCurrency) params.set("priceCurrency", filters.priceCurrency);
    if (filters.featured) params.set("featured", "true");

    router.push(`/search-map?${params.toString()}`);
  };

  const handleReset = () => {
    setFilters({
      q: "",
      minPrice: "",
      maxPrice: "",
      bedrooms: "",
      bathrooms: "",
      type: "",
      purpose: "sale",
      state: "",
      country: "all",
      priceCurrency: "NGN",
      featured: false,
    });
    router.push("/search-map");
  };

  return (
    <div className="bg-white border-b border-navy/10">
      <div className="max-w-6xl mx-auto px-6 py-6">
        {/* Main search bar */}
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-navy/50" />
              <input
                type="text"
                placeholder="Search by location, address, or keyword..."
                value={filters.q}
                onChange={(e) => setFilters({ ...filters, q: e.target.value })}
                className="w-full pl-10 pr-4 py-2.5 border border-navy/15 rounded-lg outline-none focus:border-gold"
              />
            </div>
            <button
              type="submit"
              className="bg-navy text-white font-semibold px-6 py-2.5 rounded-lg hover:bg-navy-light transition"
            >
              Search
            </button>
            {(filters.q || filters.minPrice || filters.maxPrice || filters.bedrooms || filters.type) && (
              <button
                type="button"
                onClick={handleReset}
                className="bg-navy/10 text-navy font-semibold px-6 py-2.5 rounded-lg hover:bg-navy/20 transition"
              >
                Clear
              </button>
            )}
          </div>

          {/* Purpose toggle */}
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="purpose"
                value="sale"
                checked={filters.purpose === "sale"}
                onChange={(e) => setFilters({ ...filters, purpose: e.target.value })}
                className="w-4 h-4"
              />
              <span className="text-sm text-navy">For Sale</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="purpose"
                value="rent"
                checked={filters.purpose === "rent"}
                onChange={(e) => setFilters({ ...filters, purpose: e.target.value })}
                className="w-4 h-4"
              />
              <span className="text-sm text-navy">To Rent</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="purpose"
                value="shortlet"
                checked={filters.purpose === "shortlet"}
                onChange={(e) => setFilters({ ...filters, purpose: e.target.value })}
                className="w-4 h-4"
              />
              <span className="text-sm text-navy">Short-let</span>
            </label>
          </div>

          {/* Advanced filters toggle */}
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-2 text-sm text-gold-dark font-semibold hover:text-gold transition"
          >
            <ChevronDown className={`w-4 h-4 transition ${showAdvanced ? "rotate-180" : ""}`} />
            {showAdvanced ? "Hide" : "Show"} Advanced Filters
          </button>

          {/* Advanced filters */}
          {showAdvanced && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4 bg-navy/5 rounded-lg">
              <div>
                <label className="text-sm font-semibold text-navy">Market</label>
                <select
                  value={filters.country}
                  onChange={(e) => setFilters({ ...filters, country: e.target.value, priceCurrency: getMarket(e.target.value).currency })}
                  className="mt-1 w-full border border-navy/15 rounded-md px-3 py-2 outline-none focus:border-gold"
                >
                  <option value="all">All markets</option>
                  {MARKETS.map((market) => <option key={market.code} value={market.code}>{market.name}</option>)}
                </select>
              </div>
              {/* Price range */}
              <div>
                <label className="text-sm font-semibold text-navy">Min Price ({filters.priceCurrency})</label>
                <input
                  type="number"
                  placeholder="0"
                  value={filters.minPrice}
                  onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })}
                  className="mt-1 w-full border border-navy/15 rounded-md px-3 py-2 outline-none focus:border-gold"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-navy">Max Price ({filters.priceCurrency})</label>
                <input
                  type="number"
                  placeholder="Unlimited"
                  value={filters.maxPrice}
                  onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
                  className="mt-1 w-full border border-navy/15 rounded-md px-3 py-2 outline-none focus:border-gold"
                />
              </div>

              {/* Bedrooms */}
              <div>
                <label className="text-sm font-semibold text-navy">Bedrooms</label>
                <select
                  value={filters.bedrooms}
                  onChange={(e) => setFilters({ ...filters, bedrooms: e.target.value })}
                  className="mt-1 w-full border border-navy/15 rounded-md px-3 py-2 outline-none focus:border-gold"
                >
                  <option value="">Any</option>
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3">3</option>
                  <option value="4">4</option>
                  <option value="5">5+</option>
                </select>
              </div>

              {/* Bathrooms */}
              <div>
                <label className="text-sm font-semibold text-navy">Bathrooms</label>
                <select
                  value={filters.bathrooms}
                  onChange={(e) => setFilters({ ...filters, bathrooms: e.target.value })}
                  className="mt-1 w-full border border-navy/15 rounded-md px-3 py-2 outline-none focus:border-gold"
                >
                  <option value="">Any</option>
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3">3</option>
                  <option value="4">4+</option>
                </select>
              </div>

              {/* Property type */}
              <div>
                <label className="text-sm font-semibold text-navy">Property Type</label>
                <select
                  value={filters.type}
                  onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                  className="mt-1 w-full border border-navy/15 rounded-md px-3 py-2 outline-none focus:border-gold"
                >
                  <option value="">Any</option>
                  <option value="house">House</option>
                  <option value="flat">Flat / Apartment</option>
                  <option value="land">Land</option>
                  <option value="commercial">Commercial</option>
                </select>
              </div>

              {/* State */}
              <div>
                <label className="text-sm font-semibold text-navy">State</label>
                <select
                  value={filters.state}
                  onChange={(e) => setFilters({ ...filters, state: e.target.value })}
                  className="mt-1 w-full border border-navy/15 rounded-md px-3 py-2 outline-none focus:border-gold"
                >
                  <option value="">All States</option>
                  <option value="Lagos">Lagos</option>
                  <option value="Abuja">Abuja</option>
                  <option value="Ogun">Ogun</option>
                  <option value="Oyo">Oyo</option>
                  <option value="Ondo">Ondo</option>
                  <option value="Edo">Edo</option>
                  <option value="Delta">Delta</option>
                  <option value="Rivers">Rivers</option>
                  <option value="Enugu">Enugu</option>
                  <option value="Anambra">Anambra</option>
                  <option value="Abia">Abia</option>
                  <option value="Imo">Imo</option>
                  <option value="Bauchi">Bauchi</option>
                  <option value="Kaduna">Kaduna</option>
                  <option value="Kano">Kano</option>
                  <option value="Katsina">Katsina</option>
                  <option value="Kebbi">Kebbi</option>
                  <option value="Kwara">Kwara</option>
                  <option value="Niger">Niger</option>
                  <option value="Plateau">Plateau</option>
                  <option value="Nassarawa">Nassarawa</option>
                  <option value="Gombe">Gombe</option>
                  <option value="Adamawa">Adamawa</option>
                  <option value="Taraba">Taraba</option>
                  <option value="Yobe">Yobe</option>
                  <option value="Borno">Borno</option>
                  <option value="Jigawa">Jigawa</option>
                  <option value="Zamfara">Zamfara</option>
                  <option value="Sokoto">Sokoto</option>
                  <option value="Kogi">Kogi</option>
                  <option value="Osun">Osun</option>
                  <option value="Ekiti">Ekiti</option>
                  <option value="Akwa Ibom">Akwa Ibom</option>
                  <option value="Cross River">Cross River</option>
                  <option value="Calabar">Calabar</option>
                  <option value="Ebonyi">Ebonyi</option>
                </select>
              </div>

              {/* Featured */}
              <div className="flex items-end">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.featured}
                    onChange={(e) => setFilters({ ...filters, featured: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <span className="text-sm text-navy font-semibold">Featured Only</span>
                </label>
              </div>

              <div className="flex gap-2 col-span-2 md:col-span-3 lg:col-span-1 items-end">
                <button
                  type="submit"
                  className="w-full bg-gold text-navy font-semibold py-2 rounded-lg hover:bg-gold-light transition"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

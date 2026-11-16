/**
 * Seed script — creates an admin user and a couple of sample listings
 * so you have something to look at locally.
 *
 * Run with: node scripts/seed.js
 * (requires MONGODB_URI to be set in your environment or .env.local)
 */
require("dotenv").config({ path: ".env.local" });
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);

  // Mirrors lib/currency.ts — kept in sync manually since this script
  // runs standalone via `node`, not through the Next.js/TS build.
  const RATES_TO_NGN = { NGN: 1, USD: 1550, GBP: 1980 };
  function toNGN(amount, currency) {
    return Math.round(amount * (RATES_TO_NGN[currency] ?? 1));
  }

  const UserSchema = new mongoose.Schema({}, { strict: false, timestamps: true });
  const PropertySchema = new mongoose.Schema({}, { strict: false, timestamps: true });
  const InquirySchema = new mongoose.Schema({}, { strict: false, timestamps: true });
  const User = mongoose.models.User || mongoose.model("User", UserSchema);
  const Property = mongoose.models.Property || mongoose.model("Property", PropertySchema);
  const Inquiry = mongoose.models.Inquiry || mongoose.model("Inquiry", InquirySchema);

  const adminEmail = "admin@fabhouse.ng";
  let admin = await User.findOne({ email: adminEmail });
  if (!admin) {
    admin = await User.create({
      name: "Fabhouse Admin",
      email: adminEmail,
      passwordHash: await bcrypt.hash("changeme123", 10),
      role: "admin",
      isVerified: true,
      planTier: "free",
    });
    console.log("Created admin user:", adminEmail, "/ password: changeme123");
  } else {
    console.log("Admin user already exists.");
  }

  const agentEmail = "agent@fabhouse.ng";
  let agent = await User.findOne({ email: agentEmail });
  if (!agent) {
    agent = await User.create({
      name: "Chidi Realty",
      email: agentEmail,
      passwordHash: await bcrypt.hash("changeme123", 10),
      role: "agent",
      isVerified: true,
      phone: "+234 800 000 0000",
      planTier: "free",
    });
    console.log("Created agent user:", agentEmail, "/ password: changeme123");
  }

  const existingListings = await Property.countDocuments({ owner: agent._id });
  if (existingListings === 0) {
    await Property.create([
      {
        title: "4-Bedroom Duplex in Lekki Phase 1",
        description: "Spacious, newly built duplex with BQ, in a serene estate with 24/7 power and security.",
        type: "house",
        purpose: "sale",
        price: 150000000,
        currency: "NGN",
        priceNGN: toNGN(150000000, "NGN"),
        location: { state: "Lagos", city: "Lekki", address: "Lekki Phase 1" },
        bedrooms: 4,
        bathrooms: 5,
        amenities: ["24/7 power", "Security", "Water", "Parking"],
        images: [],
        owner: agent._id,
        status: "active",
        isFeatured: true,
      },
      {
        title: "2-Bedroom Flat for Rent in Wuse 2",
        description: "Well-finished flat close to the city center, ideal for young professionals.",
        type: "flat",
        purpose: "rent",
        price: 3500000,
        currency: "NGN",
        priceNGN: toNGN(3500000, "NGN"),
        location: { state: "Abuja", city: "Wuse 2" },
        bedrooms: 2,
        bathrooms: 2,
        amenities: ["Water", "Parking"],
        images: [],
        owner: agent._id,
        status: "active",
      },
      {
        title: "Half Plot of Land in Ajah",
        description: "Dry land with Governor's Consent, suitable for residential development.",
        type: "land",
        purpose: "sale",
        price: 25000000,
        currency: "NGN",
        priceNGN: toNGN(25000000, "NGN"),
        priceQualifier: "negotiable",
        location: { state: "Lagos", city: "Ajah" },
        landSize: "Half plot (approx. 350 sqm)",
        tenure: "governors_consent",
        amenities: [],
        images: [],
        owner: agent._id,
        status: "pending",
      },
      {
        title: "7-Bedroom Detached House, Cryfield Grange Road",
        description: "An exceptional detached family home set within private grounds in one of Coventry's most sought-after roads, offering generous living space throughout.",
        type: "house",
        purpose: "sale",
        price: 3500000,
        currency: "GBP",
        priceNGN: toNGN(3500000, "GBP"),
        priceQualifier: "offers_over",
        previousPrice: 3750000,
        priceReducedAt: new Date("2026-06-05"),
        location: { state: "Warwickshire", city: "Coventry", address: "Cryfield Grange Road", postcode: "CV4 7AQ" },
        bedrooms: 7,
        bathrooms: 7,
        sizeSqFt: 10292,
        tenure: "freehold",
        amenities: ["Private grounds", "Double garage", "Home cinema"],
        images: [],
        owner: agent._id,
        status: "active",
        isFeatured: true,
      },
    ]);
    console.log("Created sample listings.");

    const firstListing = await Property.findOne({ owner: agent._id, status: "active" });
    if (firstListing) {
      await Inquiry.create([
        {
          property: firstListing._id,
          buyerName: "Amaka Obi",
          buyerContact: "amaka.obi@example.com",
          message: "Is this still available? I'm relocating from London and would love to schedule a virtual tour.",
        },
        {
          property: firstListing._id,
          buyerName: "Tunde Bakare",
          buyerContact: "+234 801 234 5678",
          message: "What's the last price on this? Also is the estate gated?",
        },
      ]);
      console.log("Created sample inquiries.");
    }
  }

  console.log("Seed complete.");
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});

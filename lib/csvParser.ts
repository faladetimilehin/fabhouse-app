/**
 * CSV Parser for Bulk Property Upload
 * Converts CSV to Property objects with validation
 */

import { MARKETS } from "@/config/markets";

export interface PropertyCSVRow {
  address: string;
  title?: string;
  price: number;
  bedrooms?: number;
  bathrooms?: number;
  type: "house" | "flat" | "land" | "shortlet" | "commercial";
  purpose: "sale" | "rent" | "shortlet";
  countryCode: string;
  currency: string;
  pricePeriod?: "night" | "week" | "month" | "year";
  city: string;
  state: string;
  description?: string;
  lga?: string;
  images?: string; // comma-separated URLs
  amenities?: string; // comma-separated
}

export interface ParseResult {
  valid: PropertyCSVRow[];
  errors: { row: number; error: string }[];
}

/**
 * Parse CSV text into property objects
 */
export function parsePropertyCSV(csvText: string): ParseResult {
  const lines = csvText.trim().split("\n");
  const valid: PropertyCSVRow[] = [];
  const errors: { row: number; error: string }[] = [];

  if (lines.length < 2) {
    return { valid: [], errors: [{ row: 0, error: "CSV must have header and at least 1 data row" }] };
  }

  // Parse header
  const headers = parseCSVLine(lines[0]);
  const requiredFields = ["address", "price", "type", "purpose"];
  const missingFields = requiredFields.filter((f) => !headers.includes(f));

  if (missingFields.length > 0) {
    return {
      valid: [],
      errors: [{ row: 0, error: `Missing required fields: ${missingFields.join(", ")}` }],
    };
  }

  // Parse data rows
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue; // Skip empty lines

    try {
      const values = parseCSVLine(lines[i]);
      const row: any = {};

      headers.forEach((header, idx) => {
        row[header] = values[idx]?.trim() || "";
      });

      // Validate required fields
      if (!row.address) throw new Error("Address is required");
      const price = Number(row.price);
      if (!Number.isFinite(price) || price <= 0) throw new Error("Price must be a number greater than zero");
      if (row.bedrooms && (!Number.isInteger(Number(row.bedrooms)) || Number(row.bedrooms) < 0)) {
        throw new Error("Bedrooms must be a non-negative whole number");
      }
      if (row.bathrooms && (!Number.isInteger(Number(row.bathrooms)) || Number(row.bathrooms) < 0)) {
        throw new Error("Bathrooms must be a non-negative whole number");
      }
      if (!["house", "flat", "land", "shortlet", "commercial"].includes(row.type)) {
        throw new Error("Type must be: house, flat, land, shortlet, or commercial");
      }
      if (!["sale", "rent", "shortlet"].includes(row.purpose)) {
        throw new Error("Purpose must be: sale, rent, or shortlet");
      }
      const countryCode = (row.countryCode || "NG").toUpperCase();
      const market = MARKETS.find((item) => item.code === countryCode);
      if (!market) throw new Error("Country must be NG, GH, KE, or ZA");
      const city = row.city || row.lga;
      const state = row.state || row.region;
      if (!state || !city) throw new Error("State/region and city are required");
      const currency = row.currency || market.currency;
      if (![market.currency, "GBP", "USD"].includes(currency)) {
        throw new Error(`Currency must be ${market.currency}, GBP, or USD for ${market.name}`);
      }
      const defaultPeriod = row.purpose === "shortlet" ? "night" : countryCode === "NG" ? "year" : "month";
      const pricePeriod = row.purpose === "sale" ? undefined : row.pricePeriod || defaultPeriod;
      if (row.purpose === "shortlet" && !["night", "week"].includes(pricePeriod ?? "")) {
        throw new Error("Short-let pricePeriod must be night or week");
      }
      if (row.purpose === "rent" && !["month", "year"].includes(pricePeriod ?? "")) {
        throw new Error("Rental pricePeriod must be month or year");
      }
      if (row.images) {
        const urls = row.images.split(",").map((url: string) => url.trim()).filter(Boolean);
        if (urls.some((url: string) => {
          try {
            return !["http:", "https:"].includes(new URL(url).protocol);
          } catch {
            return true;
          }
        })) throw new Error("Images must be public HTTP or HTTPS URLs");
      }

      // Convert types
      const property: PropertyCSVRow = {
        address: row.address,
        title: row.title || undefined,
        price,
        bedrooms: row.bedrooms ? Number(row.bedrooms) : undefined,
        bathrooms: row.bathrooms ? Number(row.bathrooms) : undefined,
        type: row.type,
        purpose: row.purpose,
        countryCode,
        currency,
        pricePeriod: pricePeriod as PropertyCSVRow["pricePeriod"],
        city,
        state,
        description: row.description || "",
        images: row.images || "",
        amenities: row.amenities || "",
      };

      valid.push(property);
    } catch (err) {
      errors.push({
        row: i + 1,
        error: err instanceof Error ? err.message : "Invalid row",
      });
    }
  }

  return { valid, errors };
}

/**
 * Parse CSV line accounting for quoted values
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }

  result.push(current);
  return result;
}

/**
 * Generate sample CSV template
 */
export function generateCSVTemplate(): string {
  return `title,address,price,currency,pricePeriod,bedrooms,bathrooms,type,purpose,description,countryCode,state,city,images,amenities
"3-bedroom flat in Ikoyi","123 Lekki Road",5000000,NGN,,3,2,flat,sale,"Modern apartment with facilities",NG,Lagos,Ikoyi,"https://example.com/img1.jpg,https://example.com/img2.jpg","Pool,Gym,Security"
"Furnished short-let in Lekki","Apartment A12",85000,NGN,night,1,1,flat,shortlet,"Furnished studio apartment with power backup",NG,Lagos,Lekki,"https://example.com/img3.jpg","Kitchen,WiFi,Power backup"
"Modern apartment in Accra","12 Airport Road",2200,GHS,month,2,2,flat,rent,"Two-bedroom apartment close to central Accra",GH,Greater Accra,Accra,"https://example.com/img4.jpg","Parking,Security"`;
}

/**
 * Validate CSV file
 */
export function validateCSVFile(file: File): { valid: boolean; error?: string } {
  if (!file.name.endsWith(".csv")) {
    return { valid: false, error: "File must be CSV format" };
  }

  if (file.size > 5 * 1024 * 1024) {
    // 5MB limit
    return { valid: false, error: "File size must be less than 5MB" };
  }

  return { valid: true };
}

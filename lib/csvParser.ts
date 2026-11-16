/**
 * CSV Parser for Bulk Property Upload
 * Converts CSV to Property objects with validation
 */

export interface PropertyCSVRow {
  address: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  type: "house" | "flat" | "land" | "commercial";
  purpose: "sale" | "rent";
  description?: string;
  state?: string;
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
  const requiredFields = ["address", "price", "bedrooms", "bathrooms", "type", "purpose"];
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
      if (!row.price || isNaN(row.price)) throw new Error("Price must be a number");
      if (!row.bedrooms || isNaN(row.bedrooms)) throw new Error("Bedrooms must be a number");
      if (!row.bathrooms || isNaN(row.bathrooms)) throw new Error("Bathrooms must be a number");
      if (!["house", "flat", "land", "commercial"].includes(row.type)) {
        throw new Error("Type must be: house, flat, land, or commercial");
      }
      if (!["sale", "rent"].includes(row.purpose)) {
        throw new Error("Purpose must be: sale or rent");
      }

      // Convert types
      const property: PropertyCSVRow = {
        address: row.address,
        price: parseInt(row.price),
        bedrooms: parseInt(row.bedrooms),
        bathrooms: parseInt(row.bathrooms),
        type: row.type,
        purpose: row.purpose,
        description: row.description || "",
        state: row.state || "",
        lga: row.lga || "",
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
  return `address,price,bedrooms,bathrooms,type,purpose,description,state,lga,images,amenities
"123 Lekki Road, Lagos",5000000,3,2,flat,sale,"Modern apartment with facilities","Lagos","Ikoyi","https://example.com/img1.jpg,https://example.com/img2.jpg","Pool,Gym,Security"
"Plot 45 Banana Island",25000000,4,3,house,sale,"Luxury home with garden","Lagos","Ikoyi","https://example.com/img3.jpg","Garden,Parking,Staff Quarters"
"Apartment A12, Abuja Estate",250000,1,1,flat,rent,"Furnished studio apartment","Abuja","Central","https://example.com/img4.jpg","Kitchen,WiFi"`;
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

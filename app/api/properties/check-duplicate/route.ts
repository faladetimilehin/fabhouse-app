import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { dbConnect } from "@/lib/mongodb";
import { checkImageDuplicates, checkAddressDuplicate } from "@/lib/fingerprint";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  await dbConnect();

  const { images = [], address = "", city = "", state = "", countryCode = "NG", excludeListingId } = await req.json();

  const [imageDuplicates, addressCount] = await Promise.all([
    checkImageDuplicates(images, excludeListingId),
    checkAddressDuplicate(address, city, state, excludeListingId, countryCode),
  ]);

  return NextResponse.json({
    imageDuplicates, // [{ url, existingCount }]
    addressCount,    // number of OTHER listings at this address
  });
}

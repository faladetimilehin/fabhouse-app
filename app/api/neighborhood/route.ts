import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import NeighborhoodData from "@/models/NeighborhoodData";
import Property from "@/models/Property";

/**
 * GET - Fetch neighborhood data by coordinates or property ID
 */
export async function GET(req: NextRequest) {
  try {
    await dbConnect();

    const searchParams = req.nextUrl.searchParams;
    const propertyId = searchParams.get("propertyId");
    const lat = searchParams.get("lat");
    const lng = searchParams.get("lng");
    const state = searchParams.get("state");
    const lga = searchParams.get("lga");

    const query: any = {};

    // Option 1: By property location
    if (propertyId) {
      const property = await Property.findById(propertyId);
      if (!property) {
        return NextResponse.json(
          { error: "Property not found" },
          { status: 404 }
        );
      }
      query.state = property.location.state;
      query.lga = property.location.city;
    } else if (lat && lng) {
      // Option 2: By coordinates (geospatial)
      const neighborhood = await NeighborhoodData.findOne({
        location: {
          $near: {
            $geometry: {
              type: "Point",
              coordinates: [parseFloat(lng), parseFloat(lat)],
            },
            $maxDistance: 5000, // 5km radius
          },
        },
      });

      if (!neighborhood) {
        return NextResponse.json(
          { error: "No neighborhood data found for this location" },
          { status: 404 }
        );
      }

      return NextResponse.json({ neighborhood });
    } else if (state && lga) {
      // Option 3: By state/LGA
      query.state = state;
      query.lga = lga;
    } else {
      return NextResponse.json(
        { error: "Provide propertyId, coordinates, or state/lga" },
        { status: 400 }
      );
    }

    const neighborhood = await NeighborhoodData.findOne(query);

    if (!neighborhood) {
      return NextResponse.json(
        { error: "No neighborhood data available for this area yet" },
        { status: 404 }
      );
    }

    return NextResponse.json({ neighborhood });
  } catch (err) {
    console.error("Neighborhood fetch error:", err);
    return NextResponse.json(
      { error: "Failed to fetch neighborhood data" },
      { status: 500 }
    );
  }
}

/**
 * POST - Create/update neighborhood data (Admin only)
 */
export async function POST(req: NextRequest) {
  try {
    // Could add admin check here if needed
    const body = await req.json();

    const {
      address,
      state,
      lga,
      latitude,
      longitude,
      safetyScore,
      walkabilityScore,
      developmentScore,
      schools,
      healthcare,
      transport,
      amenities,
      populationDensity,
      averageIncome,
      propertyTypes,
    } = body;

    if (!address || !state || !lga || !latitude || !longitude) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    await dbConnect();

    // Check if exists
    const existing = await NeighborhoodData.findOne({ state, lga });

    if (existing) {
      // Update
      const updated = await NeighborhoodData.findByIdAndUpdate(
        existing._id,
        {
          address,
          location: {
            type: "Point",
            coordinates: [longitude, latitude],
          },
          safetyScore: safetyScore || existing.safetyScore,
          walkabilityScore: walkabilityScore || existing.walkabilityScore,
          developmentScore: developmentScore || existing.developmentScore,
          schools: schools || existing.schools,
          healthcare: healthcare || existing.healthcare,
          transport: transport || existing.transport,
          amenities: amenities || existing.amenities,
          populationDensity: populationDensity || existing.populationDensity,
          averageIncome: averageIncome || existing.averageIncome,
          propertyTypes: propertyTypes || existing.propertyTypes,
          lastUpdated: new Date(),
        },
        { new: true }
      );

      return NextResponse.json({ success: true, neighborhood: updated });
    }

    // Create new
    const neighborhood = await NeighborhoodData.create({
      address,
      state,
      lga,
      location: {
        type: "Point",
        coordinates: [longitude, latitude],
      },
      safetyScore: safetyScore || 3,
      walkabilityScore: walkabilityScore || 3,
      developmentScore: developmentScore || 3,
      schools: schools || [],
      healthcare: healthcare || [],
      transport: transport || [],
      amenities: amenities || [],
      populationDensity,
      averageIncome,
      propertyTypes,
      lastUpdated: new Date(),
    });

    return NextResponse.json(
      { success: true, neighborhood },
      { status: 201 }
    );
  } catch (err) {
    console.error("Neighborhood create error:", err);
    return NextResponse.json(
      { error: "Failed to create neighborhood data" },
      { status: 500 }
    );
  }
}

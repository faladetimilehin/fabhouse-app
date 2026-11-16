import { dbConnect } from "@/lib/mongodb";
import StayBooking from "@/models/StayBooking";

export async function expireUnpaidStayHolds() {
  await dbConnect();
  const result = await StayBooking.updateMany(
    { status: "accepted_unpaid", holdExpiresAt: { $lte: new Date() } },
    { $set: { status: "expired" } }
  );
  return result.modifiedCount;
}

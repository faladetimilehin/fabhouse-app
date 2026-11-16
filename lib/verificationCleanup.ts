import { dbConnect } from "@/lib/mongodb";
import { deletePrivateVerificationDocument } from "@/lib/cloudinary";
import User from "@/models/User";

export async function cleanupAbandonedVerificationDocuments() {
  await dbConnect();
  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const candidates = await User.find({
    verificationStatus: { $in: ["none", "rejected"] },
    "verificationDocument.uploadedAt": { $lt: cutoff },
  })
    .select("verificationDocument")
    .limit(100)
    .lean();

  let deleted = 0;
  for (const candidate of candidates as any[]) {
    const document = candidate.verificationDocument;
    if (!document?.publicId || !document?.resourceType) continue;

    const claimed = await User.findOneAndUpdate(
      {
        _id: candidate._id,
        verificationStatus: { $in: ["none", "rejected"] },
        "verificationDocument.publicId": document.publicId,
        "verificationDocument.uploadedAt": { $lt: cutoff },
      },
      { $unset: { verificationDocument: 1 } },
      { new: false }
    ).select("_id");

    if (!claimed) continue;
    await deletePrivateVerificationDocument(document);
    deleted += 1;
  }
  return deleted;
}

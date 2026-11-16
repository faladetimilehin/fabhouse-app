import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { dbConnect } from "@/lib/mongodb";
import User from "@/models/User";
import { uploadPrivateVerificationDocument, deletePrivateVerificationDocument } from "@/lib/cloudinary";
import { checkRateLimit } from "@/lib/rateLimit";

const MAX_DOCUMENT_BYTES = 8 * 1024 * 1024;

function detectDocumentType(bytes: Buffer): "image/jpeg" | "image/png" | "application/pdf" | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if (bytes.length >= 8 && bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) return "image/png";
  if (bytes.length >= 5 && bytes.subarray(0, 5).toString("ascii") === "%PDF-") return "application/pdf";
  return null;
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  if (!["agent", "developer"].includes((session.user as any).role)) {
    return NextResponse.json({ error: "Only agents and developers can submit verification." }, { status: 403 });
  }
  const uploadLimit = await checkRateLimit({ key: `verification-upload:${(session.user as any).id}`, limit: 5, windowSeconds: 86_400 });
  if (!uploadLimit.allowed) return NextResponse.json({ error: "You have reached the document upload limit for today." }, { status: 429 });

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Choose an ID or business document to upload." }, { status: 400 });
  }
  const file = formData.get("document");
  if (!(file instanceof File) || file.size === 0 || file.size > MAX_DOCUMENT_BYTES) {
    return NextResponse.json({ error: "Choose a document under 8 MB." }, { status: 400 });
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const detectedType = detectDocumentType(bytes);
  if (!detectedType || detectedType !== file.type) {
    return NextResponse.json({ error: "Use a valid JPG, PNG, or PDF document." }, { status: 400 });
  }

  await dbConnect();
  const user = await User.findById((session.user as any).id);
  if (!user || user.isSuspended) return NextResponse.json({ error: "Active account required." }, { status: 403 });
  if (user.verificationStatus === "pending" || user.verificationStatus === "approved") {
    return NextResponse.json({ error: "Your current verification can't be replaced." }, { status: 409 });
  }

  try {
    const document = await uploadPrivateVerificationDocument(user._id.toString(), file);
    const previousDocument = user.verificationDocument;
    const updated = await User.findOneAndUpdate(
      {
        _id: user._id,
        isSuspended: { $ne: true },
        verificationStatus: { $nin: ["pending", "approved"] },
      },
      { $set: { verificationDocument: { ...document, uploadedAt: new Date() } } },
      { new: true }
    ).select("_id");
    if (!updated) {
      await deletePrivateVerificationDocument(document);
      return NextResponse.json({ error: "Your verification status changed. Refresh and try again." }, { status: 409 });
    }
    if (previousDocument) await deletePrivateVerificationDocument(previousDocument);
    return NextResponse.json({ uploaded: true });
  } catch (error) {
    console.error("Private verification document upload failed:", error);
    return NextResponse.json(
      { error: "Secure document storage is unavailable. Please try again later." },
      { status: 503 }
    );
  }
}

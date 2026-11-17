"use client";

type ResourceType = "image" | "video";

interface UploadSignature {
  asset_folder: string;
  apiKey: string;
  cloudName: string;
  folder: string;
  overwrite: boolean;
  public_id: string;
  public_id_prefix: string;
  resourceType: ResourceType;
  signature: string;
  timestamp: number;
  upload_preset: string;
  unique_filename: boolean;
  use_filename: boolean;
}

function isUploadSignature(value: unknown): value is UploadSignature {
  return (
    typeof value === "object" &&
    value !== null &&
    "asset_folder" in value &&
    typeof value.asset_folder === "string" &&
    "apiKey" in value &&
    typeof value.apiKey === "string" &&
    "cloudName" in value &&
    typeof value.cloudName === "string" &&
    "folder" in value &&
    typeof value.folder === "string" &&
    "public_id" in value &&
    typeof value.public_id === "string" &&
    "public_id_prefix" in value &&
    typeof value.public_id_prefix === "string" &&
    "resourceType" in value &&
    (value.resourceType === "image" || value.resourceType === "video") &&
    "signature" in value &&
    typeof value.signature === "string" &&
    "timestamp" in value &&
    typeof value.timestamp === "number" &&
    "upload_preset" in value &&
    typeof value.upload_preset === "string" &&
    "overwrite" in value &&
    typeof value.overwrite === "boolean" &&
    "unique_filename" in value &&
    typeof value.unique_filename === "boolean" &&
    "use_filename" in value &&
    typeof value.use_filename === "boolean"
  );
}

export async function uploadListingMedia(file: File, resourceType: ResourceType): Promise<string> {
  const signatureResponse = await fetch("/api/properties/media/signature", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ resourceType }),
  });
  const signatureData: unknown = await signatureResponse.json().catch(() => null);
  if (!signatureResponse.ok) {
    const message = typeof signatureData === "object" && signatureData !== null && "error" in signatureData
      ? signatureData.error
      : null;
    throw new Error(typeof message === "string" ? message : "Could not authorize this upload.");
  }
  if (!isUploadSignature(signatureData) || signatureData.resourceType !== resourceType) {
    throw new Error("Could not authorize this upload.");
  }
  const signature = signatureData;

  const formData = new FormData();
  formData.append("file", file);
  formData.append("api_key", signature.apiKey);
  formData.append("timestamp", String(signature.timestamp));
  formData.append("signature", signature.signature);
  formData.append("asset_folder", signature.asset_folder);
  formData.append("upload_preset", signature.upload_preset);
  formData.append("folder", signature.folder);
  formData.append("public_id", signature.public_id);
  formData.append("public_id_prefix", signature.public_id_prefix);
  formData.append("overwrite", String(signature.overwrite));
  formData.append("unique_filename", String(signature.unique_filename));
  formData.append("use_filename", String(signature.use_filename));

  const uploadResponse = await fetch(
    `https://api.cloudinary.com/v1_1/${signature.cloudName}/${signature.resourceType}/upload`,
    { method: "POST", body: formData }
  );
  const uploadData: unknown = await uploadResponse.json().catch(() => null);
  if (
    !uploadResponse.ok ||
    typeof uploadData !== "object" ||
    uploadData === null ||
    !("secure_url" in uploadData) ||
    typeof uploadData.secure_url !== "string"
  ) {
    throw new Error("Cloudinary rejected the upload.");
  }

  return uploadData.secure_url;
}

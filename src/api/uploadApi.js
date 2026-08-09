import { apiRequest } from "./client";

const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
]);

export async function uploadImageFile(
  file,
  { purpose = "POST", signup = false } = {},
) {
  if (!file) return { imageUrl: "", uploadToken: "" };
  if (!ALLOWED_IMAGE_TYPES.has(file.type) || file.size > MAX_IMAGE_SIZE) {
    throw new Error("10MB 이하 JPEG, PNG, GIF 이미지만 업로드할 수 있습니다.");
  }

  const basePath = signup ? "/users/signup-images" : "/uploads";
  const session = await apiRequest(`${basePath}/presign`, {
    auth: !signup,
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      purpose,
      contentType: file.type,
      fileSize: file.size,
    }),
    errorMessage: "이미지 업로드 준비에 실패했습니다.",
  });

  // Presigned URL 자체에 S3 권한이 포함되어 있으므로 JWT와 쿠키를 보내지 않는다.
  const uploadResponse = await fetch(session.uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": session.contentType },
    body: file,
  });
  if (!uploadResponse.ok) {
    throw new Error("S3 이미지 업로드에 실패했습니다.");
  }

  return apiRequest(`${basePath}/${session.uploadId}/complete`, {
    auth: !signup,
    method: "POST",
    errorMessage: "업로드한 이미지를 확인하지 못했습니다.",
  });
}

export async function uploadPostImage(file) {
  const result = await uploadImageFile(file, { purpose: "POST" });
  return result.imageUrl;
}

export async function uploadProfileImage(file) {
  const result = await uploadImageFile(file, { purpose: "PROFILE" });
  return result.imageUrl;
}

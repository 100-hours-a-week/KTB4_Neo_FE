import { useEffect, useRef, useState } from "react";
import { uploadImageFile } from "../api/uploadApi";

export function useImageUpload(
  initialImage = "",
  { purpose = "PROFILE", signup = false } = {},
) {
  const [imageUrl, setImageUrl] = useState(initialImage);
  const [previewUrl, setPreviewUrl] = useState("");
  const [fileName, setFileName] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");
  const [uploadToken, setUploadToken] = useState("");
  const objectUrlRef = useRef("");
  const uploadIdRef = useRef(0);
  const mountedRef = useRef(false);

  function revokePreview() {
    if (!objectUrlRef.current) return;
    URL.revokeObjectURL(objectUrlRef.current);
    objectUrlRef.current = "";
  }

  async function selectFile(file) {
    setError("");
    if (!file) return;

    const uploadId = uploadIdRef.current + 1;
    uploadIdRef.current = uploadId;
    revokePreview();
    objectUrlRef.current = URL.createObjectURL(file);
    setPreviewUrl(objectUrlRef.current);
    setFileName(file.name);
    setIsUploading(true);

    try {
      const uploaded = await uploadImageFile(file, { purpose, signup });
      const uploadedUrl = uploaded.imageUrl;
      if (
        !mountedRef.current ||
        uploadId !== uploadIdRef.current
      ) {
        return uploadedUrl;
      }
      setImageUrl(uploadedUrl);
      setUploadToken(uploaded.uploadToken || "");
      return uploadedUrl;
    } catch (uploadError) {
      if (
        !mountedRef.current ||
        uploadId !== uploadIdRef.current
      ) {
        throw uploadError;
      }
      revokePreview();
      setError(uploadError.message);
      setPreviewUrl("");
      setFileName("");
      throw uploadError;
    } finally {
      if (
        mountedRef.current &&
        uploadId === uploadIdRef.current
      ) {
        setIsUploading(false);
      }
    }
  }

  function reset(nextImage = "") {
    uploadIdRef.current += 1;
    revokePreview();
    setImageUrl(nextImage);
    setPreviewUrl("");
    setFileName("");
    setError("");
    setUploadToken("");
    setIsUploading(false);
  }

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      uploadIdRef.current += 1;
      revokePreview();
    };
  }, []);

  return {
    imageUrl,
    setImageUrl,
    previewUrl,
    fileName,
    isUploading,
    error,
    uploadToken,
    selectFile,
    reset,
  };
}

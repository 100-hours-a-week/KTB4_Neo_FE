import { resolveImageUrl } from "../../utils/image";

export default function ImageUploader({
  id,
  label = "이미지",
  currentImage,
  fallbackImage = "",
  previewUrl,
  fileName,
  isUploading,
  error,
  onSelect,
  onRemove,
  disabled = false,
  variant = "post",
  required = false,
}) {
  const imageSource =
    previewUrl || resolveImageUrl(currentImage, fallbackImage);

  if (variant === "profile") {
    return (
      <div className="mypage-profile-section">
        <label className="mypage-profile-label" htmlFor={id}>
          {label}
          {required ? "*" : ""}
        </label>
        <label className="mypage-profile-image-button" htmlFor={id}>
          <img src={imageSource} alt={`${label} 미리보기`} />
          <span className="profile-change-badge">변경</span>
        </label>
        <input
          id={id}
          className="visually-hidden"
          type="file"
          accept="image/*"
          onChange={(event) => {
            const file = event.target.files[0];
            event.target.value = "";
            onSelect(file);
          }}
        />
        {(isUploading || error) && (
          <p className="helper-text" aria-live="polite">
            {isUploading ? "* 이미지를 업로드하는 중입니다." : `* ${error}`}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="form-field image-field">
      <label htmlFor={id}>{label}</label>
      <div className="custom-file-row">
        <label
          className={`custom-file-button ${disabled ? "is-disabled" : ""}`}
          htmlFor={disabled ? undefined : id}
        >
          파일 선택
        </label>
        <input
          id={id}
          className="visually-hidden"
          type="file"
          accept="image/*"
          disabled={disabled}
          onChange={(event) => {
            const file = event.target.files[0];
            event.target.value = "";
            onSelect(file);
          }}
        />
      </div>
      {imageSource && (
        <div className="post-image-preview-wrap">
          <img
            className="post-image-preview"
            src={imageSource}
            alt="선택한 게시글 이미지 미리보기"
          />
          {onRemove && (
            <button
              className="post-image-remove-button"
              type="button"
              disabled={disabled || isUploading}
              onClick={onRemove}
            >
              이미지 삭제
            </button>
          )}
        </div>
      )}
      <span className="file-name-text">
        {fileName ||
          (currentImage ? "기존 파일 유지" : "파일을 선택해주세요.")}
      </span>
    </div>
  );
}

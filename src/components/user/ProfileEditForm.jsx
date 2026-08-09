import { useEffect, useRef, useState } from "react";
import defaultProfileImage from "../../assets/images/default-profile.svg";
import { useImageUpload } from "../../hooks/useImageUpload";
import { nicknameError } from "../../utils/validation";
import FormField from "../form/FormField";
import ImageUploader from "../form/ImageUploader";

export default function ProfileEditForm({
  user,
  onSubmit,
  onSubmitError,
  onWithdraw,
  isUpdateComplete,
  onComplete,
}) {
  const image = useImageUpload(user.profileImage || "");
  const [nickname, setNickname] = useState(user.nickname || "");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submitPendingRef = useRef(false);
  const mountedRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  async function submit(event) {
    event.preventDefault();
    const validationError = nicknameError(nickname);
    if (
      validationError ||
      image.isUploading ||
      submitPendingRef.current
    ) {
      setError(
        image.isUploading
          ? "* 프로필 사진 업로드가 끝난 뒤 다시 시도해주세요."
          : validationError,
      );
      return;
    }

    submitPendingRef.current = true;
    setIsSubmitting(true);
    try {
      await onSubmit({
        nickname: nickname.trim(),
        profileImage: image.imageUrl,
      });
    } catch (requestError) {
      if (mountedRef.current) {
        setError(`* ${requestError.message}`);
        onSubmitError?.(requestError);
      }
    } finally {
      submitPendingRef.current = false;
      if (mountedRef.current) setIsSubmitting(false);
    }
  }

  return (
    <form className="mypage-form" noValidate onSubmit={submit}>
      <h2 className="page-title">회원정보수정</h2>
      <ImageUploader
        id="profile-image"
        label="프로필 사진"
        variant="profile"
        required
        currentImage={image.imageUrl}
        previewUrl={image.previewUrl}
        fallbackImage={defaultProfileImage}
        isUploading={image.isUploading}
        error={image.error}
        onSelect={(file) => image.selectFile(file).catch(() => {})}
      />
      <div className="mypage-info-field">
        <label>이메일</label>
        <p className="mypage-email">{user.email || ""}</p>
      </div>
      <FormField label="닉네임" htmlFor="nickname">
        <input
          id="nickname"
          value={nickname}
          onChange={(event) => {
            setNickname(event.target.value);
            setError("");
          }}
          onBlur={() => setError(nicknameError(nickname))}
        />
      </FormField>
      <p className="helper-text" aria-live="polite">
        {error || "* helper text"}
      </p>
      <button
        className="primary-button full-width-button"
        type="submit"
        disabled={isSubmitting || image.isUploading}
      >
        {isSubmitting ? "수정 중..." : "수정하기"}
      </button>
      <button
        className="text-button withdraw-button"
        type="button"
        onClick={onWithdraw}
      >
        회원 탈퇴
      </button>
      {isUpdateComplete && (
        <button
          className="primary-button complete-button"
          type="button"
          onClick={onComplete}
        >
          수정완료
        </button>
      )}
    </form>
  );
}

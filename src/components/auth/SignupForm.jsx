import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import FormField from "../form/FormField";
import { useImageUpload } from "../../hooks/useImageUpload";
import {
  emailError,
  nicknameError,
  passwordError,
} from "../../utils/validation";

export default function SignupForm({ onSubmit }) {
  const image = useImageUpload("", {
    purpose: "SIGNUP_PROFILE",
    signup: true,
  });
  const [form, setForm] = useState({
    email: "",
    password: "",
    passwordCheck: "",
    nickname: "",
  });
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");
  const submitPendingRef = useRef(false);
  const mountedRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const errors = useMemo(
    () => ({
      profile: !image.imageUrl ? "* 프로필 사진을 추가해주세요." : "",
      email: emailError(form.email),
      password: passwordError(form.password),
      passwordCheck: !form.passwordCheck.trim()
        ? "* 비밀번호를 한번 더 입력해주세요."
        : form.password !== form.passwordCheck
          ? "* 비밀번호와 다릅니다."
          : "",
      nickname: nicknameError(form.nickname, true),
    }),
    [form, image.imageUrl],
  );
  const hasError = Object.values(errors).some(Boolean);

  function changeField(event) {
    setForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
    setServerError("");
  }

  function touch(name) {
    setTouched((current) => ({ ...current, [name]: true }));
  }

  async function submit(event) {
    event.preventDefault();
    setTouched({
      profile: true,
      email: true,
      password: true,
      passwordCheck: true,
      nickname: true,
    });
    if (
      hasError ||
      image.isUploading ||
      submitPendingRef.current
    ) {
      return;
    }

    submitPendingRef.current = true;
    setIsSubmitting(true);
    try {
      await onSubmit({
        email: form.email.trim(),
        password: form.password.trim(),
        passwordCheck: form.passwordCheck.trim(),
        nickname: form.nickname.trim(),
        profileUploadToken: image.uploadToken,
      });
    } catch (error) {
      if (mountedRef.current) {
        setServerError(`* ${error.message}`);
      }
    } finally {
      submitPendingRef.current = false;
      if (mountedRef.current) setIsSubmitting(false);
    }
  }

  return (
    <form className="auth-form" noValidate onSubmit={submit}>
      <h2 className="auth-title signup-title">회원가입</h2>
      <div className="profile-upload-block">
        <span className="profile-upload-label">프로필 사진</span>
        <p className="helper-text">
          {image.isUploading
            ? "* 프로필 사진을 업로드하는 중입니다."
            : image.error
              ? `* ${image.error}`
              : touched.profile
                ? errors.profile || "* helper text"
                : "* helper text"}
        </p>
        <label
          className={`profile-upload-circle ${
            image.previewUrl ? "has-image" : ""
          }`}
          htmlFor="profile-image"
          style={
            image.previewUrl
              ? { backgroundImage: `url("${image.previewUrl}")` }
              : undefined
          }
        >
          {image.previewUrl ? "" : "+"}
        </label>
        <input
          id="profile-image"
          className="visually-hidden"
          type="file"
          accept="image/*"
          onChange={async (event) => {
            const file = event.target.files[0];
            touch("profile");
            try {
              await image.selectFile(file);
            } catch {
              // 업로드 오류는 useImageUpload의 error 상태로 표시한다.
            } finally {
              event.target.value = "";
            }
          }}
        />
      </div>
      {[
        ["email", "이메일*", "email", "이메일을 입력하세요."],
        ["password", "비밀번호*", "password", "비밀번호를 입력하세요."],
        [
          "passwordCheck",
          "비밀번호 확인*",
          "password",
          "비밀번호를 한번 더 입력하세요.",
        ],
        ["nickname", "닉네임*", "text", "닉네임을 입력하세요."],
      ].map(([name, label, type, placeholder]) => (
        <FormField
          key={name}
          label={label}
          htmlFor={name}
          error={touched[name] ? errors[name] : ""}
        >
          <input
            id={name}
            name={name}
            type={type}
            value={form[name]}
            placeholder={placeholder}
            onChange={changeField}
            onBlur={() => touch(name)}
          />
        </FormField>
      ))}
      {serverError && <p className="helper-text">{serverError}</p>}
      <button
        className="primary-button full-width-button"
        type="submit"
        disabled={hasError || image.isUploading || isSubmitting}
      >
        {isSubmitting ? "가입 중..." : "회원가입"}
      </button>
      <Link className="auth-link" to="/login">
        로그인하러 가기
      </Link>
    </form>
  );
}

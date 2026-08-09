import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import FormField from "../form/FormField";
import { emailError, passwordError } from "../../utils/validation";

export default function LoginForm({ onSubmit, navigationMessage="", }) {
  const [form, setForm] = useState({ email: "", password: "" });
  const [touched, setTouched] = useState(false);
  const [serverError, setServerError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notice, setNotice] = useState(navigationMessage);
  const submitPendingRef = useRef(false);
  const mountedRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const error = useMemo(
    () =>
      emailError(form.email) ||
      passwordError(form.password) ||
      serverError,
    [form, serverError],
  );

  function changeField(event) {
    setForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
    setServerError("");
    setNotice("");
  }

  async function submit(event) {
    event.preventDefault();
    setTouched(true);
    if (error || submitPendingRef.current) return;

    submitPendingRef.current = true;
    setIsSubmitting(true);
    try {
      await onSubmit({
        email: form.email.trim(),
        password: form.password.trim(),
      });
    } catch {
      if (mountedRef.current) {
        setServerError("* 입력하신 회원정보를 찾을 수 없습니다.");
      }
    } finally {
      submitPendingRef.current = false;
      if (mountedRef.current) setIsSubmitting(false);
    }
  }

  return (
    <form className="auth-form" noValidate onSubmit={submit}>
      <div className="login-heading">
        <h1 className="auth-title login-service-title">로그인</h1>
        <p className="login-description">
          계정으로 로그인하고 커뮤니티를 이용해보세요.
        </p>
      </div>
      <FormField label="이메일" htmlFor="email">
        <input
          id="email"
          name="email"
          type="email"
          value={form.email}
          placeholder="이메일을 입력하세요."
          onChange={changeField}
          onBlur={() => setTouched(true)}
        />
      </FormField>
      <FormField label="비밀번호" htmlFor="password">
        <input
          id="password"
          name="password"
          type="password"
          value={form.password}
          placeholder="비밀번호를 입력하세요."
          onChange={changeField}
          onBlur={() => setTouched(true)}
        />
      </FormField>
      <p className="helper-text" aria-live="polite">
        {touched ? error || notice || "* helper text" : notice || "* helper text"}
      </p>
      <button
        className="primary-button full-width-button"
        type="submit"
        disabled={Boolean(error) || isSubmitting}
      >
        {isSubmitting ? "로그인 중..." : "로그인"}
      </button>
      <div className="auth-signup-prompt">
        <span>아직 계정이 없나요?</span>
        <Link className="auth-link" to="/signup">
          회원가입
        </Link>
      </div>
    </form>
  );
}

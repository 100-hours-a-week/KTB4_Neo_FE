import { useEffect, useMemo, useRef, useState } from "react";
import FormField from "../form/FormField";
import { passwordError } from "../../utils/validation";

export default function PasswordEditForm({ onSubmit }) {
  const [form, setForm] = useState({
    curPassword: "",
    password: "",
    passwordCheck: "",
  });
  const [touched, setTouched] = useState({});
  const [serverError, setServerError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
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
      curPassword: !form.curPassword.trim()
        ? "* 비밀번호를 입력해주세요."
        : "",
      password: passwordError(form.password),
      passwordCheck: !form.passwordCheck.trim()
        ? "* 비밀번호를 한번 더 입력해주세요."
        : form.password !== form.passwordCheck
          ? "* 비밀번호와 다릅니다."
          : "",
    }),
    [form],
  );

  function change(event) {
    setForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
    setServerError("");
  }

  async function submit(event) {
    event.preventDefault();
    setTouched({
      curPassword: true,
      password: true,
      passwordCheck: true,
    });
    if (
      Object.values(errors).some(Boolean) ||
      submitPendingRef.current
    ) {
      return;
    }

    submitPendingRef.current = true;
    setIsSubmitting(true);
    try {
      await onSubmit({
        curPassword: form.curPassword.trim(),
        password: form.password.trim(),
        passwordCheck: form.passwordCheck.trim(),
      });
    } catch (error) {
      submitPendingRef.current = false;
      if (mountedRef.current) {
        setServerError(`* ${error.message}`);
        setIsSubmitting(false);
      }
    }
  }

  return (
    <form className="password-form" noValidate onSubmit={submit}>
      <h2 className="page-title">비밀번호 수정</h2>
      {[
        ["curPassword", "현재 비밀번호", "현재 비밀번호를 입력하세요."],
        ["password", "새 비밀번호", "새 비밀번호를 입력하세요."],
        [
          "passwordCheck",
          "새 비밀번호 확인",
          "새 비밀번호를 한번 더 입력하세요.",
        ],
      ].map(([name, label, placeholder]) => (
        <FormField
          key={name}
          label={label}
          htmlFor={name}
          error={touched[name] ? errors[name] : ""}
        >
          <input
            id={name}
            name={name}
            type="password"
            value={form[name]}
            placeholder={placeholder}
            onChange={change}
            onBlur={() =>
              setTouched((current) => ({ ...current, [name]: true }))
            }
          />
        </FormField>
      ))}
      {serverError && <p className="helper-text">{serverError}</p>}
      <button
        className="primary-button full-width-button"
        type="submit"
        disabled={Object.values(errors).some(Boolean) || isSubmitting}
      >
        {isSubmitting ? "수정 중..." : "수정하기"}
      </button>
    </form>
  );
}

export const DEFAULT_HELPER_TEXT = "* helper text";

export function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function isValidPassword(password) {
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s]).{8,20}$/.test(
    password,
  );
}

export function emailError(email) {
  if (!email.trim()) return "* 이메일을 입력해주세요.";
  if (!isValidEmail(email.trim())) {
    return "* 올바른 이메일 주소 형식을 입력해주세요. (예: example@example.com)";
  }
  return "";
}

export function passwordError(password) {
  if (!password.trim()) return "* 비밀번호를 입력해주세요.";
  if (!isValidPassword(password.trim())) {
    return "* 비밀번호는 8자 이상, 20자 이하이며, 대문자, 소문자, 숫자, 특수문자를 각각 최소 1개 포함해야 합니다.";
  }
  return "";
}

export function nicknameError(nickname, checkWhitespace = false) {
  const value = nickname.trim();
  if (!value) return "* 닉네임을 입력해주세요.";
  if (checkWhitespace && /\s/.test(value)) {
    return "* 띄어쓰기를 없애주세요.";
  }
  if (value.length > 10) {
    return "* 닉네임은 최대 10자까지 작성 가능합니다.";
  }
  return "";
}

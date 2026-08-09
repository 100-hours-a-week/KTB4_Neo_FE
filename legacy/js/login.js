const loginForm = document.querySelector("#login-form");
const emailInput = document.querySelector("#email");
const passwordInput = document.querySelector("#password");
const loginHelper = document.querySelector("#login-helper");
const loginButton = document.querySelector("#login-button");

let isLoginFailed = false;

if (loginForm) {
  function getErrorMessage() {
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();

    if (!email) return "* 이메일을 입력해주세요.";
    if (!isValidEmail(email)) return "* 올바른 이메일 주소 형식을 입력해주세요. (예: example@adapterz.kr)";
    if (!password) return "* 비밀번호를 입력해주세요.";
    if (!isValidPassword(password)) {
      return "* 비밀번호는 8자 이상, 20자 이하이며, 대문자, 소문자, 숫자, 특수문자를 각각 최소 1개 포함해야 합니다.";
    }
    if (isLoginFailed) return "* 입력하신 회원정보를 찾을 수 없습니다.";

    return "";
  }

  function updateButtonState() {
    loginButton.disabled = Boolean(getErrorMessage());
  }

  function showHelperText() {
    loginHelper.textContent = getErrorMessage() || "* helper text";
    updateButtonState();
  }

  emailInput.addEventListener("input", () => {
    isLoginFailed = false;
    updateButtonState();
  });
  passwordInput.addEventListener("input", () => {
    isLoginFailed = false;
    updateButtonState();
  });
  emailInput.addEventListener("blur", () => showHelperText());
  passwordInput.addEventListener("blur", () => showHelperText());

  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const errorMessage = getErrorMessage();

    if (errorMessage) {
      loginHelper.textContent = errorMessage;
      return;
    }

    loginButton.disabled = true;
    loginHelper.textContent = "* helper text";

    try {
      const loginData = await apiRequest("/users/login", {
        auth: false,
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: emailInput.value.trim(),
          password: passwordInput.value.trim(),
        }),
        errorMessage: "입력하신 회원정보를 찾을 수 없습니다.",
      });

      localStorage.setItem("accessToken", loginData.accessToken);
      localStorage.setItem("userId", loginData.userId);

      window.location.href = "./post-list.html";
    } catch (error) {
      isLoginFailed = true;
      loginHelper.textContent = "* 입력하신 회원정보를 찾을 수 없습니다.";
      updateButtonState();
    }
  });

  updateButtonState();
}
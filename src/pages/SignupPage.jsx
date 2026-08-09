import { useNavigate } from "react-router-dom";
import { signupUser } from "../api/authApi";
import SignupForm from "../components/auth/SignupForm";
import Header from "../components/common/Header";

export default function SignupPage() {
  const navigate = useNavigate();

  async function submit(user) {
    await signupUser(user);
    navigate("/login", { replace: true });
  }

  return (
    <>
      <Header showBackButton backTo="/login" hideProfile />
      <main className="page-main signup-main">
        <SignupForm onSubmit={submit} />
      </main>
    </>
  );
}

import { useNavigate } from "react-router-dom";
import Header from "../components/common/Header";
import PostCreateForm from "../components/posts/PostCreateForm";

export default function PostCreatePage() {
  const navigate = useNavigate();

  return (
    <>
      <Header showBackButton />
      <main className="page-main post-form-main">
        <PostCreateForm
          onPublished={(postId) =>
            navigate(`/posts/${postId}`, { replace: true })
          }
          onDeleted={() => navigate("/posts", { replace: true })}
        />
      </main>
    </>
  );
}

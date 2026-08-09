import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getPost, updatePost } from "../api/postApi";
import Header from "../components/common/Header";
import PostEditForm from "../components/posts/PostEditForm";

export default function PostEditPage() {
  const { postId } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setPost(null);
    setError("");
    getPost(postId)
      .then(({ post: data }) => {
        if (!cancelled) setPost(data);
      })
      .catch((requestError) => {
        if (!cancelled) setError(requestError.message);
      });
    return () => {
      cancelled = true;
    };
  }, [postId]);

  async function submit(data) {
    await updatePost(postId, data);
    navigate(`/posts/${postId}`, { replace: true });
  }

  return (
    <>
      <Header showBackButton backTo={`/posts/${postId}`} />
      <main className="page-main post-form-main">
        {error && <p className="helper-text">* {error}</p>}
        {!error && !post && (
          <p className="helper-text">* 게시글을 불러오는 중입니다.</p>
        )}
        {post && (
          <PostEditForm
            key={post.postId}
            post={post}
            onSubmit={submit}
          />
        )}
      </main>
    </>
  );
}

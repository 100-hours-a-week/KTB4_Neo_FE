import { Link } from "react-router-dom";
import defaultProfileImage from "../../assets/images/default-profile.svg";
import { formatCount, formatRelativeTime } from "../../utils/format";
import { resolveImageUrl } from "../../utils/image";

export default function PostCard({ post }) {
  const postImage =
    post.postImage && post.postImage !== "null"
      ? resolveImageUrl(post.postImage)
      : "";

  return (
    <article className="post-card">
      <Link className="post-card-link" to={`/posts/${post.postId}`}>
        <div className="post-card-main">
          <div className="post-card-content">
            <div className="post-card-author">
              <img
                className="author-profile-image"
                src={resolveImageUrl(
                  post.profileImage,
                  defaultProfileImage,
                )}
                alt="작성자 프로필"
              />
              <span>{post.nickname || "알 수 없음"}</span>
            </div>
            <h2 className="post-card-title" title={post.title || ""}>
              {(post.title || "").slice(0, 26)}
            </h2>
            <div className="post-card-meta-row">
              <span className="post-card-metric post-card-views">
                <span className="metric-icon eye-icon" aria-hidden="true" />
                {formatCount(post.views)}
              </span>
              <span
                className={`post-card-metric post-card-likes ${
                  post.liked ? "is-active" : ""
                }`}
              >
                <span className="metric-icon heart-icon" aria-hidden="true">
                  ♥
                </span>
                {formatCount(post.likes)}
              </span>
              <span
                className={`post-card-metric post-card-comments ${
                  post.commented ? "is-active" : ""
                }`}
              >
                <span
                  className="metric-icon comment-icon"
                  aria-hidden="true"
                />
                {formatCount(post.comments)}
              </span>
            </div>
          </div>
          {postImage && (
            <img
              className="post-card-thumbnail"
              src={postImage}
              alt="게시글 첨부 이미지"
            />
          )}
        </div>
        <span className="post-card-time">
          {formatRelativeTime(post.createdAt)}
        </span>
      </Link>
    </article>
  );
}

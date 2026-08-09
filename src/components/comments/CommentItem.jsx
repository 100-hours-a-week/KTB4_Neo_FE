import defaultProfileImage from "../../assets/images/default-profile.svg";
import { formatRelativeTime } from "../../utils/format";
import { resolveImageUrl } from "../../utils/image";

function Actions({ item, isReply, isOwner, onEdit, onDelete, onReply }) {
  if (item.deleted) return null;

  return (
    <div className={isReply ? "reply-actions" : "comment-actions"}>
      {!isReply && (
        <button
          className="outline-button reply-create-button"
          type="button"
          onClick={() => onReply(item)}
        >
          답글
        </button>
      )}
      {isOwner && (
        <>
          <button
            className={`outline-button ${
              isReply ? "reply-edit-button" : "comment-edit-button"
            }`}
            type="button"
            onClick={() => onEdit(item, isReply)}
          >
            수정
          </button>
          <button
            className={`outline-button ${
              isReply ? "reply-delete-button" : "comment-delete-button"
            }`}
            type="button"
            aria-label={isReply ? "대댓글 삭제" : "댓글 삭제"}
            onClick={() => onDelete(item, isReply)}
          >
            ×
          </button>
        </>
      )}
    </div>
  );
}

function ReplyItem({ reply, currentUserId, onEdit, onDelete }) {
  return (
    <article className="reply-item">
      <div className="reply-top">
        <img
          className="reply-avatar"
          src={resolveImageUrl(reply.profileImage, defaultProfileImage)}
          alt="대댓글 작성자 프로필"
        />
        <strong className="reply-author">{reply.nickname}</strong>
        <span className="reply-date">
          {formatRelativeTime(reply.createdAt)}
        </span>
        <Actions
          item={reply}
          isReply
          isOwner={String(reply.userId) === String(currentUserId)}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      </div>
      <p className="reply-body">
        {reply.deleted ? "삭제된 댓글입니다." : reply.commentBody}
      </p>
    </article>
  );
}

export default function CommentItem({
  comment,
  currentUserId,
  onEdit,
  onDelete,
  onReply,
}) {
  return (
    <article className="comment-item">
      <div className="comment-top">
        <img
          className="comment-avatar"
          src={resolveImageUrl(comment.profileImage, defaultProfileImage)}
          alt="댓글 작성자 프로필"
        />
        <strong className="comment-author">{comment.nickname}</strong>
        <span className="comment-date">
          {formatRelativeTime(comment.createdAt)}
        </span>
        <Actions
          item={comment}
          isReply={false}
          isOwner={String(comment.userId) === String(currentUserId)}
          onEdit={onEdit}
          onDelete={onDelete}
          onReply={onReply}
        />
      </div>
      <p className="comment-body">
        {comment.deleted ? "삭제된 댓글입니다." : comment.commentBody}
      </p>
      <div className="reply-list" aria-label="대댓글 목록">
        {(comment.replies || []).map((reply) => (
          <ReplyItem
            key={reply.commentId}
            reply={reply}
            currentUserId={currentUserId}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </div>
    </article>
  );
}

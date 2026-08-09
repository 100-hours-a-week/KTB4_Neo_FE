import { uploadPostImage } from "../../api/uploadApi";
import PostForm from "./PostForm";

export default function PostEditForm({ post, onSubmit }) {
  return (
    <PostForm
      initialValues={{
        title: post.title || "",
        postBody: post.postBody || "",
        postImage: post.postImage || "",
        previewUrl: "",
        fileName: "",
        isUploading: false,
        imageError: "",
        upload: uploadPostImage,
      }}
      title="게시글 수정"
      submitLabel="수정하기"
      onSubmit={onSubmit}
    />
  );
}

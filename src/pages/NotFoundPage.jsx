import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <main className="page-main not-found-main">
      <h1>페이지를 찾을 수 없습니다.</h1>
      <Link className="primary-button" to="/posts">
        게시글 목록으로 이동
      </Link>
    </main>
  );
}

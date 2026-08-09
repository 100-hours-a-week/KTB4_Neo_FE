import { useEffect, useState } from "react";
import {Link, useLocation, useNavigate, useSearchParams} from "react-router-dom";
import { getPosts } from "../api/postApi";
import Header from "../components/common/Header";
import Pagination from "../components/posts/Pagination";
import PostCard from "../components/posts/PostCard";

const PAGE_SIZE = 10;

export default function PostListPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const [navigationMessage] = useState(
      () => location.state?.message || "",
  );

  useEffect(() => {
      if(!location.state?.message) return;

      navigate(
          {
              pathname: location.pathname,
              search: location.search,
          },
          {
              replace: true,
              state: null,
          },
      );
  }, [
      location.pathname,
      location.search,
      location.state,
      navigate,
  ]);

  const [searchParams, setSearchParams] = useSearchParams();
  const pageParam = searchParams.get("page");
  const page = pageParam === null ? 0 : pageParam;
  const [posts, setPosts] = useState([]);
  const [pageInfo, setPageInfo] = useState({
    number: 0,
    totalPages: 1,
    first: true,
    last: true,
  });
  const [status, setStatus] = useState({
    loading: true,
    error: "",
  });

  useEffect(() => {
    let cancelled = false;
    setStatus({ loading: true, error: "" });

    getPosts(page, PAGE_SIZE)
      .then((response) => {
        if (cancelled) return;
        const content = Array.isArray(response)
          ? response
          : response?.content || [];
        const info = Array.isArray(response)
          ? { number: 0, totalPages: 1, first: true, last: true }
          : {
              number: response?.number ?? page,
              totalPages: response?.totalPages ?? 1,
              first: response?.first ?? true,
              last: response?.last ?? true,
            };

        if (
          !content.length &&
          info.number > 0 &&
          info.totalPages > 0
        ) {
          setSearchParams({ page: String(info.totalPages - 1) });
          return;
        }
        setPosts(content);
        setPageInfo(info);
        setStatus({ loading: false, error: "" });
      })
      .catch((error) => {
        if (!cancelled) {
          setStatus({ loading: false, error: error.message });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [page, setSearchParams]);

  function changePage(nextPage) {
    setSearchParams(nextPage ? { page: String(nextPage) } : {});
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <>
      <Header />
      <main className="page-main posts-main">
        {navigationMessage && (
            <p className="helper-text" role="status">
                * {navigationMessage}
            </p>
        )}
        <section className="posts-hero">
          <p className="posts-hero-kicker">오늘의 커리어 이야기</p>
          <p className="posts-hero-text">
            면접, 자소서, 채용 정보를
            <br />
            <strong>가볍게 나누는 공간</strong>
          </p>
          <Link
            className="primary-button pill-button write-button"
            to="/posts/new"
          >
            게시글 작성
          </Link>
        </section>
        <section className="posts" aria-label="게시글 목록">
          {status.loading && (
            <p className="helper-text">* 게시글을 불러오는 중입니다.</p>
          )}
          {status.error && (
            <p className="helper-text">* {status.error}</p>
          )}
          {!status.loading &&
            !status.error &&
            (posts.length ? (
              posts.map((post) => (
                <PostCard key={post.postId} post={post} />
              ))
            ) : (
              <p className="helper-text">* 등록된 게시글이 없습니다.</p>
            ))}
        </section>
        {!status.loading && !status.error && (
          <Pagination pageInfo={pageInfo} onChange={changePage} />
        )}
      </main>
    </>
  );
}

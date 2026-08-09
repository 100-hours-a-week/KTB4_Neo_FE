export default function Pagination({ pageInfo, onChange }) {
  const totalPages = Math.max(pageInfo.totalPages || 1, 1);
  const current = pageInfo.number || 0;
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, index) => index).filter(
    (page) =>
      page === 0 ||
      page === totalPages - 1 ||
      Math.abs(page - current) <= 1,
  );

  return (
    <nav className="posts-pagination" aria-label="게시글 페이지 이동">
      <button
        className="pagination-button"
        type="button"
        disabled={pageInfo.first}
        onClick={() => onChange(current - 1)}
      >
        이전
      </button>
      <div className="pagination-pages">
        {pages.map((page, index) => (
          <span key={page} className="pagination-page-wrap">
            {index > 0 && page - pages[index - 1] > 1 && (
              <span className="pagination-ellipsis">...</span>
            )}
            <button
              className={`pagination-number ${
                page === current ? "is-active" : ""
              }`}
              type="button"
              aria-current={page === current ? "page" : undefined}
              onClick={() => onChange(page)}
            >
              {page + 1}
            </button>
          </span>
        ))}
      </div>
      <button
        className="pagination-button"
        type="button"
        disabled={pageInfo.last}
        onClick={() => onChange(current + 1)}
      >
        다음
      </button>
    </nav>
  );
}

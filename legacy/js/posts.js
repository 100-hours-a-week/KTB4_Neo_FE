const writeButton = document.querySelector(".write-button");
const postsContainer = document.querySelector("#posts");
const paginationContainer = document.querySelector("#posts-pagination");

const PAGE_SIZE = 10;
let currentPage = 0;

function truncateTitle(title) {
  if (!title) return "";
  if (title.length <= 26) return title;
  return title.slice(0, 26);
}

function getPostImageUrl(postImage) {
  const imageUrl = postImage?.trim();

  if (!imageUrl || imageUrl === "null") return "";

  return resolveImageUrl(imageUrl);
}

function renderPosts(posts) {
  if (!postsContainer) return;

  postsContainer.innerHTML = "";

  if (!posts.length) {
    postsContainer.innerHTML = `<p class="helper-text">* 등록된 게시글이 없습니다.</p>`;
    return;
  }

  posts.forEach((post) => {
    const postImageUrl = getPostImageUrl(post.postImage);
    const article = document.createElement("article");
    article.className = "post-card";

    article.innerHTML = `
      <a class="post-card-link" href="./post-detail.html?postId=${post.postId}">
        <div class="post-card-main">
          <div class="post-card-content">
            <div class="post-card-author">
              <img class="author-profile-image" src="${resolveImageUrl(post.profileImage, DEFAULT_PROFILE_IMAGE)}" alt="작성자 프로필" />
              <span></span>
            </div>
            <h2 class="post-card-title"></h2>
            <div class="post-card-meta-row">
              <span class="post-card-metric post-card-views"><span class="metric-icon eye-icon" aria-hidden="true"></span>${formatCount(post.views)}</span>
              <span class="post-card-metric post-card-likes ${post.liked ? "is-active" : ""}" aria-label="좋아요 수"><span class="metric-icon heart-icon" aria-hidden="true">♥</span>${formatCount(post.likes)}</span>
              <span class="post-card-metric post-card-comments ${post.commented ? "is-active" : ""}" aria-label="댓글 수"><span class="metric-icon comment-icon" aria-hidden="true"></span>${formatCount(post.comments)}</span>
            </div>
          </div>
          <img class="post-card-thumbnail" ${postImageUrl ? `src="${postImageUrl}"` : ""} alt="게시글 첨부 이미지" ${postImageUrl ? "" : "hidden"} />
        </div>
        <span class="post-card-time">${formatRelativeTime(post.createdAt)}</span>
      </a>
    `;

    const titleElement = article.querySelector(".post-card-title");
    const nicknameElement = article.querySelector(".post-card-author span");

    titleElement.textContent = truncateTitle(post.title);
    titleElement.title = post.title || "";
    nicknameElement.textContent = post.nickname || "알 수 없음";

    postsContainer.append(article);
  });
}

function normalizePostsResponse(response) {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.content)) return response.content;
  return [];
}

function getPageInfo(response) {
  if (!response || Array.isArray(response)) {
    return {
      number: 0,
      totalPages: 1,
      first: true,
      last: true,
    };
  }

  return {
    number: response.number ?? 0,
    totalPages: response.totalPages ?? 1,
    first: response.first ?? true,
    last: response.last ?? true,
  };
}

function renderPagination(pageInfo) {
  if (!paginationContainer) return;

  const totalPages = Math.max(pageInfo.totalPages, 1);
  const current = pageInfo.number;

  if (totalPages <= 1) {
    paginationContainer.innerHTML = "";
    return;
  }

  const pages = Array.from({ length: totalPages }, (_, index) => index)
    .filter((page) => {
      if (page === 0 || page === totalPages - 1) return true;
      return Math.abs(page - current) <= 1;
    });

  paginationContainer.innerHTML = `
    <button class="pagination-button" type="button" data-page="${current - 1}" ${pageInfo.first ? "disabled" : ""}>이전</button>
    <div class="pagination-pages"></div>
    <button class="pagination-button" type="button" data-page="${current + 1}" ${pageInfo.last ? "disabled" : ""}>다음</button>
  `;

  const pagesContainer = paginationContainer.querySelector(".pagination-pages");
  let previousPage = -1;

  pages.forEach((page) => {
    if (previousPage !== -1 && page - previousPage > 1) {
      const ellipsis = document.createElement("span");
      ellipsis.className = "pagination-ellipsis";
      ellipsis.textContent = "...";
      pagesContainer.append(ellipsis);
    }

    const button = document.createElement("button");
    button.className = "pagination-number";
    button.type = "button";
    button.dataset.page = String(page);
    button.textContent = String(page + 1);
    button.setAttribute("aria-label", `${page + 1}페이지로 이동`);

    if (page === current) {
      button.classList.add("is-active");
      button.setAttribute("aria-current", "page");
    }

    pagesContainer.append(button);
    previousPage = page;
  });
}

async function loadPosts() {
  if (!postsContainer) return;

  try {
    const response = await apiRequest(`/posts?page=${currentPage}&size=${PAGE_SIZE}`, {
      errorMessage: "게시글을 불러오는 중 오류가 발생했습니다.",
    });
    const pageInfo = getPageInfo(response);
    const posts = normalizePostsResponse(response);

    if (!posts.length && currentPage > 0 && pageInfo.totalPages > 0) {
      currentPage = Math.max(pageInfo.totalPages - 1, 0);
      loadPosts();
      return;
    }

    renderPosts(posts);
    renderPagination(pageInfo);
  } catch (error) {
    console.error("게시글 목록 불러오기 실패:", error);
    postsContainer.innerHTML = `<p class="helper-text">* ${error.message}</p>`;
    if (paginationContainer) paginationContainer.innerHTML = "";
  }
}

writeButton?.addEventListener("click", (event) => {
  event.preventDefault();
  requireLogin();
  window.location.href = "./post-create.html";
});

paginationContainer?.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-page]");

  if (!button || button.disabled) return;

  currentPage = Number(button.dataset.page);
  loadPosts();
  window.scrollTo({ top: 0, behavior: "smooth" });
});

loadPosts();
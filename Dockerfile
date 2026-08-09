# ==================================================
# 1단계: React 프로덕션 빌드
# ==================================================

# Node.js 22 Alpine 이미지를 빌드 전용으로 사용
FROM node:22-alpine AS builder

# React 프로젝트 작업 디렉터리
WORKDIR /app

# Node에 포함된 Corepack을 활성화해 pnpm을 사용
RUN corepack enable

# 의존성 관련 파일만 먼저 복사
# package 정보가 바뀌지 않으면 설치 레이어 재사용 가능
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# 잠금 파일과 정확히 일치하는 의존성을 설치한다.
RUN pnpm install --frozen-lockfile

# React 소스 전체를 복사
COPY . .

# 빌드 시 사용할 API 기본 주소
# 빈 문자열 -> 현재 접속 중인 Nginx 주소로 API 호출
ARG VITE_API_BASE_URL=""

# ARG 값을 Vite 빌드 프로세스가 읽을 수 있는 환경변수로 전달
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}

# dist 디렉터리에 정적 파일을 생성
RUN pnpm build


# ==================================================
# 2단계: React 결과물을 Nginx로 제공
# ==================================================

# Nginx 이미지를 최종 실행 이미지로 사용
FROM nginx:1.28-alpine AS runtime

# 기본 Nginx 설정 대신 프로젝트 설정을 넣음
COPY nginx.conf /etc/nginx/conf.d/default.conf

# builder 단계에서 생성한 dist만 Nginx 정적 파일 경로로 복사
COPY --from=builder /app/dist /usr/share/nginx/html

# Nginx가 80번 포트 사용
EXPOSE 80

# Nginx 공식 이미지의 기본 시작 명령을 그대로 사용
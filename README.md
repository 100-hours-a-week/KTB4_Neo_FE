# KTB4 Neo Week12 Frontend

React frontend for the community application. The production image uses a
Node/pnpm build stage and serves the generated assets through Nginx.

## Local development

```bash
cp .env.example .env
pnpm install
pnpm dev
```

When the backend is exposed on port `8080`, use:

```dotenv
VITE_API_BASE_URL=http://localhost:8080
```

## Validation

```bash
pnpm lint
pnpm build
```

## Integrated Docker deployment

Clone this repository as `frontend-react/` inside the BE repository checkout,
then run the Compose file from the BE repository root:

```bash
docker compose up -d --build
```

The Nginx container proxies API requests to the `backend:8080` service on the
shared Compose network.

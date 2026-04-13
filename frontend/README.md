# DocuAgent Frontend

## Stack
- React 18
- Vite 7
- Plain CSS

## What Users Can Do

- log in securely
- upload documents
- view AI-generated summaries and risk insights
- filter documents
- inspect detailed document analysis
- manage users and roles when signed in as admin

## Run
Start the backend with Uvicorn and open `http://localhost:8003`.

The backend serves the checked-in frontend bundle from `frontend/dist`, so the app runs from one origin and the frontend calls the backend through relative `/api` routes.

## Environment
No frontend-specific environment variables are required for normal use.

If you change the React source, rebuild `frontend/dist` before shipping those changes.

## Tests

```bash
npm run test:run
```

Test suite includes:
- Document insights modal behavior/accessibility
- Documents filter behavior

## E2E (Playwright)

```bash
npm run e2e
```

E2E suite uses mocked API routes for stable browser tests:
- Login flow with mocked auth/data responses
- Open/close document insights modal flow

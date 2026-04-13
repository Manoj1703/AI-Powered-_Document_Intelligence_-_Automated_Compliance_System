# AI Doc Analyser and Compliance Detector

GitHub link: [AI Doc Analyser and Compliance Detector](https://github.com/Manoj1703/AI-Powered-Document-Intelligence-Automated-Compliance-System)

## What This Project Does

This project is a document intelligence app for:

- uploading legal or business documents
- extracting text and document details
- generating AI summaries
- detecting risk, compliance issues, obligations, and key clauses
- managing users with admin and super-admin access

## Project Structure

- `backend`: FastAPI backend, MongoDB integration, auth, document analysis APIs
- `frontend`: React frontend for login, upload, dashboard, documents, users, and analytics

## Quick Start

To run the project locally, add these values in `backend/.env`:

```env
MONGO_URI=<your-mongodb-uri>
OPENAI_API_KEY=<your-openai-key>
```

Then start the backend once with Uvicorn.

## Run Locally

Backend and frontend:

```bash
python -m uvicorn backend.main:app --reload --port 8003
```

Open the app at:

```text
http://localhost:8003
```

## Important Notes

- The backend serves the checked-in frontend bundle from `frontend/dist`, so the app runs from one Uvicorn process and the frontend talks to the backend through relative `/api` routes.
- If you change the React source, rebuild `frontend/dist` before shipping those changes.
- If `MONGO_URI` is omitted, the backend boots with `mongodb://localhost:27017` so `uvicorn` can start; the API still needs a reachable MongoDB for login, uploads, and dashboards.
- In local development, the backend uses a built-in dev JWT secret if `JWT_SECRET` is not set.
- For production, set a real `JWT_SECRET` and a real `MONGO_URI`.

## Main Features

- secure login and role-based access
- document upload and AI-powered analysis
- risk level classification
- clause, obligation, and compliance issue extraction
- document detail modal with structured insights
- dashboard, analytics, and activity views
- unit tests and browser smoke tests

See [ENVIRONMENT_SETUP.md](./ENVIRONMENT_SETUP.md) for optional configuration details.

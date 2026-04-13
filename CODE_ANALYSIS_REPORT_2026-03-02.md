# Code Analysis Report (2026-03-02)

Scope analyzed:
- `docuagent-backend/app`
- `docuagent-frontend/src`
- `docuagent-backend/tests`

Executed checks:
- Backend tests: `py -3.11 -m unittest discover -s tests -p "test*.py"` -> **FAILED** (`6/7` failures)
- Frontend build: `npm run build` -> **PASSED**

## Findings (Highest Priority First)

1. Security: error tracebacks are exposed by default in API responses.
- File: `docuagent-backend/app/main.py` line 53
- Current behavior: `SHOW_TRACEBACK` defaults to `"true"`, and raw traceback is returned in JSON.
- Risk: internal stack traces and implementation details leak to clients.
- Recommendation: default to `"false"` and only enable in local development.

2. Security: JWT secret has an insecure fallback value.
- File: `docuagent-backend/app/auth.py` line 24
- Current behavior: `JWT_SECRET` defaults to `"change-me-in-env"`.
- Risk: predictable signing key if env is misconfigured.
- Recommendation: fail startup when `JWT_SECRET` is missing/weak.

3. Duplicate-upload race protection is incomplete without a DB unique index.
- Files:
  - `docuagent-backend/app/routes/upload.py` lines 123-127
  - `docuagent-backend/app/database.py` lines 21-30
- Current behavior: code catches `DuplicateKeyError` for `file_hash`, but no unique index is created for `file_hash`.
- Risk: concurrent same-file uploads can still create duplicates.
- Recommendation: create a unique index on `Results.file_hash` (or scoped unique index by user if needed).

4. Test suite is outdated after auth enforcement.
- File: `docuagent-backend/tests/test_api.py` lines 75-137
- Evidence: most tests now return `401` because auth headers/mocks are missing.
- Risk: tests no longer validate real behavior and hide regressions.
- Recommendation: update tests to authenticate requests (or mock `get_current_user`) and assert new auth-aware responses.

5. Notification count update is prone to missed increments due async state timing.
- File: `docuagent-frontend/src/App.jsx` lines 72-89
- Current behavior: `added` is a mutable local flag set inside `setActivityLog` updater, then read immediately after.
- Risk: React batching/timing can make unread count inconsistent.
- Recommendation: compute and update unread count inside the same state transaction (or use a reducer).

6. Frontend detail view shows synthetic/random confidence values.
- File: `docuagent-frontend/src/utils.js` line 123
- Current behavior: `confidence` defaults to `Math.floor(80 + Math.random() * 18)`.
- Risk: users see fabricated confidence values that are not model-derived.
- Recommendation: remove random fallback or label it clearly as estimated/mock data.

7. Upload limits are not enforced.
- File: `docuagent-backend/app/routes/upload.py` lines 73-75
- Current behavior: full file is read into memory with no max size guard.
- Risk: memory pressure and service instability on large uploads.
- Recommendation: add max upload size checks and reject oversized files early.

## Additional Notes

- Frontend build is healthy and compiles successfully.
- Backend code has improved role-based access and duplicate checks, but tests need to be brought up to date to match current auth behavior.
- Repository is currently very dirty (`.tmp`, `.venv311`, many staged files). This increases review noise and deployment risk.

## Suggested Next Steps

1. Fix security defaults (`SHOW_TRACEBACK`, `JWT_SECRET`) first.
2. Add unique index for `file_hash` and decide duplicate policy scope (global vs per-user).
3. Refactor backend tests to include auth and restore CI confidence.
4. Clean repository hygiene (`.venv*`, `.tmp`) and update `.gitignore` if needed.

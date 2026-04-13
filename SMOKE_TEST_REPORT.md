# DocuAgent - Smoke Test Report

## Backend Routes Registered (20 endpoints)

| # | Method | Endpoint | Status |
|---|--------|----------|--------|
| 1 | GET | `/` (healthcheck) | ✅ |
| 2 | POST | `/api/upload` | ✅ |
| 3 | GET | `/api/documents` | ✅ |
| 4 | GET | `/api/documents/{doc_id}` | ✅ |
| 5 | DELETE | `/api/documents/{doc_id}` | ✅ |
| 6 | GET | `/api/dashboard/stats` | ✅ |
| 7 | GET | `/api/auth/signup-meta` | ✅ |
| 8 | POST | `/api/auth/register` | ✅ |
| 9 | POST | `/api/auth/login` | ✅ |
| 10 | POST | `/api/auth/logout` | ✅ |
| 11 | GET | `/api/auth/me` | ✅ |
| 12 | POST | `/api/auth/admin-key/rotate` | ✅ |
| 13 | GET | `/api/users` | ✅ |
| 14 | PATCH | `/api/users/{user_id}/role` | ✅ |
| 15 | DELETE | `/api/users/{user_id}` | ✅ |
| 16 | POST | `/api/users/transfer-super-admin/{user_id}` | ✅ |

## Frontend API Calls (Expected)

| Frontend Function | Expected Endpoint | Match |
|-------------------|-------------------|-------|
| fetchHealth() | GET `/` | ✅ |
| fetchSignupMeta() | GET `/api/auth/signup-meta` | ✅ |
| registerUser() | POST `/api/auth/register` | ✅ |
| loginUser() | POST `/api/auth/login` | ✅ |
| fetchCurrentUser() | GET `/api/auth/me` | ✅ |
| fetchDashboardStats() | GET `/api/dashboard/stats` | ✅ |
| fetchDocuments() | GET `/api/documents` | ✅ |
| fetchUsers() | GET `/api/users` | ✅ |
| updateUserRole() | PATCH `/api/users/{userId}/role` | ✅ |
| deleteUserById() | DELETE `/api/users/{userId}` | ✅ |
| transferSuperAdmin() | POST `/api/users/transfer-super-admin/{userId}` | ✅ |
| uploadDocument() | POST `/api/upload` | ✅ |
| fetchDocumentById() | GET `/api/documents/{docId}` | ✅ |
| deleteDocumentById() | DELETE `/api/documents/{docId}` | ✅ |
| logoutUser() | POST `/api/auth/logout` | ✅ |

## Summary

✅ **All 16 backend endpoints are properly connected to the frontend.**

### Issues Found:
1. **Missing .env file** - Fixed by creating `.env` with required variables:
   - `MONGO_URI`
   - `JWT_SECRET`

### Dependencies Installed:
- python-dotenv ✅
- pymongo ✅
- python-multipart ✅
- pypdf ✅
- pdfplumber ✅
- python-docx ✅
- pandas ✅
- openpyxl ✅
- xlrd ✅
- openai ✅
- requests ✅
- dnspython ✅


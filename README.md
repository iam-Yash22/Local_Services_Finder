# Local Service Finder

Local Service Finder is a React/Vite single-page application served by the FastAPI application. React is compiled into static files; FastAPI serves those files, the API, and portfolio media from one web service. SQLite is the default development database.c


## Requirements

- Node.js 20 or newer and npm
- Python 3.11 or newer



## AI assistant

The chatbot uses Google’s Gemini `gemini-2.5-flash` `generateContent` API at `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent`. 

## API outline

- `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`
- `GET /api/services`, `GET /api/services/{id}`, `POST /api/services`
- `GET /api/public/service-categories` (public preview; category names only)
- `GET /api/profile/services`, `PATCH /api/profile`
- `POST /api/services/{id}/reviews`
- `GET /api/services/{id}/gallery`, `POST /api/services/{id}/gallery`, `DELETE /api/gallery/{id}`
- `GET /api/admin/users`, `POST /api/admin/users`, `PATCH/DELETE /api/admin/users/{id}`, `GET /api/admin/services`, `DELETE /api/admin/services/{id}`
- `POST /api/ai-chat`

Only authenticated customer accounts can submit service ratings and reviews. Email addresses cannot be changed through the profile API. Customers can set a phone number once; service providers cannot change their phone number.

The landing page and sign-in/sign-up pages are public. Service browsing, details, and chatbot searches require an active customer session; the backend also enforces authentication for service APIs. Guests can only retrieve the list of available categories. Chat searches use a fixed, provider-listing-only database query (no user-supplied SQL or general database access), and responses support English and Hindi.

The interface supports English and Hindi through the language toggle. Fixed interface text, known categories/tags, and common API errors are localized; names, contact details, service descriptions, and reviews stay in the language entered by their authors. UI translation does not send user content to an external translation service.

Protected API requests use `Authorization: Bearer <access_token>`. Provider/admin checks happen in FastAPI, not just in the UI.


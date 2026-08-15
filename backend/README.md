# JudgeAI Backend Service

FastAPI backend for the JudgeAI evaluation platform, built with Python 3.12, Motor (async MongoDB), JWT authentication, MongoDB Atlas Vector Search, and CORS configuration for the Vite frontend.

## Directory Structure

```
backend/
├── app/
│   ├── agents/          # Judge agents (Accuracy, Hallucination, Relevance, Reasoning, Safety, Style)
│   ├── api/             # API routing & dependencies
│   │   ├── deps.py      # FastAPI auth & DB dependency injection
│   │   └── v1/
│   │       ├── api.py   # Router aggregator
│   │       └── endpoints/
│   │           ├── auth.py    # /auth/signup, /auth/login
│   │           ├── users.py   # /users/me, /users/me/onboarding, /users/me
│   │           └── health.py  # /health (live status & MongoDB ping)
│   ├── core/            # Config, settings, and JWT / bcrypt security
│   │   ├── config.py
│   │   └── security.py
│   ├── db/              # Motor connection lifecycle and Atlas Vector Search
│   │   ├── session.py
│   │   ├── collections.py
│   │   └── vector_search.py
│   ├── schemas/         # Pydantic models (User, Token, Task, Health)
│   ├── services/        # Service layer (UserService, VectorService)
│   └── main.py          # FastAPI application, lifespan, CORS, and root endpoints
├── .env.example         # Environment variables template
├── .env                 # Local development environment configuration
└── requirements.txt     # Python package dependencies
```

## Getting Started

### 1. Set Up Virtual Environment

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env` if not already present and configure MongoDB connection string:

```bash
cp .env.example .env
```

### 3. Run the Development Server

```bash
uvicorn app.main:app --reload --port 8000
```

The interactive Swagger API documentation will be available at:
- **Swagger UI:** [http://localhost:8000/docs](http://localhost:8000/docs)
- **ReDoc:** [http://localhost:8000/redoc](http://localhost:8000/redoc)
- **Health Check:** [http://localhost:8000/health](http://localhost:8000/health)

## API Endpoints

### Health
- `GET /health` / `GET /api/v1/health` - Health status and database ping latency.

### Authentication
- `POST /api/v1/auth/signup` - Register a new account with email, password, full name.
- `POST /api/v1/auth/login` - JSON login returning JWT Bearer token and user details.
- `POST /api/v1/auth/login/access-token` - OAuth2 form-compatible login for Swagger UI.

### Users & Onboarding
- `GET /api/v1/users/me` - Retrieve authenticated user profile and onboarding progress.
- `PATCH /api/v1/users/me/onboarding` - Update onboarding step, use case, preferred models, organization.
- `PATCH /api/v1/users/me` - Update profile information.

## Atlas Vector Search

The vector index definition for the `task_embeddings` collection is located in `app/db/vector_search.py`.
- **Field:** `task_embedding`
- **Dimensions:** `1536` (configured in `.env`)
- **Similarity Metric:** `cosine`
- **Filters:** `provider`, `model_id`, `judge_model_used`

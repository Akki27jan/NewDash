# NewDash // Terminal-Grade Academic Dashboard

[![Next.js](https://img.shields.io/badge/Next.js-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

> *A high-performance, deeply secure, terminal-aesthetic student control center designed for absolute command over your academic life.*

## 1. Core Features

- **Ironclad Authentication:** Ditches vulnerable local storage for strict `HTTP-Only`, `SameSite=Lax` cookies, neutralizing XSS attack vectors while providing a seamless global session state.
- **Terminal UI/UX & Theming:** A distraction-free, high-contrast interface inspired by classic CLI environments. Features a dynamic custom theme engine with presets, JSON payload import/export, and full mobile responsiveness.
- **Subject Curriculum Engine:** Full CRUD operations allowing students to track enrolled subjects and their credit values, rendered securely in an interactive, horizontally scrollable terminal table layout.
- **Attendance Matrix:** A unified system to track class attendance, calculate safe bunks, and set custom percentage thresholds. Persisted seamlessly to the cloud.
- **Advanced GPA Predictor:** A sophisticated dual-pane calculator featuring a Mark Calculator and a real-time, cross-semester GPA projection system securely backed by PostgreSQL.
- **Command-Line Tasks (Todo List):** A hierarchical task management module with due dates, priority flagging, and nested sub-tasking capabilities.
- **Asynchronous IO Engine:** Powered by FastAPI and an async SQLAlchemy PostgreSQL connection, ensuring rapid query execution and highly scalable concurrency handling.

## 2. Architecture & Tech Stack

NewDash operates on a decoupled client-server architecture:

- **Frontend Client (Next.js & TypeScript):** Utilizes the Next.js App Router and Tailwind CSS for rapid, responsive rendering. Authentication state is globally managed via a custom React Context provider that securely verifies session validity against the backend.
- **Backend API (FastAPI & Python):** A rigorous RESTful API employing Pydantic models for strict data validation and PyJWT for token generation. Dependency injection is used to securely extract and validate tokens from incoming request cookies.
- **Data Persistence (PostgreSQL & SQLAlchemy 2.0):** Employs asynchronous database sessions (`asyncpg`) to prevent IO blocking. Infrastructure is fully containerized via Docker Compose for immediate local reproducibility.

## 3. Quick Start

Ensure you have Docker, Python 3.10+, and Node.js installed.

```bash
# 1. Clone the repository
git clone https://github.com/yourusername/studentDash.git
cd studentDash

# 2. Boot the Database
docker-compose up -d

# 3. Initialize the Backend
cd backend_api
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env 
# Note: Edit the .env file to include a secure SECRET_KEY
uvicorn main:app --host 127.0.0.1 --port 8000 --reload

# 4. Initialize the Frontend (in a new terminal tab)
cd ../frontend_ui
npm install
npm run dev
```

## 4. Usage

Once the infrastructure is running:

1. **Client Interface:** Navigate to `http://localhost:3000` to interact with the terminal UI.
2. **Access Control:** Create a new user via the `[SIGNUP]` interface. Upon registration, log in to be seamlessly redirected to the secure `/dashboard` module.
3. **API Documentation:** Navigate to `http://127.0.0.1:8000/docs` to access the interactive Swagger UI, allowing direct invocation and testing of the REST endpoints.

## 5. Project Structure

```text
studentDash/
├── backend_api/          # Core API Engine
│   ├── app/
│   │   ├── api/          # Route definitions and auth dependency injection (deps.py)
│   │   ├── core/         # Security hashing and environment configuration
│   │   ├── db/           # Async database engine and session factories
│   │   ├── models/       # SQLAlchemy declarative base models
│   │   └── schemas/      # Pydantic data transfer objects (DTOs)
│   ├── main.py           # Application entrypoint and CORS middleware config
│   └── requirements.txt  
├── frontend_ui/          # Client Interface
│   ├── src/
│   │   ├── app/          # Next.js App Router (Public and Protected routes)
│   │   ├── components/   # Reusable UI primitives (Terminal buttons, forms, headers)
│   │   └── context/      # React Context providers (AuthContext)
│   └── tailwind.config.ts# Centralized design system tokens
└── docker-compose.yml    # Infrastructure orchestration
```

## 6. Future Work

- **Schema Version Control:** Transition from `Base.metadata.create_all` to `Alembic` to ensure production-grade, state-tracked database migrations.
- **Calendar & Notes Integration:** Expand the module ecosystem by wiring up the `CALENDAR` placeholder component to robust backend micro-services.
- **HTTPS & Secure Flags:** Configure a reverse proxy (e.g., Nginx) to handle SSL termination, allowing the enforcement of the `Secure` flag on JWT cookies for production deployment.

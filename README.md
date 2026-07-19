# NewDash // Terminal-Grade Academic Dashboard

[![Next.js](https://img.shields.io/badge/Next.js-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Docker](https://img.shields.io/badge/Docker-2CA5E0?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)

> *A high-performance, deeply secure, terminal-aesthetic student control center designed for absolute command over your academic life.*

NewDash is a highly opinionated, CLI-inspired productivity and tracking dashboard built for power users. It strips away modern web bloat in favor of an ultra-fast, keyboard-driven interface with a fully decoupled asynchronous backend.

---

## ⚡ Core Features

- **Tmux-Style Navigation & Command Palette:** Navigate at the speed of thought. Features a retractable side-panel for mobile and a lightning-fast fuzzy-search Command Palette (`Ctrl+K` or `Cmd+K`) for global navigation.
- **Dynamic Theming Engine:** Change the aesthetic on the fly. Choose from community-favorite programmer themes like `Catppuccin`, `Nord`, `Cyberpink`, and `Matrix`. Theme variables persist globally and instantly apply across the layout.
- **Advanced GPA & Credit Architecture:** A sophisticated dual-pane calculator featuring a real-time Mark Calculator and a cross-semester GPA projection system securely backed by PostgreSQL.
- **Flashcard Engine (with Bulk Operations):** Create, manage, and review flashcards. Features an accelerated Bulk Upload mode for rapid data entry and an interactive Review Mode with randomized shuffles and retention scoring.
- **Background Timers & YouTube Alarms:** Run Pomodoro and standard timers entirely in the background. Integrate any YouTube URL to act as an automatic alarm when a timer completes.
- **Asynchronous Task Engine & Email Notifications:** Hierarchical task management built on an async APScheduler backend. Set deadlines and receive automated SMTP email warnings when tasks are about to expire.
- **Ironclad Authentication:** Ditches vulnerable local storage for strict `HTTP-Only`, `SameSite=Lax` cookies, neutralizing XSS attack vectors.

---

## 🏗️ Architecture & Tech Stack

NewDash operates on a decoupled client-server architecture built for maximum efficiency and local self-hosting.

- **Frontend Client (Next.js 14+ & TypeScript):** Utilizes the Next.js App Router. UI components are built completely from scratch using Tailwind CSS to enforce strict terminal aesthetics (monospace fonts, sharp borders, pure black backgrounds).
- **Backend API (FastAPI & Python):** A rigorous RESTful API employing Pydantic models for strict data validation and PyJWT for stateless authentication.
- **Data Persistence (PostgreSQL & SQLAlchemy 2.0):** Employs asynchronous database sessions (`asyncpg`) to prevent IO blocking. The schema is auto-bootstrapped on launch.
- **Infrastructure (Docker):** Fully containerized multi-stage builds allowing for instant deployment on any Linux environment.

---

## 🏠 Self-Hosting Guide (Homelab Setup)

NewDash is designed with a "local-first" mentality. You can deploy the entire stack—Frontend, Backend, and a local PostgreSQL database—on your homelab using a single command. 

### Prerequisites
- [Docker](https://docs.docker.com/get-docker/) & [Docker Compose](https://docs.docker.com/compose/install/) installed on your server.

### 1. Clone & Configure
```bash
git clone https://github.com/yourusername/studentDash.git
cd studentDash

# Copy the environment variable template
cp .env.example .env
```

Open the `.env` file and configure the settings. 
> **Important:** If you are accessing the dashboard from a different computer on your network, change `NEXT_PUBLIC_API_URL` to point to your server's IP address (e.g., `http://192.168.1.100:8000`).

### 2. Deploy the Stack
Bring up the entire containerized architecture in detached mode:
```bash
docker compose up -d --build
```
*Note: The backend container will automatically connect to the local Postgres container and initialize the required database tables on its first boot. No manual migration required!*

### 3. Access the Dashboard
- **Frontend App:** Open your browser and navigate to `http://<YOUR_SERVER_IP>:3000`
- **Backend API Docs:** Explore the interactive Swagger documentation at `http://<YOUR_SERVER_IP>:8000/docs`

---

## 🛠️ Local Development (Without Docker)

If you wish to modify the code and run the application in a traditional development environment:

**1. Boot a local Database**
```bash
# You can use the provided compose file just for the DB
docker compose up db -d
```

**2. Initialize the Backend**
```bash
cd backend_api
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Create your .env file here based on .env.example
uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```

**3. Initialize the Frontend (in a new terminal)**
```bash
cd frontend_ui
npm install
npm run dev
```

Navigate to `http://localhost:3000` to interact with the development server.

---

## 📁 Project Structure

```text
studentDash/
├── backend_api/          # Core API Engine (FastAPI)
│   ├── app/
│   │   ├── api/          # Route definitions & Auth dependencies
│   │   ├── core/         # Security hashing and configuration
│   │   ├── db/           # Async database engine & sessions
│   │   ├── models/       # SQLAlchemy tables (Auto-created)
│   │   └── schemas/      # Pydantic DTOs
│   ├── main.py           # Application entrypoint
│   └── Dockerfile        # Slim Python 3.10 image
├── frontend_ui/          # Client Interface (Next.js)
│   ├── src/
│   │   ├── app/          # App Router & Layouts
│   │   ├── components/   # Custom CLI-themed components
│   │   └── context/      # Global State (Auth, Sidebar, Timers)
│   └── Dockerfile        # Multi-stage optimized Node.js image
├── .env.example          # Environment variable template
└── docker-compose.yml    # Homelab orchestration stack
```

---

## 🚀 Future Work
- Transition from SQLAlchemy `create_all` to `Alembic` to ensure production-grade, state-tracked database migrations for homelabs over time.
- Expand the module ecosystem by wiring up the `CALENDAR` micro-services.
- Introduce native iOS/Android builds using React Native (NewDash Mobile).
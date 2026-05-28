# 🎓 Student OS

A premium, scroll-based personal operating system for college students. Built with React, GSAP, Node.js, and a local JSON file storage system.

## ✨ Features

- **Hero / Command Center** — Time-aware greeting, today's date, at-a-glance stats, profile photo with upload
- **Smart Timetable** — Weekly class schedule with CRUD, real-time indicators, color-coded subjects
- **AI Study Assistant** — Chat interface with Claude API integration (or simulated responses), personalized context
- **Sticky Notes Wall** — Masonry grid with tilt effects, inline editing, pin/delete
- **Habit Tracker** — Heatmaps, streaks, completion animations, weekly progress ring
- **CGPA Calculator** — Radial gauge, what-if simulator, course breakdown, semester progression charts
- **Focus Mode & Pomodoro** — Timer with circular progress, sessions logging, weekly/monthly/yearly reports
- **Class Notes Vault** — Search, filter by subject, inline edit, exam mode
- **Skill Roadmap Tracker** — Connected node diagram, levels, completion tracking with particles
- **Attendance Manager** — Calendar view, per-subject percentages, leave impact calculator
- **Custom Resources Hub** — Pinterest-style board, types (links, YouTube, PDF, tools), resource of the day
- **Student Profile & Settings** — All configuration forms, data backup/export, per-section reset

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, Tailwind CSS, GSAP, Framer Motion |
| Charts | Recharts, D3.js |
| State | Zustand, TanStack Query (React Query) |
| Forms | React Hook Form |
| Backend | Node.js, Express.js |
| Storage | Local JSON files (`/data` directory) |
| AI | Anthropic Claude API (optional, with simulated fallback) |
| Auth | JWT-ready (single-student local app) |

## 📦 Project Structure

```
├── backend/
│   ├── routes/           # Feature-based API routes
│   ├── middleware/        # Error handling middleware
│   ├── utils/
│   │   └── fileStore.js  # JSON file storage utility
│   ├── server.js         # Express app entry point
│   └── seed.js           # Sample data seeder
├── frontend/
│   └── src/
│       ├── features/     # Feature-based components
│       │   ├── hero/
│       │   ├── timetable/
│       │   ├── aichat/
│       │   ├── stickynotes/
│       │   ├── habits/
│       │   ├── cgpa/
│       │   ├── focus/
│       │   ├── notes/
│       │   ├── roadmap/
│       │   ├── attendance/
│       │   ├── resources/
│       │   └── profile/
│       ├── hooks/        # Custom hooks & API client
│       └── styles/       # Global styles
├── data/                 # Local JSON file storage
├── .env.example
├── README.md
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### 1. Clone & Install

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Environment Setup

```bash
# Backend environment
cd backend
cp .env.example .env
# Edit .env — add your Anthropic API key if you want AI features
```

**.env Variables:**
| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PORT` | No | 3001 | Backend server port |
| `ANTHROPIC_API_KEY` | No | — | Claude API key for AI assistant (optional — simulated responses used if missing) |

### 3. Seed Sample Data

```bash
cd backend
npm run seed
```

This populates the `/data` directory with realistic sample data including:
- Student profile (Alex Chen, Stanford)
- 10 timetable entries across the week
- 5 habits with 30-day completion history
- 14 days of focus sessions
- 5 sticky notes
- 9 courses across 2 semesters (CGPA: 3.62 → 3.78)
- 3 class notes
- ML skill roadmap with 5 topics
- 60 attendance records
- 3 resources with categories

### 4. Start Development

```bash
# Terminal 1: Backend API
cd backend
npm run dev

# Terminal 2: Frontend
cd frontend
npm run dev
```

The app will be available at **http://localhost:5173**

## 🎨 Design Philosophy

- **Light & Premium**: Ivory whites, warm creams, deep indigos with gold and mint accents
- **Scroll-Based**: All 12 sections flow in a single continuous vertical scroll — no tabs, no navigation
- **Animated**: Every section has entrance animations via GSAP ScrollTrigger
- **Typography**: Playfair Display (headings) + Inter (body) + Space Grotesk (data)
- **Luxurious Spacing**: 100px+ vertical padding between sections, generous whitespace
- **Glassmorphism**: Soft glass cards with backdrop-filter blur

## 🔌 API Endpoints

All endpoints return: `{ success, message, data, error }`

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/profile/:id` | GET | Fetch student profile |
| `/profile/:id` | PUT | Update profile |
| `/profile/photo` | POST | Upload profile photo |
| `/timetable/:id` | GET | Get timetable entries |
| `/timetable` | POST | Create entry |
| `/timetable/:id` | PUT | Update entry |
| `/timetable/:id` | DELETE | Delete entry |
| `/habits/:id` | GET | Get habits |
| `/habits` | POST | Create habit |
| `/habits/:id/complete` | POST | Mark habit complete |
| `/habits/:id/history` | GET | Get habit history |
| `/focus/session` | POST | Log focus session |
| `/focus/report/weekly/:id` | GET | Weekly report |
| `/focus/report/monthly/:id` | GET | Monthly report |
| `/focus/report/yearly/:id` | GET | Yearly report |
| `/notes/:id` | GET | Get notes |
| `/notes` | POST | Create note |
| `/notes/:id` | PUT | Update note |
| `/notes/:id` | DELETE | Delete note |
| `/notes/search/:id` | GET | Search notes |
| `/stickynotes/:id` | GET | Get sticky notes |
| `/stickynotes` | POST | Create sticky note |
| `/stickynotes/:id` | DELETE | Delete sticky note |
| `/courses/:id` | GET | Get courses |
| `/courses` | POST | Add course |
| `/cgpa/calculate/:id` | GET | Calculate CGPA |
| `/roadmaps/:id` | GET | Get roadmaps with topics |
| `/roadmaps` | POST | Create roadmap |
| `/roadmaps/:id/topic/:tid/complete` | POST | Complete topic |
| `/attendance/summary/:id` | GET | Attendance summary |
| `/attendance/mark` | POST | Mark attendance |
| `/attendance/leave-impact` | GET | Leave impact calculation |
| `/resources/:id` | GET | Get resources |
| `/resources` | POST | Add resource |
| `/ai/chat` | POST | AI chat (Claude or simulated) |
| `/backup` | GET | Download ZIP backup |
| `/backup/reset/:filename` | DELETE | Reset data file |

## 📝 License

MIT

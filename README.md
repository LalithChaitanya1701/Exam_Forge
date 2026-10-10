# ExamForge

> **Turn any plain-text MCQ questions into a realistic Computer-Based Test (CBT) simulator in seconds.**

[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61dafb.svg)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.x-38bdf8.svg)](https://tailwindcss.com/)
[![Express](https://img.shields.io/badge/Express-4.x-black.svg)](https://expressjs.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

ExamForge bridges the gap between raw study materials (textbooks, typed notes, practice sheets) and actual high-stakes testing environments (JEE, NEET, SAT, GRE, USMLE, civil services, and university examinations). Simply paste questions in an intuitive text format, configure positive/negative marks and duration, and launch an authentic test simulator with section navigation, interactive question palettes, audio time alerts, and comprehensive analytical reports.

---

## Key Features

- **Zero-Friction Text Authoring**: Write or paste questions using simple tags (`Section:`, `Q:`, `A)`, `B)`, `C)`, `D)`, `Answer:`, `Explanation:`, and `---`).
- **Global Exam Scoring Configuration**: Set marks per correct question (`posMarks`, e.g. `+4` or `+1`) and negative marking penalty (`negMarks`, e.g. `-1` or `-0.25`) directly in the exam setup without annotating every individual question.
- **Realistic CBT Simulator**:
  - **Section Partitioning**: Switch between subjects (e.g., Physics, Chemistry, Mathematics) with live section question counts.
  - **5-State Question Palette**: Color-coded numbers tracking Not Visited (gray), Answered (green), Unanswered (red), Marked for Review (brown), and Marked & Answered (purple).
  - **Countdown Timer & Audio Alerts**: Digital timer with visual low-time warning pulses and Web Audio synthesized chimes at 30, 20, 10, and 5 minutes remaining.
  - **Keyboard Shortcuts**: Select options with `1`–`4` or `A`–`D`, move between questions with `←` / `→`, and mark for review with `M`.
- **Unified Profile & Test History**:
  - Test history table showing every completed attempt, score, accuracy percentage, and time taken.
  - Interactive **Scorecard & Detailed Solutions** embedded directly inside the profile dashboard.
  - One-click **Retake Test** capability.
  - **Clean Printable PDF Reports**: Custom `@media print` layout formatting all questions, selected answers, correct answers, and explanations into an unbranded printable sheet.
- **Built-in Authentication**: Sign In and Registration with demo login support (`alex@example.com` / `password123`) and persistent multi-user data storage.
- **Test Library**: Browse saved exams, share direct test links (`?examId=xxx`), or duplicate and edit existing exams.

---

## Question Text Syntax

Separate each question with a divider line containing `---`.

```text
Section: Physics
Q: What is the SI unit of force?
A) Joule
B) Newton
C) Watt
D) Pascal
Answer: B
Explanation: The SI unit of force is the Newton (N), defined as the force needed to accelerate 1 kg of mass at 1 m/s^2.
---
Section: Physics
Q: Which of these is a vector quantity?
A) Mass
B) Speed
C) Velocity
D) Energy
Answer: C
Explanation: Velocity has both magnitude and direction, making it a vector quantity, unlike speed which is scalar.
---
Section: Mathematics
Q: Solve for x: 2x + 6 = 14
A) 2
B) 4
C) 6
D) 8
Answer: B
Explanation: 2x + 6 = 14 -> 2x = 8 -> x = 4.
```

> **Note**: `Section:` and `Explanation:` are optional. If omitted, questions default to the "General" section. Marks per question are inherited directly from your exam configuration.

---

## Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS v4, Lucide React icons, Motion
- **Backend**: Express 4.x, TypeScript runtime via `tsx`
- **Build Tool**: Vite 8.x (with middleware mode in development and production static bundle serving)
- **Database / Persistence**: Atomic file-backed transactional JSON datastore (`server/db.ts`) with zero external database dependencies needed for deployment

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v20 or higher (v22 recommended)
- `npm` or `bun`

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/exam-forge.git
   cd exam-forge
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables (optional):
   ```bash
   cp .env.example .env
   ```

4. Start the full-stack development server:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Production Deployment

1. Build the frontend client bundle:
   ```bash
   npm run build
   ```

2. Start the production server:
   ```bash
   npm start
   ```

In production mode (`NODE_ENV=production`), Express statically serves the optimized bundle from `dist/` and hosts all API routes on `PORT` (defaults to `3000`).

---

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `PORT` | `3000` | Port for the HTTP server |
| `NODE_ENV` | `development` | Set to `production` for static asset serving |
| `DATA_DIR` | `./data` | Directory where persistent database files are stored |
| `APP_URL` | `http://localhost:3000` | Canonical application URL |

---

## API Endpoints

### Authentication
- `POST /api/auth/register` – Create user account
- `POST /api/auth/login` – Authenticate user
- `GET /api/auth/me` – Retrieve current authenticated session
- `POST /api/auth/profile` – Update profile display name or target exam

### Exams
- `GET /api/exams` – Retrieve all saved tests
- `GET /api/exams/:id` – Fetch a specific exam by ID
- `POST /api/exams` – Create and save a new exam
- `DELETE /api/exams/:id` – Delete an exam

### Attempts & Grading
- `POST /api/exams/:id/grade` – Submit answers, perform server-side scoring, and archive the attempt
- `GET /api/attempts` – List completed test attempts (optionally filtered by `userId`)
- `GET /api/attempts/:id` – Retrieve a specific attempt with question snapshots
- `DELETE /api/attempts/:id` – Delete an attempt record

---

## Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on code style and the submission process.

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

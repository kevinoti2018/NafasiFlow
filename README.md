
```markdown
# Nafasi Flow

AI-Powered Resume Optimizer & Automated Applicant Tracking System (ATS)

---

## What It Does

Nafasi Flow helps you land more interviews by making sure your resume actually passes
Applicant Tracking Systems. It goes far beyond simple keyword matching:

- **Semantically analyzes** your resume against real job descriptions using a custom
  weighted scoring algorithm.
- **Uses two AI models** (OpenAI and Gemini) with automatic fallback – if one fails,
  the other takes over, so you never see an error.
- **Pinpoints exact skill gaps** and suggests concrete, actionable rewrites.
- **Tracks every application** in a visual pipeline (Saved → Applied → Interview →
  Offer → Rejected) so you always know where you stand.

---

## Key Features

1. **Resilient Multi‑Model LLM Pipeline**
   Primary OpenAI API call with automatic fallback to Gemini API. Handles rate
   limits and regional outages without any downtime.

2. **Custom Weighted Scoring Engine**
   Job descriptions are programmatically parsed to extract technical skills, soft
   skills, and core responsibilities. Each gets a mathematical weight, and you
   receive a clear 0‑100 compatibility score.

3. **Semantic Delta Gap Analysis**
   Compares your resume against the extracted job vectors. You get a precise list
   of missing keywords, technologies, or experiences, plus rewrite suggestions.

4. **Dynamic Application Tracker (ATS Dashboard)**
   Full CRUD Kanban board (React/Zustand) to manage every stage of your job
   applications. Attach notes, deadlines, and compare different resume versions.

5. **Secure Document Ingestion**
   Upload PDF or DOCX files. The system extracts text securely and converts it
   into structured, analyzable data.

6. **Cover Letter Generator**
   Generates a tailored cover letter using the same gap analysis, so your whole
   application feels cohesive.

---

## System Architecture

```
 User CV + Job Description
        |
        v
 Data Ingestion & Parsing
        |
        v
 Weighted Scoring Engine
        |
        +-------------------+
        |                   |
 Primary: OpenAI API    (if fail / rate limit)
        |                   |
        |     Fallback: Gemini API
        |                   |
        +-------------------+
        |
        v
 Semantic Delta Gap Output
        |
        v
 Optimization Suggestions & ATS Score
        |
        v
 Application Tracker Update
        |
        v
 Analytics Dashboard
```

---

## Tech Stack

| Layer          | Technology                                      |
|----------------|-------------------------------------------------|
| Frontend       | React / Next.js, Tailwind CSS, Shadcn UI        |
| Backend        | Node.js, Express / Next.js Serverless Functions |
| Database       | PostgreSQL (Neon DB) + Prisma ORM               |
| AI / ML        | OpenAI API, Gemini API                          |
| State          | Context API / Zustand                           |
| File Parsing   | pdf-parse, mammoth (DOCX)                       |

---

## Getting Started

### Prerequisites

- Node.js 18 or later
- PostgreSQL database (local or Neon DB)
- OpenAI API key
- Gemini API key

### Setup

```bash
# 1. Clone the repo
git clone https://github.com/kevinoti2018/nafasi-flow.git
cd nafasi-flow

# 2. Install dependencies
npm install

# 3. Configure environment variables
# Create a .env file in the root with:
#   DATABASE_URL="postgresql://user:password@host:5432/nafasi-flow"
#   OPENAI_API_KEY="sk-..."
#   GEMINI_API_KEY="AIza..."
#   NEXTAUTH_SECRET="a-random-secret"

# 4. Push the Prisma schema to your database
npx prisma db push

# 5. Start the development server
npm run dev
```

Open `http://localhost:3000` — the app is ready.

---

## Project Structure

```
nafasi-flow/
├── prisma/
│   └── schema.prisma    # Database schema (Prisma)
├── public/              # Static assets
├── src/
│   ├── app/             # Next.js App Router (pages & API routes)
│   ├── components/      # Reusable UI components (Shadcn UI)
│   ├── lib/             # Utilities, AI clients, scoring engine, Prisma client
│   ├── hooks/           # Custom React hooks
│   └── styles/          # Global styles & Tailwind config
├── .env.example
├── docker-compose.yml   # Optional containerized setup
└── README.md
```

**Note:** No `models/` folder — all database models are defined in `prisma/schema.prisma`.

---

## Contributing

Pull requests are welcome. For major changes, please open an issue first to
discuss what you would like to change.

1. Fork the project
2. Create your feature branch (`git checkout -b feat/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feat/amazing-feature`)
5. Open a Pull Request

---

## License

Distributed under the MIT License. See `LICENSE` for more information.

---

## Acknowledgements

- OpenAI & Google Gemini
- Prisma & Neon DB
- Shadcn UI
- All early testers and contributors
```

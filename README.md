# LectureFlow — College Lecture Schedule & Notification System

**LectureFlow** is a modern, minimal academic web & mobile (PWA) application built for college students to track their daily classes, labs, and trainings in real time—without clutter.

## Key Features

- **Today Schedule & Live Flow**
  - Displays live daily counts for **Lectures**, **Labs**, and **Trainings**.
  - Highlights the **Ongoing** class with a live progress bar, remaining time, room number, and faculty name.
  - Shows the **Next Lecture** countdown, automatic **Break / Lunch** detection, and **Completed** session states across a chronological vertical timeline.
- **Department, Semester (Sem 1–8) & Section Filtering**
  - Select your department, semester (`Sem 1`–`Sem 8`), and section (`CSE-11` to `CSE-29` or any custom section number) and save it as your active cohort.
- **Multi-Sheet `.xlsx` Timetable Extraction**
  - Upload college `.xlsx` workbooks containing multiple section tabs (`CSE-11`, `CSE-12`, etc.)—LectureFlow extracts **only** your saved section's schedule.
  - Automatically handles merged multi-period cells (labs/trainings), split batch rows (`G1`/`G2`), lunch columns, classroom formatting (e.g., `KC-402`), and maps subject codes to full subject & teacher names from the sheet legend.
  - Includes an editable review table to verify or adjust entries before publishing.
- **Weekly Timetable**
  - Full Monday–Saturday grid on desktop and a clean day-by-day view on mobile.
- **1-Click Lecture Notifications (Optional)**
  - **1-Click Enable**: Turn on instant browser/device push alerts (`5`, `10`, `15`, or `30` minutes before class) with quiet hours and duplicate prevention.
  - Works seamlessly as a timetable and timeline viewer even when all notifications are turned off.

## Tech Stack

- **Frontend**: React, TypeScript, Vite, Tailwind CSS, Lucide Icons, React Router, SheetJS (`xlsx`)
- **Backend & Scheduling**: Supabase (PostgreSQL, Row-Level Security, Edge Functions)
- **Notifications**: Web Push API .

## Getting Started

```bash
# 1. Install dependencies
npm install

# 2. (Optional) Copy environment template and add Supabase/VAPID keys
cp .env.example .env

# 3. Start development server
npm run dev
```

Open `http://localhost:5173` in your browser.

# 📚 Student OS — Complete User Guide
## How to Set Up & Use Every Feature

---

## FIRST-TIME SETUP

### Start the App

1. Open a terminal in your `Student OS` folder.
2. Start the backend:
   ```
   cd backend
   npm install       ← only first time
   node server.js
   ```
   Backend runs at: http://localhost:3001

3. Open a second terminal. Start the frontend:
   ```
   cd frontend
   npm install       ← only first time
   npm run dev
   ```
   Frontend opens at: http://localhost:5173

4. Open http://localhost:5173 in your browser.

> All your data is stored as JSON files inside the `/data` folder. You can open and read them anytime.

---

## SECTION 1 — YOUR PROFILE (Settings Section)

**What to fill in first — do this before anything else.**

Scroll all the way to the bottom of the page to the **Settings / Profile** section.

Fill in:
- Your full name
- Your college name
- Current semester number (e.g. 3)
- Current year (e.g. 2)
- GPA scale — choose 4.0 or 10.0
- Daily focus goal — how many pomodoros you want per day (default: 4)
- Attendance threshold — minimum % you need (default: 75)

Click **Save All Changes**.

### Profile Photo

On the hero/top section of the page, look at the right side — you will see a circle with your initials. Hover over it. A camera icon appears. Click it. Select any image from your computer (JPG, PNG, WEBP). Your photo will appear immediately.

---

## SECTION 2 — TIMETABLE (Your Semester Schedule)

**How to add your full semester timetable.**

Scroll to the **Timetable** section. Click the **+ Add Class** button (or similar add button in that section).

For each class, fill in:
- **Day** — select from dropdown (Monday, Tuesday, etc.)
- **Subject name** — e.g. "Data Structures"
- **Start time** — e.g. "09:30"
- **End time** — e.g. "10:30"
- **Room** — e.g. "Room 301" (optional)
- **Professor** — e.g. "Dr. Sharma" (optional)
- **Color** — pick a color for this subject (helps you identify it in the calendar)

Click **Save**. Repeat for every class in your timetable.

**Example — Monday timetable:**
```
Monday | Data Structures | 09:30 – 10:30 | Room 301 | Dr. Sharma | Blue
Monday | Mathematics     | 11:00 – 12:00 | Room 205 | Dr. Rao    | Purple
Monday | Physics Lab     | 14:00 – 16:00 | Lab 2    | Dr. Patel  | Green
```

**Tip:** Once you add your timetable, the Attendance section automatically shows those classes in the calendar. You do NOT need to add them again for attendance.

---

## SECTION 3 — ATTENDANCE

**How to mark attendance and track your percentage.**

Scroll to the **Attendance** section. You will see a monthly calendar.

### Marking a class:
1. Find the date on the calendar.
2. You will see small colored chips showing your classes for that day (these come from your timetable).
3. **Click on any class chip.**
4. A popup appears with 3 buttons:
   - ✅ **Present** — you attended the class
   - ❌ **Absent** — you missed it
   - 🟡 **Leave** — you are taking approved leave

### Leave Warning:
When you click **Leave**, a warning card appears showing:
- Your **current attendance %**
- Your **projected attendance %** after this leave
- Exactly **how much % you will lose**
- Whether you will fall below the 75% threshold

You can then **Confirm Leave** or **Cancel**.

### Navigating months:
Use the **< >** arrows at the top of the calendar to go to past or future months and mark attendance retroactively.

### Viewing attendance by subject:
On the right side of the Attendance section, you will see a ring chart for each subject showing its individual attendance %.

**Color guide:**
- 🟢 Green — 75% and above (safe)
- 🟡 Yellow — 65% to 74% (warning)
- 🔴 Red — below 65% (critical)

---

## SECTION 4 — CLASS NOTES (Upload PDF / PPT / DOCX)

**How to add your study materials.**

Scroll to the **Knowledge Library / Notes** section.

You have two ways to add notes:

### Option A — Type a note:
Click **✏️ Type Note**. Fill in title, subject, and type your content. Click Save.

### Option B — Upload a file (PDF, PPT, PPTX, DOC, DOCX):
1. Click **📎 Upload PDF / PPT / DOCX**.
2. A popup appears. Either:
   - Click the upload zone to browse your files, OR
   - Drag and drop a file directly onto the zone.
3. Supported formats: `.pdf`, `.ppt`, `.pptx`, `.doc`, `.docx`
4. Maximum file size: 50MB per file.
5. Add a title and subject tag.
6. Click **Upload File**.

The file is saved to your computer inside `/data/notes_files/`. After upload, your note appears as a card with a colored badge (PDF in red, DOCX in purple, PPTX in gold). Click **Open ↗** on the card to open the file in your browser or system viewer.

### Searching notes:
Type in the search bar at the top of the section to find notes by title or subject.

### Exam Mode:
Toggle the **Exam Mode** button to dim everything except your notes for focused reading.

---

## SECTION 5 — AI STUDY ASSISTANT

**How to use your personal AI tutor.**

Scroll to the **AI Study Assistant** section. Type any question in the chat box and press Enter or click Send.

**What you can ask:**
- "Explain binary search trees"
- "Give me 5 practice questions on integration"
- "Create a study plan for my upcoming exam"
- "Quiz me on Operating Systems concepts"
- "What are the key differences between TCP and UDP?"

The AI knows your subjects (from your timetable) and uses that context. The more you use it, the more relevant its answers become.

**Note:** You need an Anthropic API key for this to work. Open `/backend/.env` file and add:
```
ANTHROPIC_API_KEY=your_key_here
```
Get a key at: https://console.anthropic.com

---

## SECTION 6 — STICKY NOTES

**Your quick thought-capture board.**

Scroll to the **Sticky Notes** section. Click **+ New Note** or click anywhere on the notes board.

Fill in:
- Title (optional)
- Note content
- Color (yellow, pink, lavender, mint, peach)
- Subject tag

To **edit**: Click directly on a note's text — it becomes editable. Changes save automatically when you click away.

To **delete**: Hover over a note → an X button appears in the corner → click it.

To **pin**: Toggle the pin icon on a note to keep it at the top.

---

## SECTION 7 — HABIT TRACKER

**Track your daily routines.**

Scroll to the **Habit Tracker** section. Click **+ Add Habit**.

Fill in:
- Habit name (e.g. "Morning Study", "Exercise", "Read 30 min")
- Emoji icon
- Frequency: Daily or Weekly
- Color theme

### Marking habits complete:
Every day, click the checkbox on each habit card when you complete it. You will see a satisfying checkmark animation and your streak counter increases.

### Understanding the heatmap:
Each habit card shows a grid of the last 90 days. Darker green = more consistent completion. White = missed.

### Streak:
Your current streak resets to 0 if you miss a day (for daily habits). The longest streak is shown separately and never resets.

---

## SECTION 8 — CGPA CALCULATOR

**Track your academic performance.**

Scroll to the **CGPA / Grades** section.

### Adding a semester:
Click **+ Add Semester**. Give it a name (e.g. "Semester 3 — 2024").

### Adding courses:
Inside a semester, click **+ Add Course**. Fill in:
- Course name (e.g. "Data Structures")
- Credit hours (e.g. 4)
- Grade — either letter grade (A, B+, C) or direct GPA points (3.7, 3.0)

Your CGPA recalculates automatically.

### GPA scale:
Go to Settings and toggle between 4.0 and 10.0 scale to match your university.

### What-if simulator:
Change any grade in the dropdown and watch your CGPA update live — useful for planning before exams.

---

## SECTION 9 — FOCUS MODE & POMODORO

**Track your deep work sessions.**

Scroll to the **Focus Mode** section.

### Starting a session:
1. Set your timer — default is 25 min focus, 5 min break.
2. Click **Start**.
3. Work until the timer rings.
4. Take the break, then start the next session.

### Customizing times:
Click on the timer mode buttons (Focus / Short Break / Long Break) and adjust to your preference.

### Focus reports:
Scroll down within the Focus section to see:
- **Weekly report** — bar chart of focus minutes for each of the last 7 days
- **Monthly report** — calendar heatmap of focus time
- **Yearly report** — area chart of focus hours per week

All reports show time in both **minutes** and **hours** (e.g. "150 min · 2.5 hrs").

---

## SECTION 10 — SKILL ROADMAP

**Track your self-learning journey.**

Scroll to the **Skill Roadmap** section.

### Creating a roadmap:
Click **+ New Roadmap**. Give your skill a name (e.g. "Machine Learning", "Web Development", "DSA").

### Adding topics:
Inside a roadmap, click **+ Add Topic**. Fill in:
- Topic name (e.g. "Arrays", "Sorting Algorithms", "Neural Networks")
- Level: Beginner / Intermediate / Advanced
- Description (optional)
- Order (drag to reorder)

### Completing topics:
Click on any topic node → it turns green and shows a ✅. Your overall completion percentage updates.

### Switching roadmaps:
Use the pill buttons at the top of the section to switch between your different skill roadmaps.

---

## SECTION 11 — RESOURCES

**Your personal study links and materials.**

Scroll to the **Resources** section. Click **+ Add Resource**.

Types you can add:
- **Link** — paste any URL (YouTube, article, documentation). The app auto-fetches the title and thumbnail.
- **PDF** — upload a reference PDF
- **Tool** — add any tool (e.g. "Figma", "VS Code") with a description
- **Note reference** — link to a note you created in Section 4

Organize by subject or category. Use the search bar to find resources quickly.

---

## YOUR DATA FILES

All data lives in the `/data` folder. You can open these files in any text editor:

| File | What it stores |
|---|---|
| `profile.json` | Your name, settings |
| `timetable.json` | Your class schedule |
| `attendance_records.json` | All attendance entries |
| `class_notes.json` | Note titles and metadata |
| `notes_files/` | Uploaded PDF/PPT/DOCX files |
| `habits.json` | Your habits |
| `habit_completions.json` | Daily completions |
| `focus_sessions.json` | All pomodoro sessions |
| `courses.json` | Your subjects and grades |
| `roadmaps.json` | Skill roadmaps |
| `roadmap_topics.json` | Individual topics |
| `sticky_notes.json` | Sticky notes |
| `resources.json` | Saved resources |
| `ai_chat_history.json` | AI chat conversations |

### Backing up your data:
In the Settings section, click **Download Backup**. This downloads a ZIP of your entire `/data` folder.

### Resetting a section:
In Settings, each section has a Reset button. Click it, type CONFIRM, and that section's data is wiped clean.

---

## TROUBLESHOOTING

**App shows blank / won't load:**
Make sure both the backend (`node server.js` on port 3001) and frontend (`npm run dev` on port 5173) are running simultaneously.

**Profile photo not showing:**
After uploading, if the photo does not appear, hard-refresh the page (Ctrl+Shift+R or Cmd+Shift+R).

**AI chat not responding:**
Check that your `ANTHROPIC_API_KEY` is set in `/backend/.env`. Restart the backend after adding it.

**File upload fails:**
Check the file is under 50MB and is one of: `.pdf .ppt .pptx .doc .docx`. Other file types are blocked.

**Attendance % seems wrong:**
The percentage is based on total tracked slots. Make sure you have added your full timetable first and are marking every class.

---

*Student OS — Built for your personal use. Your data never leaves your computer.*

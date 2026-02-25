# 🗂️ Taiga CLI

A fast, developer-friendly command-line tool for interacting with the [Taiga](https://taiga.io) Project Management API. Built with **TypeScript**, **Node.js**, and **Commander**.

Manage your projects, user stories, tasks, and sprints — all without leaving your terminal.

---

## ✨ Features

- 🔐 **Auto-login** via `.env` — no manual login required
- 📁 **Projects** — list and inspect
- 📖 **User Stories** — full CRUD: create, update, assign, comment, move between sprints
- ✅ **Tasks** — full CRUD: create, update, assign, comment, view activity log
- 🏃 **Sprints** — full CRUD: create, rename, close, reopen
- 💬 **Comments** — read all comments per task or story
- 📋 **Activity Logs** — view the full change history of any task or story

---

## 🚀 Quick Start

### 1. Install dependencies
```bash
npm install
```

### 2. Build the project
```bash
npm run build
```

### 3. Link the CLI globally
```bash
npm link
```

### 4. Configure credentials
```bash
cp .env.example .env
```

Edit `.env`:
```env
# Taiga API URL (default: https://api.taiga.io/api/v1)
# Change only if using a self-hosted instance
TAIGA_URL=https://api.taiga.io/api/v1

# Add your credentials here — no manual login needed!
TAIGA_USERNAME=your_username_or_email
TAIGA_PASSWORD=your_password
```

> The CLI automatically logs you in using your `.env` credentials and caches the session token at `~/.taiga-cli.json`. If the token expires, it re-authenticates automatically.

### 5. Run your first command
```bash
taiga project list
```

---

## 📟 Command Overview

```
taiga
├── login                        Manually log in (if not using .env)
├── project
│   ├── list                     List all your projects
│   └── info <projectId>         Get project details
├── story
│   ├── list <projectId>         List user stories (--sprint, --status filters)
│   ├── info <storyId>           Detailed story info
│   ├── create                   Create a new story (-p, -s, --sprint, -d)
│   ├── set-status <storyId>     Change status (-s <statusId>)
│   ├── assign <storyId>         Assign to a user (-u <userId>)
│   ├── move-sprint <storyId>    Move to another sprint (--sprint)
│   ├── comment <storyId>        Add a comment (-m <message>)
│   ├── comments <storyId>       Read all comments
│   ├── activity <storyId>       View full activity log
│   ├── statuses <projectId>     List available status IDs
│   └── delete <storyId>         Delete a story
├── task
│   ├── list <projectId>         List tasks (--story, --sprint filters)
│   ├── info <taskId>            Detailed task info
│   ├── create                   Create a new task (-p, -s, --story, --sprint, -d)
│   ├── set-status <taskId>      Change status (-s <statusId>)
│   ├── assign <taskId>          Assign to a user (-u <userId>)
│   ├── unassign <taskId>        Remove assignee
│   ├── comment <taskId>         Add a comment (-m <message>)
│   ├── comments <taskId>        Read all comments
│   ├── activity <taskId>        View full activity log
│   ├── statuses <projectId>     List available status IDs
│   └── delete <taskId>          Delete a task
└── sprint
    ├── list <projectId>         List sprints (--open, --closed filters)
    ├── info <sprintId>          Sprint details + story list
    ├── create                   Create a sprint (-p, -n, --start, --end)
    ├── rename <sprintId>        Rename a sprint (-n)
    ├── set-dates <sprintId>     Update dates (--start, --end)
    ├── close <sprintId>         Close/archive a sprint
    ├── reopen <sprintId>        Reopen a closed sprint
    └── delete <sprintId>        Delete a sprint
```

---

## 🔁 Example Workflow

```bash
# Find your project ID
taiga project list

# Check what sprints are currently active
taiga sprint list 1773658 --open

# See all stories in the current sprint
taiga story list 1773658 --sprint 502999

# Create a new task under a story
taiga task create -p 1773658 -s "[Backend] Add rate limiting" --story 8974072

# Get status IDs, then update the task
taiga task statuses 1773658
taiga task set-status <taskId> -s <statusId>

# Add a progress comment
taiga task comment <taskId> -m "Rate limiter is live in staging. Needs QA sign-off."

# Read all comments on the task
taiga task comments <taskId>

# Mark the story ready for review
taiga story statuses 1773658
taiga story set-status 8974072 -s <statusId>
```

---

## 📖 Full Documentation

For detailed usage with all flags, options, and examples for every command, see:

👉 **[DOCS.md](./DOCS.md)**

---

## 🛠️ Development

```bash
# Run in dev mode (without building)
npm start -- project list

# Rebuild after code changes
npm run build

# Re-link after rebuilding
npm link
```

---

## 🧱 Project Structure

```
src/
├── index.ts          # CLI entry point, command registration
├── api.ts            # Axios client, auto-login, token storage
└── commands/
    ├── auth.ts       # login
    ├── project.ts    # project list, project info
    ├── story.ts      # full story CRUD
    ├── task.ts       # full task CRUD
    └── sprint.ts     # full sprint CRUD
```

---

## 📄 License

ISC

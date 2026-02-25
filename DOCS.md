# 🗂️ Taiga CLI — Complete Documentation

A command-line interface to interact with the [Taiga](https://taiga.io) Project Management API. Built with TypeScript and Node.js.

---

## 📦 Installation

### 1. Clone the repository and install dependencies
```bash
cd taiga-cli
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

The `taiga` command is now available globally on your system.

---

## ⚙️ Configuration

Create a `.env` file in the project root (copy from `.env.example`):

```bash
cp .env.example .env
```

Edit `.env` with your credentials:

```env
# Your Taiga instance URL (default: https://api.taiga.io/api/v1)
TAIGA_URL=https://api.taiga.io/api/v1

# Your login credentials (auto-login; no need to run `taiga login` manually)
TAIGA_USERNAME=your_username_or_email
TAIGA_PASSWORD=your_password
```

> **Note:** If `TAIGA_USERNAME` and `TAIGA_PASSWORD` are set in `.env`, the CLI will automatically log you in on the first command. The session token is cached in `~/.taiga-cli.json` for subsequent requests. If the token expires, it will be automatically cleared and re-authenticated on the next run.

---

## 🔐 Authentication

### Manual Login
If you prefer not to store credentials in `.env`, you can log in manually:

```bash
taiga login -u <username_or_email> -p <password>
```

**Options:**

| Flag | Description |
|------|-------------|
| `-u, --username <username>` | Your Taiga username or email |
| `-p, --password <password>` | Your Taiga password |

**Example:**
```bash
taiga login -u dean@example.com -p mypassword
```

---

## 📁 Projects

### List your projects
```bash
taiga project list
```

**Output includes:** Project name, ID, and description.

### Get project details
```bash
taiga project info <projectId>
```

**Example:**
```bash
taiga project info 1773658
```

---

## 📖 User Stories

### List all user stories
```bash
taiga story list <projectId> [options]
```

**Options:**

| Flag | Description |
|------|-------------|
| `--sprint <sprintId>` | Filter by sprint ID |
| `--status <statusId>` | Filter by status ID |

**Examples:**
```bash
# List all stories
taiga story list 1773658

# List stories in a specific sprint
taiga story list 1773658 --sprint 502999

# List stories by status
taiga story list 1773658 --status 5234
```

---

### Get story details
```bash
taiga story info <storyId>
```

Shows: subject, ref, status, sprint, assigned users, story points, dates, and description.

**Example:**
```bash
taiga story info 8974072
```

---

### Create a new user story
```bash
taiga story create -p <projectId> -s "<subject>" [options]
```

**Options:**

| Flag | Description |
|------|-------------|
| `-p, --project <projectId>` | **(Required)** Project ID |
| `-s, --subject <subject>` | **(Required)** Story title |
| `--sprint <sprintId>` | Assign to a sprint |
| `-d, --description <text>` | Story description |

**Example:**
```bash
taiga story create -p 1773658 -s "[Feature] Add dark mode" --sprint 502999 -d "Implement dark mode toggle in settings"
```

---

### Change story status
```bash
taiga story set-status <storyId> -s <statusId>
```

> 💡 Get status IDs with: `taiga story statuses <projectId>`

**Example:**
```bash
# First, get available status IDs
taiga story statuses 1773658

# Then update the story
taiga story set-status 8974072 -s 5234
```

---

### Assign a story to a user
```bash
taiga story assign <storyId> -u <userId>
```

> 💡 Get user IDs from: `taiga project info <projectId>` (members field) or `taiga task info <taskId>` (assigned_to field).

**Example:**
```bash
taiga story assign 8974072 -u 309812
```

---

### Move a story to a different sprint
```bash
taiga story move-sprint <storyId> --sprint <sprintId>
```

**Example:**
```bash
taiga story move-sprint 8974072 --sprint 503001
```

---

### Add a comment to a story
```bash
taiga story comment <storyId> -m "<message>"
```

**Example:**
```bash
taiga story comment 8974072 -m "Design approved. Moving to development."
```

---

### Read all comments on a story
```bash
taiga story comments <storyId>
```

Shows each comment with author name and timestamp.

---

### View full activity log of a story
```bash
taiga story activity <storyId>
```

Shows the complete history: status changes, assignments, and comments with timestamps.

---

### List available story statuses
```bash
taiga story statuses <projectId>
```

Use this to find the status IDs needed for `set-status`.

---

### Delete a user story
```bash
taiga story delete <storyId>
```

> ⚠️ This is permanent and cannot be undone.

---

## ✅ Tasks

### List all tasks
```bash
taiga task list <projectId> [options]
```

**Options:**

| Flag | Description |
|------|-------------|
| `-s, --story <storyId>` | Filter tasks by user story ID |
| `--sprint <sprintId>` | Filter tasks by sprint ID |

**Examples:**
```bash
# List all tasks in a project
taiga task list 1773658

# List tasks within a specific user story
taiga task list 1773658 --story 8974072

# List tasks in a sprint
taiga task list 1773658 --sprint 502999
```

---

### Get task details
```bash
taiga task info <taskId>
```

Shows: subject, ref, status, assignee, linked user story, sprint, created date, modified date, description.

**Example:**
```bash
taiga task info 8736554
```

---

### Create a new task
```bash
taiga task create -p <projectId> -s "<subject>" [options]
```

**Options:**

| Flag | Description |
|------|-------------|
| `-p, --project <projectId>` | **(Required)** Project ID |
| `-s, --subject <subject>` | **(Required)** Task title |
| `--story <storyId>` | Link to a user story |
| `--sprint <sprintId>` | Assign to a sprint |
| `-d, --description <text>` | Task description |

**Example:**
```bash
taiga task create -p 1773658 -s "[Backend] Add rate limiting" --story 8974072 --sprint 502999
```

---

### Change task status
```bash
taiga task set-status <taskId> -s <statusId>
```

> 💡 Get status IDs with: `taiga task statuses <projectId>`

**Example:**
```bash
# Get available statuses
taiga task statuses 1773658

# Set the status
taiga task set-status 8736554 -s 8120
```

---

### Assign a task to a user
```bash
taiga task assign <taskId> -u <userId>
```

**Example:**
```bash
taiga task assign 8736554 -u 309812
```

---

### Unassign a task
```bash
taiga task unassign <taskId>
```

---

### Add a comment to a task
```bash
taiga task comment <taskId> -m "<message>"
```

**Example:**
```bash
taiga task comment 8736554 -m "Blocked by missing API spec. Will resume tomorrow."
```

---

### Read all comments on a task
```bash
taiga task comments <taskId>
```

Shows each comment with author name and timestamp.

**Example:**
```bash
taiga task comments 8736554
```

---

### View full activity log of a task
```bash
taiga task activity <taskId>
```

Shows the complete history: all field changes and comments with timestamps.

---

### List available task statuses
```bash
taiga task statuses <projectId>
```

Use this to get the status IDs needed for `set-status`.

---

### Delete a task
```bash
taiga task delete <taskId>
```

> ⚠️ This is permanent and cannot be undone.

---

## 🏃 Sprints (Milestones)

### List all sprints
```bash
taiga sprint list <projectId> [options]
```

**Options:**

| Flag | Description |
|------|-------------|
| `--open` | Show only active sprints |
| `--closed` | Show only closed sprints |

**Examples:**
```bash
# List all sprints
taiga sprint list 1773658

# Show only active sprints
taiga sprint list 1773658 --open
```

---

### Get sprint details
```bash
taiga sprint info <sprintId>
```

Shows: sprint name, status, dates, and all user stories in the sprint.

**Example:**
```bash
taiga sprint info 502999
```

---

### Create a new sprint
```bash
taiga sprint create -p <projectId> -n "<name>" --start <date> --end <date>
```

**Options:**

| Flag | Description |
|------|-------------|
| `-p, --project <projectId>` | **(Required)** Project ID |
| `-n, --name <name>` | **(Required)** Sprint name |
| `--start <date>` | **(Required)** Start date (`YYYY-MM-DD`) |
| `--end <date>` | **(Required)** End date (`YYYY-MM-DD`) |

**Example:**
```bash
taiga sprint create -p 1773658 -n "Sprint 5 - Auth & Security" --start 2026-03-16 --end 2026-03-26
```

---

### Rename a sprint
```bash
taiga sprint rename <sprintId> -n "<new name>"
```

**Example:**
```bash
taiga sprint rename 503001 -n "Trust, Safety & Launch Prep"
```

---

### Update sprint dates
```bash
taiga sprint set-dates <sprintId> [options]
```

**Options:**

| Flag | Description |
|------|-------------|
| `--start <date>` | New start date (`YYYY-MM-DD`) |
| `--end <date>` | New end date (`YYYY-MM-DD`) |

**Example:**
```bash
taiga sprint set-dates 503001 --end 2026-03-20
```

---

### Close a sprint
```bash
taiga sprint close <sprintId>
```

**Example:**
```bash
taiga sprint close 502770
```

---

### Reopen a sprint
```bash
taiga sprint reopen <sprintId>
```

---

### Delete a sprint
```bash
taiga sprint delete <sprintId>
```

> ⚠️ This is permanent and cannot be undone.

---

## 🔁 Typical Workflow Example

Here's a real-world example of using the CLI end-to-end:

```bash
# 1. See your projects and find the project ID
taiga project list

# 2. List active sprints for the current iteration
taiga sprint list 1773658 --open

# 3. See all stories in the current sprint
taiga story list 1773658 --sprint 502999

# 4. Get details + description of a story
taiga story info 8974072

# 5. Create a task under that story
taiga task create -p 1773658 -s "[Backend] Setup WebSocket auth" --story 8974072 --sprint 502999

# 6. Update the task status to "In Progress"
taiga task statuses 1773658        # find the right status ID
taiga task set-status <taskId> -s <statusId>

# 7. Assign the task to a team member
taiga task assign <taskId> -u <userId>

# 8. Add a comment with an update
taiga task comment <taskId> -m "Socket server is up. Working on auth middleware now."

# 9. Read all comments on the task
taiga task comments <taskId>

# 10. Mark story as ready for test
taiga story set-status 8974072 -s <readyForTestStatusId>
```

---

## 🗂️ Command Reference Summary

| Resource | Commands |
|----------|----------|
| **auth** | `login` |
| **project** | `list`, `info` |
| **story** | `list`, `info`, `create`, `set-status`, `assign`, `move-sprint`, `comment`, `comments`, `activity`, `statuses`, `delete` |
| **task** | `list`, `info`, `create`, `set-status`, `assign`, `unassign`, `comment`, `comments`, `activity`, `statuses`, `delete` |
| **sprint** | `list`, `info`, `create`, `rename`, `set-dates`, `close`, `reopen`, `delete` |

---

## 🛠️ Development

### Run without building (dev mode)
```bash
npm start -- <command>
# e.g.
npm start -- project list
```

### Rebuild after making changes
```bash
npm run build
```

### Re-link after rebuilding (if binary changed)
```bash
npm link
```

---

## 📄 License

ISC

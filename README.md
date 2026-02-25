# Taiga CLI

A command-line tool for interacting with the Taiga Project Management API, built with TypeScript, Node.js, and Commander.

## Setup

1. Make sure you have Node.js installed.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Build the project:
   ```bash
   npm run build
   ```
4. Optional: If you are using a self-hosted instance of Taiga, create a `.env` file in the root directory:
   ```bash
   cp .env.example .env
   ```
   And set `TAIGA_URL` to your API URL (e.g. `https://taiga.yourcompany.com/api/v1`).
   For taiga.io, you can leave it blank.

5. Link the CLI globally:
   ```bash
   npm link
   ```

## Usage

Once linked, you can use the `taiga` command anywhere:

### 1. Login
```bash
taiga login -u <your-email> -p <your-password>
```

### 2. List Projects
```bash
taiga project list
```

### 3. Get Project Details
```bash
taiga project info <project-id>
```

## Adding More Commands
To add more commands (e.g., managing user stories or sprints), simply add new files in `src/commands/` and register them in `src/index.ts`.

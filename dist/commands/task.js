"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.taskCommand = void 0;
const commander_1 = require("commander");
const chalk_1 = __importDefault(require("chalk"));
const api_1 = require("../api");
// ─── Helpers ────────────────────────────────────────────────────────────────
function handleError(label, error) {
    console.error(chalk_1.default.red(`\n${label}`));
    if (error.response) {
        console.error(chalk_1.default.red(`HTTP ${error.response.status}: ${JSON.stringify(error.response.data)}`));
    }
    else {
        console.error(chalk_1.default.red(error.message));
    }
    process.exit(1);
}
function statusColor(name) {
    if (!name)
        return chalk_1.default.gray('Unknown');
    const lower = name.toLowerCase();
    if (lower.includes('closed') || lower.includes('done'))
        return chalk_1.default.green(`[${name}]`);
    if (lower.includes('progress') || lower.includes('develop'))
        return chalk_1.default.cyan(`[${name}]`);
    if (lower.includes('test') || lower.includes('review'))
        return chalk_1.default.magenta(`[${name}]`);
    if (lower.includes('new'))
        return chalk_1.default.gray(`[${name}]`);
    return chalk_1.default.yellow(`[${name}]`);
}
// ─── Commands ───────────────────────────────────────────────────────────────
exports.taskCommand = new commander_1.Command('task')
    .description('Manage Taiga tasks');
// --- taiga task list <projectId> ---
exports.taskCommand
    .command('list <projectId>')
    .description('List all tasks for a project')
    .option('-s, --story <storyId>', 'Filter by user story ID')
    .option('--sprint <sprintId>', 'Filter by sprint (milestone) ID')
    .action(async (projectId, options) => {
    console.log(chalk_1.default.yellow(`Fetching tasks for project ${projectId}...`));
    try {
        let url = `/tasks?project=${projectId}`;
        if (options.story)
            url += `&user_story=${options.story}`;
        if (options.sprint)
            url += `&milestone=${options.sprint}`;
        const response = await api_1.apiClient.get(url);
        const tasks = response.data;
        if (tasks.length === 0) {
            console.log(chalk_1.default.gray('No tasks found.'));
            return;
        }
        console.log(chalk_1.default.green(`Found ${tasks.length} tasks:\n`));
        tasks.forEach((t) => {
            const status = statusColor(t.status_extra_info?.name);
            const assignee = t.assigned_to_extra_info
                ? chalk_1.default.gray(`→ ${t.assigned_to_extra_info.full_name_display}`)
                : chalk_1.default.gray('→ Unassigned');
            console.log(`  ${chalk_1.default.white(`#${t.ref}`)} ${chalk_1.default.blue(t.subject)} ${status}`);
            console.log(`      ID: ${t.id}  ${assignee}`);
            if (t.user_story_extra_info) {
                console.log(`      Story: ${chalk_1.default.gray(t.user_story_extra_info.subject)}`);
            }
            console.log('');
        });
    }
    catch (error) {
        handleError('Failed to fetch tasks.', error);
    }
});
// --- taiga task info <taskId> ---
exports.taskCommand
    .command('info <taskId>')
    .description('Get detailed info about a specific task')
    .action(async (taskId) => {
    console.log(chalk_1.default.yellow(`Fetching task ${taskId}...`));
    try {
        const response = await api_1.apiClient.get(`/tasks/${taskId}`);
        const t = response.data;
        console.log(`\n${chalk_1.default.bold.blue(t.subject)}`);
        console.log(`${'─'.repeat(60)}`);
        console.log(`  ID:          ${t.id}`);
        console.log(`  Ref:         #${t.ref}`);
        console.log(`  Status:      ${statusColor(t.status_extra_info?.name)}`);
        console.log(`  Assigned to: ${t.assigned_to_extra_info?.full_name_display || chalk_1.default.gray('Unassigned')}`);
        console.log(`  User Story:  ${t.user_story_extra_info?.subject || chalk_1.default.gray('None')}`);
        console.log(`  Sprint:      ${t.milestone_slug || chalk_1.default.gray('Not in a sprint')}`);
        console.log(`  Created:     ${new Date(t.created_date).toLocaleString()}`);
        console.log(`  Modified:    ${new Date(t.modified_date).toLocaleString()}`);
        if (t.description) {
            console.log(`\n  Description:\n  ${chalk_1.default.gray(t.description)}`);
        }
    }
    catch (error) {
        handleError(`Failed to fetch task ${taskId}.`, error);
    }
});
// --- taiga task create ---
exports.taskCommand
    .command('create')
    .description('Create a new task')
    .requiredOption('-p, --project <projectId>', 'Project ID')
    .requiredOption('-s, --subject <subject>', 'Task subject/title')
    .option('--story <storyId>', 'Link to a user story ID')
    .option('--sprint <sprintId>', 'Assign to a sprint (milestone) ID')
    .option('-d, --description <description>', 'Task description')
    .action(async (options) => {
    console.log(chalk_1.default.yellow('Creating task...'));
    try {
        const payload = {
            project: parseInt(options.project),
            subject: options.subject,
        };
        if (options.story)
            payload.user_story = parseInt(options.story);
        if (options.sprint)
            payload.milestone = parseInt(options.sprint);
        if (options.description)
            payload.description = options.description;
        const response = await api_1.apiClient.post('/tasks', payload);
        const t = response.data;
        console.log(chalk_1.default.green(`\n✔ Task created successfully!`));
        console.log(`  Subject: ${chalk_1.default.blue(t.subject)}`);
        console.log(`  ID:      ${t.id}`);
        console.log(`  Ref:     #${t.ref}`);
    }
    catch (error) {
        handleError('Failed to create task.', error);
    }
});
// --- taiga task status <taskId> ---
exports.taskCommand
    .command('set-status <taskId>')
    .description('Change the status of a task')
    .requiredOption('-s, --status <statusId>', 'Status ID to set (get IDs from `taiga task statuses <projectId>`)')
    .action(async (taskId, options) => {
    console.log(chalk_1.default.yellow(`Updating status of task ${taskId}...`));
    try {
        // Fetch the current version first (required by Taiga API for PATCH)
        const current = await api_1.apiClient.get(`/tasks/${taskId}`);
        const version = current.data.version;
        const response = await api_1.apiClient.patch(`/tasks/${taskId}`, {
            status: parseInt(options.status),
            version,
        });
        console.log(chalk_1.default.green(`\n✔ Status updated to: ${statusColor(response.data.status_extra_info?.name)}`));
    }
    catch (error) {
        handleError(`Failed to update task ${taskId}.`, error);
    }
});
// --- taiga task assign <taskId> ---
exports.taskCommand
    .command('assign <taskId>')
    .description('Assign a task to a user')
    .requiredOption('-u, --user <userId>', 'User ID to assign the task to')
    .action(async (taskId, options) => {
    console.log(chalk_1.default.yellow(`Assigning task ${taskId} to user ${options.user}...`));
    try {
        const current = await api_1.apiClient.get(`/tasks/${taskId}`);
        const version = current.data.version;
        const response = await api_1.apiClient.patch(`/tasks/${taskId}`, {
            assigned_to: parseInt(options.user),
            version,
        });
        const assignee = response.data.assigned_to_extra_info?.full_name_display || options.user;
        console.log(chalk_1.default.green(`\n✔ Task assigned to ${chalk_1.default.blue(assignee)}`));
    }
    catch (error) {
        handleError(`Failed to assign task ${taskId}.`, error);
    }
});
// --- taiga task unassign <taskId> ---
exports.taskCommand
    .command('unassign <taskId>')
    .description('Unassign a task (remove assignee)')
    .action(async (taskId) => {
    console.log(chalk_1.default.yellow(`Removing assignee from task ${taskId}...`));
    try {
        const current = await api_1.apiClient.get(`/tasks/${taskId}`);
        const version = current.data.version;
        await api_1.apiClient.patch(`/tasks/${taskId}`, {
            assigned_to: null,
            version,
        });
        console.log(chalk_1.default.green(`\n✔ Task unassigned successfully.`));
    }
    catch (error) {
        handleError(`Failed to unassign task ${taskId}.`, error);
    }
});
// --- taiga task comment <taskId> ---
exports.taskCommand
    .command('comment <taskId>')
    .description('Add a comment to a task')
    .requiredOption('-m, --message <message>', 'Comment text')
    .action(async (taskId, options) => {
    console.log(chalk_1.default.yellow(`Adding comment to task ${taskId}...`));
    try {
        const current = await api_1.apiClient.get(`/tasks/${taskId}`);
        const version = current.data.version;
        await api_1.apiClient.patch(`/tasks/${taskId}`, {
            comment: options.message,
            version,
        });
        console.log(chalk_1.default.green(`\n✔ Comment added successfully!`));
    }
    catch (error) {
        handleError(`Failed to add comment to task ${taskId}.`, error);
    }
});
// --- taiga task delete <taskId> ---
exports.taskCommand
    .command('delete <taskId>')
    .description('Delete a task permanently')
    .action(async (taskId) => {
    try {
        await api_1.apiClient.delete(`/tasks/${taskId}`);
        console.log(chalk_1.default.green(`\n✔ Task ${taskId} deleted.`));
    }
    catch (error) {
        handleError(`Failed to delete task ${taskId}.`, error);
    }
});
// ─── Author helper (Taiga history uses 'user' object with nested name) ─────
function resolveAuthor(entry) {
    const u = entry.user;
    if (!u)
        return chalk_1.default.gray('Unknown');
    return u.name || u.full_name_display || u.username || u.email || 'Unknown';
}
// --- taiga task comments <taskId> ---
exports.taskCommand
    .command('comments <taskId>')
    .description('Read all comments on a task')
    .action(async (taskId) => {
    console.log(chalk_1.default.yellow(`Fetching comments for task ${taskId}...`));
    try {
        const response = await api_1.apiClient.get(`/history/task/${taskId}`);
        const history = response.data;
        // Filter only entries that have a comment
        const comments = history.filter((entry) => entry.comment && entry.comment.trim() !== '');
        if (comments.length === 0) {
            console.log(chalk_1.default.gray('No comments found on this task.'));
            return;
        }
        console.log(chalk_1.default.green(`Found ${comments.length} comment(s):\n`));
        comments.forEach((entry, i) => {
            const author = resolveAuthor(entry);
            const date = new Date(entry.created_at).toLocaleString();
            console.log(`  ${chalk_1.default.bold(`${i + 1}.`)} ${chalk_1.default.blue(author)} ${chalk_1.default.gray(`· ${date}`)}`);
            console.log(`  ${entry.comment}`);
            console.log('');
        });
    }
    catch (error) {
        handleError(`Failed to fetch comments for task ${taskId}.`, error);
    }
});
// --- taiga task activity <taskId> ---
exports.taskCommand
    .command('activity <taskId>')
    .description('Show full activity log (status changes, assignments, comments) for a task')
    .action(async (taskId) => {
    console.log(chalk_1.default.yellow(`Fetching activity for task ${taskId}...`));
    try {
        const response = await api_1.apiClient.get(`/history/task/${taskId}`);
        const history = response.data;
        if (history.length === 0) {
            console.log(chalk_1.default.gray('No activity found.'));
            return;
        }
        console.log(chalk_1.default.green(`Activity log (${history.length} entries):\n`));
        history.forEach((entry) => {
            const author = resolveAuthor(entry);
            const date = new Date(entry.created_at).toLocaleString();
            console.log(`  ${chalk_1.default.blue(author)} ${chalk_1.default.gray(`· ${date}`)}`);
            // Show field changes
            if (entry.diff) {
                for (const [field, value] of Object.entries(entry.diff)) {
                    if (Array.isArray(value) && value.length === 2) {
                        const [from, to] = value;
                        console.log(`    ${chalk_1.default.gray(field + ':')} ${chalk_1.default.red(String(from))} → ${chalk_1.default.green(String(to))}`);
                    }
                }
            }
            // Show comment if present
            if (entry.comment && entry.comment.trim()) {
                console.log(`    ${chalk_1.default.yellow('💬 Comment:')} ${entry.comment}`);
            }
            console.log('');
        });
    }
    catch (error) {
        handleError(`Failed to fetch activity for task ${taskId}.`, error);
    }
});
// --- taiga task statuses <projectId> ---
exports.taskCommand
    .command('statuses <projectId>')
    .description('List all available task statuses for a project (to get status IDs)')
    .action(async (projectId) => {
    console.log(chalk_1.default.yellow(`Fetching task statuses for project ${projectId}...`));
    try {
        const response = await api_1.apiClient.get(`/task-statuses?project=${projectId}`);
        const statuses = response.data;
        console.log(chalk_1.default.green(`\nAvailable statuses:\n`));
        statuses.forEach((s) => {
            const isClosed = s.is_closed ? chalk_1.default.gray('(closed)') : '';
            console.log(`  ${chalk_1.default.blue(s.name)} — ID: ${s.id} ${isClosed}`);
        });
    }
    catch (error) {
        handleError(`Failed to fetch task statuses.`, error);
    }
});

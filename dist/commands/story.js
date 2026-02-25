"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.storyCommand = void 0;
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
    if (lower.includes('design'))
        return chalk_1.default.blue(`[${name}]`);
    if (lower.includes('new'))
        return chalk_1.default.gray(`[${name}]`);
    return chalk_1.default.yellow(`[${name}]`);
}
// ─── Commands ───────────────────────────────────────────────────────────────
exports.storyCommand = new commander_1.Command('story')
    .description('Manage Taiga user stories');
// --- taiga story list <projectId> ---
exports.storyCommand
    .command('list <projectId>')
    .description('List all user stories for a project')
    .option('--sprint <sprintId>', 'Filter by sprint (milestone) ID')
    .option('--status <statusId>', 'Filter by status ID')
    .action(async (projectId, options) => {
    console.log(chalk_1.default.yellow(`Fetching user stories for project ${projectId}...`));
    try {
        let url = `/userstories?project=${projectId}`;
        if (options.sprint)
            url += `&milestone=${options.sprint}`;
        if (options.status)
            url += `&status=${options.status}`;
        const response = await api_1.apiClient.get(url);
        const stories = response.data;
        if (stories.length === 0) {
            console.log(chalk_1.default.gray('No user stories found.'));
            return;
        }
        console.log(chalk_1.default.green(`Found ${stories.length} user stories:\n`));
        stories.forEach((s) => {
            const status = statusColor(s.status_extra_info?.name);
            const assignees = s.assigned_users_extra_info?.length
                ? chalk_1.default.gray(`→ ${s.assigned_users_extra_info.map((u) => u.full_name_display).join(', ')}`)
                : chalk_1.default.gray('→ Unassigned');
            const points = s.total_points != null ? chalk_1.default.gray(`${s.total_points} pts`) : '';
            console.log(`  ${chalk_1.default.white(`#${s.ref}`)} ${chalk_1.default.blue(s.subject)} ${status} ${points}`);
            console.log(`      ID: ${s.id}  ${assignees}`);
            console.log('');
        });
    }
    catch (error) {
        handleError('Failed to fetch user stories.', error);
    }
});
// --- taiga story info <storyId> ---
exports.storyCommand
    .command('info <storyId>')
    .description('Get detailed info about a specific user story')
    .action(async (storyId) => {
    console.log(chalk_1.default.yellow(`Fetching user story ${storyId}...`));
    try {
        const response = await api_1.apiClient.get(`/userstories/${storyId}`);
        const s = response.data;
        console.log(`\n${chalk_1.default.bold.blue(s.subject)}`);
        console.log(`${'─'.repeat(60)}`);
        console.log(`  ID:          ${s.id}`);
        console.log(`  Ref:         #${s.ref}`);
        console.log(`  Status:      ${statusColor(s.status_extra_info?.name)}`);
        console.log(`  Sprint:      ${s.milestone_slug || chalk_1.default.gray('Not in a sprint')}`);
        console.log(`  Points:      ${s.total_points ?? chalk_1.default.gray('Not estimated')}`);
        const assignees = s.assigned_users_extra_info?.map((u) => u.full_name_display).join(', ') || 'Unassigned';
        console.log(`  Assigned to: ${assignees}`);
        console.log(`  Created:     ${new Date(s.created_date).toLocaleString()}`);
        console.log(`  Modified:    ${new Date(s.modified_date).toLocaleString()}`);
        if (s.description) {
            console.log(`\n  Description:\n  ${chalk_1.default.gray(s.description)}`);
        }
    }
    catch (error) {
        handleError(`Failed to fetch user story ${storyId}.`, error);
    }
});
// --- taiga story create ---
exports.storyCommand
    .command('create')
    .description('Create a new user story')
    .requiredOption('-p, --project <projectId>', 'Project ID')
    .requiredOption('-s, --subject <subject>', 'User story subject/title')
    .option('--sprint <sprintId>', 'Assign to a sprint (milestone) ID')
    .option('-d, --description <description>', 'Story description')
    .option('--points <points>', 'Story points (number)')
    .action(async (options) => {
    console.log(chalk_1.default.yellow('Creating user story...'));
    try {
        const payload = {
            project: parseInt(options.project),
            subject: options.subject,
        };
        if (options.sprint)
            payload.milestone = parseInt(options.sprint);
        if (options.description)
            payload.description = options.description;
        const response = await api_1.apiClient.post('/userstories', payload);
        const s = response.data;
        console.log(chalk_1.default.green(`\n✔ User story created successfully!`));
        console.log(`  Subject: ${chalk_1.default.blue(s.subject)}`);
        console.log(`  ID:      ${s.id}`);
        console.log(`  Ref:     #${s.ref}`);
    }
    catch (error) {
        handleError('Failed to create user story.', error);
    }
});
// --- taiga story set-status <storyId> ---
exports.storyCommand
    .command('set-status <storyId>')
    .description('Change the status of a user story')
    .requiredOption('-s, --status <statusId>', 'Status ID (get IDs via `taiga story statuses <projectId>`)')
    .action(async (storyId, options) => {
    console.log(chalk_1.default.yellow(`Updating status of story ${storyId}...`));
    try {
        const current = await api_1.apiClient.get(`/userstories/${storyId}`);
        const version = current.data.version;
        const response = await api_1.apiClient.patch(`/userstories/${storyId}`, {
            status: parseInt(options.status),
            version,
        });
        console.log(chalk_1.default.green(`\n✔ Status updated to: ${statusColor(response.data.status_extra_info?.name)}`));
    }
    catch (error) {
        handleError(`Failed to update story ${storyId}.`, error);
    }
});
// --- taiga story assign <storyId> ---
exports.storyCommand
    .command('assign <storyId>')
    .description('Assign a user story to a user')
    .requiredOption('-u, --user <userId>', 'User ID to assign the story to')
    .action(async (storyId, options) => {
    console.log(chalk_1.default.yellow(`Assigning story ${storyId} to user ${options.user}...`));
    try {
        const current = await api_1.apiClient.get(`/userstories/${storyId}`);
        const version = current.data.version;
        const response = await api_1.apiClient.patch(`/userstories/${storyId}`, {
            assigned_to: parseInt(options.user),
            version,
        });
        const assignee = response.data.assigned_to_extra_info?.full_name_display || options.user;
        console.log(chalk_1.default.green(`\n✔ Story assigned to ${chalk_1.default.blue(assignee)}`));
    }
    catch (error) {
        handleError(`Failed to assign story ${storyId}.`, error);
    }
});
// --- taiga story move-sprint <storyId> ---
exports.storyCommand
    .command('move-sprint <storyId>')
    .description('Move a user story to a different sprint')
    .requiredOption('--sprint <sprintId>', 'Target sprint (milestone) ID')
    .action(async (storyId, options) => {
    console.log(chalk_1.default.yellow(`Moving story ${storyId} to sprint ${options.sprint}...`));
    try {
        const current = await api_1.apiClient.get(`/userstories/${storyId}`);
        const version = current.data.version;
        await api_1.apiClient.patch(`/userstories/${storyId}`, {
            milestone: parseInt(options.sprint),
            version,
        });
        console.log(chalk_1.default.green(`\n✔ Story moved to sprint ${options.sprint}.`));
    }
    catch (error) {
        handleError(`Failed to move story ${storyId}.`, error);
    }
});
// --- taiga story comment <storyId> ---
exports.storyCommand
    .command('comment <storyId>')
    .description('Add a comment to a user story')
    .requiredOption('-m, --message <message>', 'Comment text')
    .action(async (storyId, options) => {
    console.log(chalk_1.default.yellow(`Adding comment to story ${storyId}...`));
    try {
        const current = await api_1.apiClient.get(`/userstories/${storyId}`);
        const version = current.data.version;
        await api_1.apiClient.patch(`/userstories/${storyId}`, {
            comment: options.message,
            version,
        });
        console.log(chalk_1.default.green(`\n✔ Comment added successfully!`));
    }
    catch (error) {
        handleError(`Failed to add comment to story ${storyId}.`, error);
    }
});
// --- taiga story delete <storyId> ---
exports.storyCommand
    .command('delete <storyId>')
    .description('Delete a user story permanently')
    .action(async (storyId) => {
    try {
        await api_1.apiClient.delete(`/userstories/${storyId}`);
        console.log(chalk_1.default.green(`\n✔ User story ${storyId} deleted.`));
    }
    catch (error) {
        handleError(`Failed to delete user story ${storyId}.`, error);
    }
});
// --- taiga story statuses <projectId> ---
exports.storyCommand
    .command('statuses <projectId>')
    .description('List all available statuses for user stories in a project')
    .action(async (projectId) => {
    console.log(chalk_1.default.yellow(`Fetching user story statuses for project ${projectId}...`));
    try {
        const response = await api_1.apiClient.get(`/userstory-statuses?project=${projectId}`);
        const statuses = response.data;
        console.log(chalk_1.default.green(`\nAvailable statuses:\n`));
        statuses.forEach((s) => {
            const isClosed = s.is_closed ? chalk_1.default.gray('(closed)') : '';
            console.log(`  ${chalk_1.default.blue(s.name)} — ID: ${s.id} ${isClosed}`);
        });
    }
    catch (error) {
        handleError(`Failed to fetch user story statuses.`, error);
    }
});

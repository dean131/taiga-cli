import { Command } from 'commander';
import chalk from 'chalk';
import { apiClient } from '../api';

// ─── Helpers ────────────────────────────────────────────────────────────────

function handleError(label: string, error: any) {
    console.error(chalk.red(`\n${label}`));
    if (error.response) {
        console.error(chalk.red(`HTTP ${error.response.status}: ${JSON.stringify(error.response.data)}`));
    } else {
        console.error(chalk.red(error.message));
    }
    process.exit(1);
}

function statusColor(name: string): string {
    if (!name) return chalk.gray('Unknown');
    const lower = name.toLowerCase();
    if (lower.includes('closed') || lower.includes('done')) return chalk.green(`[${name}]`);
    if (lower.includes('progress') || lower.includes('develop')) return chalk.cyan(`[${name}]`);
    if (lower.includes('test') || lower.includes('review')) return chalk.magenta(`[${name}]`);
    if (lower.includes('new')) return chalk.gray(`[${name}]`);
    return chalk.yellow(`[${name}]`);
}

// ─── Commands ───────────────────────────────────────────────────────────────

export const taskCommand = new Command('task')
    .description('Manage Taiga tasks');

// --- taiga task list <projectId> ---
taskCommand
    .command('list <projectId>')
    .description('List all tasks for a project')
    .option('-s, --story <storyId>', 'Filter by user story ID')
    .option('--sprint <sprintId>', 'Filter by sprint (milestone) ID')
    .action(async (projectId, options) => {
        console.log(chalk.yellow(`Fetching tasks for project ${projectId}...`));
        try {
            let url = `/tasks?project=${projectId}`;
            if (options.story) url += `&user_story=${options.story}`;
            if (options.sprint) url += `&milestone=${options.sprint}`;

            const response = await apiClient.get(url);
            const tasks = response.data;

            if (tasks.length === 0) {
                console.log(chalk.gray('No tasks found.'));
                return;
            }

            console.log(chalk.green(`Found ${tasks.length} tasks:\n`));
            tasks.forEach((t: any) => {
                const status = statusColor(t.status_extra_info?.name);
                const assignee = t.assigned_to_extra_info
                    ? chalk.gray(`→ ${t.assigned_to_extra_info.full_name_display}`)
                    : chalk.gray('→ Unassigned');
                console.log(`  ${chalk.white(`#${t.ref}`)} ${chalk.blue(t.subject)} ${status}`);
                console.log(`      ID: ${t.id}  ${assignee}`);
                if (t.user_story_extra_info) {
                    console.log(`      Story: ${chalk.gray(t.user_story_extra_info.subject)}`);
                }
                console.log('');
            });
        } catch (error: any) {
            handleError('Failed to fetch tasks.', error);
        }
    });

// --- taiga task info <taskId> ---
taskCommand
    .command('info <taskId>')
    .description('Get detailed info about a specific task')
    .action(async (taskId) => {
        console.log(chalk.yellow(`Fetching task ${taskId}...`));
        try {
            const response = await apiClient.get(`/tasks/${taskId}`);
            const t = response.data;

            console.log(`\n${chalk.bold.blue(t.subject)}`);
            console.log(`${'─'.repeat(60)}`);
            console.log(`  ID:          ${t.id}`);
            console.log(`  Ref:         #${t.ref}`);
            console.log(`  Status:      ${statusColor(t.status_extra_info?.name)}`);
            console.log(`  Assigned to: ${t.assigned_to_extra_info?.full_name_display || chalk.gray('Unassigned')}`);
            console.log(`  User Story:  ${t.user_story_extra_info?.subject || chalk.gray('None')}`);
            console.log(`  Sprint:      ${t.milestone_slug || chalk.gray('Not in a sprint')}`);
            console.log(`  Created:     ${new Date(t.created_date).toLocaleString()}`);
            console.log(`  Modified:    ${new Date(t.modified_date).toLocaleString()}`);
            if (t.description) {
                console.log(`\n  Description:\n  ${chalk.gray(t.description)}`);
            }
        } catch (error: any) {
            handleError(`Failed to fetch task ${taskId}.`, error);
        }
    });

// --- taiga task create ---
taskCommand
    .command('create')
    .description('Create a new task')
    .requiredOption('-p, --project <projectId>', 'Project ID')
    .requiredOption('-s, --subject <subject>', 'Task subject/title')
    .option('--story <storyId>', 'Link to a user story ID')
    .option('--sprint <sprintId>', 'Assign to a sprint (milestone) ID')
    .option('-d, --description <description>', 'Task description')
    .action(async (options) => {
        console.log(chalk.yellow('Creating task...'));
        try {
            const payload: any = {
                project: parseInt(options.project),
                subject: options.subject,
            };
            if (options.story) payload.user_story = parseInt(options.story);
            if (options.sprint) payload.milestone = parseInt(options.sprint);
            if (options.description) payload.description = options.description;

            const response = await apiClient.post('/tasks', payload);
            const t = response.data;
            console.log(chalk.green(`\n✔ Task created successfully!`));
            console.log(`  Subject: ${chalk.blue(t.subject)}`);
            console.log(`  ID:      ${t.id}`);
            console.log(`  Ref:     #${t.ref}`);
        } catch (error: any) {
            handleError('Failed to create task.', error);
        }
    });

// --- taiga task status <taskId> ---
taskCommand
    .command('set-status <taskId>')
    .description('Change the status of a task')
    .requiredOption('-s, --status <statusId>', 'Status ID to set (get IDs from `taiga task statuses <projectId>`)')
    .action(async (taskId, options) => {
        console.log(chalk.yellow(`Updating status of task ${taskId}...`));
        try {
            // Fetch the current version first (required by Taiga API for PATCH)
            const current = await apiClient.get(`/tasks/${taskId}`);
            const version = current.data.version;

            const response = await apiClient.patch(`/tasks/${taskId}`, {
                status: parseInt(options.status),
                version,
            });
            console.log(chalk.green(`\n✔ Status updated to: ${statusColor(response.data.status_extra_info?.name)}`));
        } catch (error: any) {
            handleError(`Failed to update task ${taskId}.`, error);
        }
    });

// --- taiga task assign <taskId> ---
taskCommand
    .command('assign <taskId>')
    .description('Assign a task to a user')
    .requiredOption('-u, --user <userId>', 'User ID to assign the task to')
    .action(async (taskId, options) => {
        console.log(chalk.yellow(`Assigning task ${taskId} to user ${options.user}...`));
        try {
            const current = await apiClient.get(`/tasks/${taskId}`);
            const version = current.data.version;

            const response = await apiClient.patch(`/tasks/${taskId}`, {
                assigned_to: parseInt(options.user),
                version,
            });
            const assignee = response.data.assigned_to_extra_info?.full_name_display || options.user;
            console.log(chalk.green(`\n✔ Task assigned to ${chalk.blue(assignee)}`));
        } catch (error: any) {
            handleError(`Failed to assign task ${taskId}.`, error);
        }
    });

// --- taiga task unassign <taskId> ---
taskCommand
    .command('unassign <taskId>')
    .description('Unassign a task (remove assignee)')
    .action(async (taskId) => {
        console.log(chalk.yellow(`Removing assignee from task ${taskId}...`));
        try {
            const current = await apiClient.get(`/tasks/${taskId}`);
            const version = current.data.version;

            await apiClient.patch(`/tasks/${taskId}`, {
                assigned_to: null,
                version,
            });
            console.log(chalk.green(`\n✔ Task unassigned successfully.`));
        } catch (error: any) {
            handleError(`Failed to unassign task ${taskId}.`, error);
        }
    });

// --- taiga task comment <taskId> ---
taskCommand
    .command('comment <taskId>')
    .description('Add a comment to a task')
    .requiredOption('-m, --message <message>', 'Comment text')
    .action(async (taskId, options) => {
        console.log(chalk.yellow(`Adding comment to task ${taskId}...`));
        try {
            const current = await apiClient.get(`/tasks/${taskId}`);
            const version = current.data.version;

            await apiClient.patch(`/tasks/${taskId}`, {
                comment: options.message,
                version,
            });
            console.log(chalk.green(`\n✔ Comment added successfully!`));
        } catch (error: any) {
            handleError(`Failed to add comment to task ${taskId}.`, error);
        }
    });

// --- taiga task delete <taskId> ---
taskCommand
    .command('delete <taskId>')
    .description('Delete a task permanently')
    .action(async (taskId) => {
        try {
            await apiClient.delete(`/tasks/${taskId}`);
            console.log(chalk.green(`\n✔ Task ${taskId} deleted.`));
        } catch (error: any) {
            handleError(`Failed to delete task ${taskId}.`, error);
        }
    });

// --- taiga task statuses <projectId> ---
taskCommand
    .command('statuses <projectId>')
    .description('List all available task statuses for a project (to get status IDs)')
    .action(async (projectId) => {
        console.log(chalk.yellow(`Fetching task statuses for project ${projectId}...`));
        try {
            const response = await apiClient.get(`/task-statuses?project=${projectId}`);
            const statuses = response.data;
            console.log(chalk.green(`\nAvailable statuses:\n`));
            statuses.forEach((s: any) => {
                const isClosed = s.is_closed ? chalk.gray('(closed)') : '';
                console.log(`  ${chalk.blue(s.name)} — ID: ${s.id} ${isClosed}`);
            });
        } catch (error: any) {
            handleError(`Failed to fetch task statuses.`, error);
        }
    });

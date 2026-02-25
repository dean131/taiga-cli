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
    if (lower.includes('design')) return chalk.blue(`[${name}]`);
    if (lower.includes('new')) return chalk.gray(`[${name}]`);
    return chalk.yellow(`[${name}]`);
}

// ─── Commands ───────────────────────────────────────────────────────────────

export const storyCommand = new Command('story')
    .description('Manage Taiga user stories');

// --- taiga story list <projectId> ---
storyCommand
    .command('list <projectId>')
    .description('List all user stories for a project')
    .option('--sprint <sprintId>', 'Filter by sprint (milestone) ID')
    .option('--status <statusId>', 'Filter by status ID')
    .action(async (projectId, options) => {
        console.log(chalk.yellow(`Fetching user stories for project ${projectId}...`));
        try {
            let url = `/userstories?project=${projectId}`;
            if (options.sprint) url += `&milestone=${options.sprint}`;
            if (options.status) url += `&status=${options.status}`;

            const response = await apiClient.get(url);
            const stories = response.data;

            if (stories.length === 0) {
                console.log(chalk.gray('No user stories found.'));
                return;
            }

            console.log(chalk.green(`Found ${stories.length} user stories:\n`));
            stories.forEach((s: any) => {
                const status = statusColor(s.status_extra_info?.name);
                const assignees = s.assigned_users_extra_info?.length
                    ? chalk.gray(`→ ${s.assigned_users_extra_info.map((u: any) => u.full_name_display).join(', ')}`)
                    : chalk.gray('→ Unassigned');
                const points = s.total_points != null ? chalk.gray(`${s.total_points} pts`) : '';
                console.log(`  ${chalk.white(`#${s.ref}`)} ${chalk.blue(s.subject)} ${status} ${points}`);
                console.log(`      ID: ${s.id}  ${assignees}`);
                console.log('');
            });
        } catch (error: any) {
            handleError('Failed to fetch user stories.', error);
        }
    });

// --- taiga story info <storyId> ---
storyCommand
    .command('info <storyId>')
    .description('Get detailed info about a specific user story')
    .action(async (storyId) => {
        console.log(chalk.yellow(`Fetching user story ${storyId}...`));
        try {
            const response = await apiClient.get(`/userstories/${storyId}`);
            const s = response.data;

            console.log(`\n${chalk.bold.blue(s.subject)}`);
            console.log(`${'─'.repeat(60)}`);
            console.log(`  ID:          ${s.id}`);
            console.log(`  Ref:         #${s.ref}`);
            console.log(`  Status:      ${statusColor(s.status_extra_info?.name)}`);
            console.log(`  Sprint:      ${s.milestone_slug || chalk.gray('Not in a sprint')}`);
            console.log(`  Points:      ${s.total_points ?? chalk.gray('Not estimated')}`);
            const assignees = s.assigned_users_extra_info?.map((u: any) => u.full_name_display).join(', ') || 'Unassigned';
            console.log(`  Assigned to: ${assignees}`);
            console.log(`  Created:     ${new Date(s.created_date).toLocaleString()}`);
            console.log(`  Modified:    ${new Date(s.modified_date).toLocaleString()}`);
            if (s.description) {
                console.log(`\n  Description:\n  ${chalk.gray(s.description)}`);
            }
        } catch (error: any) {
            handleError(`Failed to fetch user story ${storyId}.`, error);
        }
    });

// --- taiga story create ---
storyCommand
    .command('create')
    .description('Create a new user story')
    .requiredOption('-p, --project <projectId>', 'Project ID')
    .requiredOption('-s, --subject <subject>', 'User story subject/title')
    .option('--sprint <sprintId>', 'Assign to a sprint (milestone) ID')
    .option('-d, --description <description>', 'Story description')
    .option('--points <points>', 'Story points (number)')
    .action(async (options) => {
        console.log(chalk.yellow('Creating user story...'));
        try {
            const payload: any = {
                project: parseInt(options.project),
                subject: options.subject,
            };
            if (options.sprint) payload.milestone = parseInt(options.sprint);
            if (options.description) payload.description = options.description;

            const response = await apiClient.post('/userstories', payload);
            const s = response.data;
            console.log(chalk.green(`\n✔ User story created successfully!`));
            console.log(`  Subject: ${chalk.blue(s.subject)}`);
            console.log(`  ID:      ${s.id}`);
            console.log(`  Ref:     #${s.ref}`);
        } catch (error: any) {
            handleError('Failed to create user story.', error);
        }
    });

// --- taiga story set-status <storyId> ---
storyCommand
    .command('set-status <storyId>')
    .description('Change the status of a user story')
    .requiredOption('-s, --status <statusId>', 'Status ID (get IDs via `taiga story statuses <projectId>`)')
    .action(async (storyId, options) => {
        console.log(chalk.yellow(`Updating status of story ${storyId}...`));
        try {
            const current = await apiClient.get(`/userstories/${storyId}`);
            const version = current.data.version;

            const response = await apiClient.patch(`/userstories/${storyId}`, {
                status: parseInt(options.status),
                version,
            });
            console.log(chalk.green(`\n✔ Status updated to: ${statusColor(response.data.status_extra_info?.name)}`));
        } catch (error: any) {
            handleError(`Failed to update story ${storyId}.`, error);
        }
    });

// --- taiga story assign <storyId> ---
storyCommand
    .command('assign <storyId>')
    .description('Assign a user story to a user')
    .requiredOption('-u, --user <userId>', 'User ID to assign the story to')
    .action(async (storyId, options) => {
        console.log(chalk.yellow(`Assigning story ${storyId} to user ${options.user}...`));
        try {
            const current = await apiClient.get(`/userstories/${storyId}`);
            const version = current.data.version;

            const response = await apiClient.patch(`/userstories/${storyId}`, {
                assigned_to: parseInt(options.user),
                version,
            });
            const assignee = response.data.assigned_to_extra_info?.full_name_display || options.user;
            console.log(chalk.green(`\n✔ Story assigned to ${chalk.blue(assignee)}`));
        } catch (error: any) {
            handleError(`Failed to assign story ${storyId}.`, error);
        }
    });

// --- taiga story move-sprint <storyId> ---
storyCommand
    .command('move-sprint <storyId>')
    .description('Move a user story to a different sprint')
    .requiredOption('--sprint <sprintId>', 'Target sprint (milestone) ID')
    .action(async (storyId, options) => {
        console.log(chalk.yellow(`Moving story ${storyId} to sprint ${options.sprint}...`));
        try {
            const current = await apiClient.get(`/userstories/${storyId}`);
            const version = current.data.version;

            await apiClient.patch(`/userstories/${storyId}`, {
                milestone: parseInt(options.sprint),
                version,
            });
            console.log(chalk.green(`\n✔ Story moved to sprint ${options.sprint}.`));
        } catch (error: any) {
            handleError(`Failed to move story ${storyId}.`, error);
        }
    });

// --- taiga story comment <storyId> ---
storyCommand
    .command('comment <storyId>')
    .description('Add a comment to a user story')
    .requiredOption('-m, --message <message>', 'Comment text')
    .action(async (storyId, options) => {
        console.log(chalk.yellow(`Adding comment to story ${storyId}...`));
        try {
            const current = await apiClient.get(`/userstories/${storyId}`);
            const version = current.data.version;

            await apiClient.patch(`/userstories/${storyId}`, {
                comment: options.message,
                version,
            });
            console.log(chalk.green(`\n✔ Comment added successfully!`));
        } catch (error: any) {
            handleError(`Failed to add comment to story ${storyId}.`, error);
        }
    });

// --- taiga story delete <storyId> ---
storyCommand
    .command('delete <storyId>')
    .description('Delete a user story permanently')
    .action(async (storyId) => {
        try {
            await apiClient.delete(`/userstories/${storyId}`);
            console.log(chalk.green(`\n✔ User story ${storyId} deleted.`));
        } catch (error: any) {
            handleError(`Failed to delete user story ${storyId}.`, error);
        }
    });

// ─── Author helper ────────────────────────────────────────────────────
function resolveAuthor(entry: any): string {
    const u = entry.user;
    if (!u) return chalk.gray('Unknown');
    return u.name || u.full_name_display || u.username || u.email || 'Unknown';
}

// --- taiga story comments <storyId> ---
storyCommand
    .command('comments <storyId>')
    .description('Read all comments on a user story')
    .action(async (storyId) => {
        console.log(chalk.yellow(`Fetching comments for story ${storyId}...`));
        try {
            const response = await apiClient.get(`/history/userstory/${storyId}`);
            const history = response.data;

            const comments = history.filter((entry: any) => entry.comment && entry.comment.trim() !== '');

            if (comments.length === 0) {
                console.log(chalk.gray('No comments found on this user story.'));
                return;
            }

            console.log(chalk.green(`Found ${comments.length} comment(s):\n`));
            comments.forEach((entry: any, i: number) => {
                const author = resolveAuthor(entry);
                const date = new Date(entry.created_at).toLocaleString();
                console.log(`  ${chalk.bold(`${i + 1}.`)} ${chalk.blue(author)} ${chalk.gray(`· ${date}`)}`);
                console.log(`  ${entry.comment}`);
                console.log('');
            });
        } catch (error: any) {
            handleError(`Failed to fetch comments for story ${storyId}.`, error);
        }
    });

// --- taiga story activity <storyId> ---
storyCommand
    .command('activity <storyId>')
    .description('Show full activity log (status changes, assignments, comments) for a user story')
    .action(async (storyId) => {
        console.log(chalk.yellow(`Fetching activity for story ${storyId}...`));
        try {
            const response = await apiClient.get(`/history/userstory/${storyId}`);
            const history = response.data;

            if (history.length === 0) {
                console.log(chalk.gray('No activity found.'));
                return;
            }

            console.log(chalk.green(`Activity log (${history.length} entries):\n`));
            history.forEach((entry: any) => {
                const author = resolveAuthor(entry);
                const date = new Date(entry.created_at).toLocaleString();
                console.log(`  ${chalk.blue(author)} ${chalk.gray(`· ${date}`)}`);

                if (entry.diff) {
                    for (const [field, value] of Object.entries(entry.diff) as any) {
                        if (Array.isArray(value) && value.length === 2) {
                            const [from, to] = value;
                            console.log(`    ${chalk.gray(field + ':')} ${chalk.red(String(from))} → ${chalk.green(String(to))}`);
                        }
                    }
                }

                if (entry.comment && entry.comment.trim()) {
                    console.log(`    ${chalk.yellow('💬 Comment:')} ${entry.comment}`);
                }

                console.log('');
            });
        } catch (error: any) {
            handleError(`Failed to fetch activity for story ${storyId}.`, error);
        }
    });

// --- taiga story statuses <projectId> ---
storyCommand
    .command('statuses <projectId>')
    .description('List all available statuses for user stories in a project')
    .action(async (projectId) => {
        console.log(chalk.yellow(`Fetching user story statuses for project ${projectId}...`));
        try {
            const response = await apiClient.get(`/userstory-statuses?project=${projectId}`);
            const statuses = response.data;
            console.log(chalk.green(`\nAvailable statuses:\n`));
            statuses.forEach((s: any) => {
                const isClosed = s.is_closed ? chalk.gray('(closed)') : '';
                console.log(`  ${chalk.blue(s.name)} — ID: ${s.id} ${isClosed}`);
            });
        } catch (error: any) {
            handleError(`Failed to fetch user story statuses.`, error);
        }
    });

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

// ─── Commands ───────────────────────────────────────────────────────────────

export const sprintCommand = new Command('sprint')
    .description('Manage Taiga sprints (milestones)');

// --- taiga sprint list <projectId> ---
sprintCommand
    .command('list <projectId>')
    .description('List all sprints for a project')
    .option('--open', 'Show only active sprints')
    .option('--closed', 'Show only closed sprints')
    .action(async (projectId, options) => {
        console.log(chalk.yellow(`Fetching sprints for project ${projectId}...`));
        try {
            let url = `/milestones?project=${projectId}`;
            if (options.open) url += `&closed=false`;
            if (options.closed) url += `&closed=true`;

            const response = await apiClient.get(url);
            const sprints = response.data;

            if (sprints.length === 0) {
                console.log(chalk.gray('No sprints found.'));
                return;
            }

            console.log(chalk.green(`Found ${sprints.length} sprints:\n`));
            sprints.forEach((s: any) => {
                const status = s.closed ? chalk.red('[Closed]') : chalk.green('[Active]');
                const stories = s.total_points != null ? chalk.gray(`${s.user_stories?.length ?? 0} stories`) : '';
                console.log(`  ${chalk.blue(s.name)} ${status}`);
                console.log(`      ID: ${s.id}  Dates: ${s.estimated_start} → ${s.estimated_finish}  ${stories}`);
                console.log('');
            });
        } catch (error: any) {
            handleError('Failed to fetch sprints.', error);
        }
    });

// --- taiga sprint info <sprintId> ---
sprintCommand
    .command('info <sprintId>')
    .description('Get detailed info about a sprint including its user stories')
    .action(async (sprintId) => {
        console.log(chalk.yellow(`Fetching sprint ${sprintId}...`));
        try {
            const [sprintRes, storiesRes] = await Promise.all([
                apiClient.get(`/milestones/${sprintId}`),
                apiClient.get(`/userstories?milestone=${sprintId}`),
            ]);
            const s = sprintRes.data;
            const stories = storiesRes.data;

            console.log(`\n${chalk.bold.blue(s.name)}`);
            console.log(`${'─'.repeat(60)}`);
            console.log(`  ID:      ${s.id}`);
            console.log(`  Status:  ${s.closed ? chalk.red('[Closed]') : chalk.green('[Active]')}`);
            console.log(`  Starts:  ${s.estimated_start}`);
            console.log(`  Ends:    ${s.estimated_finish}`);
            console.log(`  Stories: ${stories.length}`);

            if (stories.length > 0) {
                console.log(chalk.green('\n  User Stories:'));
                stories.forEach((st: any) => {
                    const stStatus = st.status_extra_info?.name || 'Unknown';
                    console.log(`    - ${chalk.blue(st.subject)} ${chalk.gray(`[${stStatus}]`)}`);
                });
            }
        } catch (error: any) {
            handleError(`Failed to fetch sprint ${sprintId}.`, error);
        }
    });

// --- taiga sprint create ---
sprintCommand
    .command('create')
    .description('Create a new sprint')
    .requiredOption('-p, --project <projectId>', 'Project ID')
    .requiredOption('-n, --name <name>', 'Sprint name')
    .requiredOption('--start <date>', 'Sprint start date (YYYY-MM-DD)')
    .requiredOption('--end <date>', 'Sprint end date (YYYY-MM-DD)')
    .action(async (options) => {
        console.log(chalk.yellow('Creating sprint...'));
        try {
            const response = await apiClient.post('/milestones', {
                project: parseInt(options.project),
                name: options.name,
                estimated_start: options.start,
                estimated_finish: options.end,
            });
            const s = response.data;
            console.log(chalk.green(`\n✔ Sprint created successfully!`));
            console.log(`  Name:   ${chalk.blue(s.name)}`);
            console.log(`  ID:     ${s.id}`);
            console.log(`  Dates:  ${s.estimated_start} → ${s.estimated_finish}`);
        } catch (error: any) {
            handleError('Failed to create sprint.', error);
        }
    });

// --- taiga sprint rename <sprintId> ---
sprintCommand
    .command('rename <sprintId>')
    .description('Rename a sprint')
    .requiredOption('-n, --name <name>', 'New sprint name')
    .action(async (sprintId, options) => {
        console.log(chalk.yellow(`Renaming sprint ${sprintId}...`));
        try {
            const response = await apiClient.patch(`/milestones/${sprintId}`, {
                name: options.name,
            });
            console.log(chalk.green(`\n✔ Sprint renamed to "${chalk.blue(response.data.name)}"`));
        } catch (error: any) {
            handleError(`Failed to rename sprint ${sprintId}.`, error);
        }
    });

// --- taiga sprint set-dates <sprintId> ---
sprintCommand
    .command('set-dates <sprintId>')
    .description('Update the start and/or end date of a sprint')
    .option('--start <date>', 'New start date (YYYY-MM-DD)')
    .option('--end <date>', 'New end date (YYYY-MM-DD)')
    .action(async (sprintId, options) => {
        if (!options.start && !options.end) {
            console.error(chalk.red('Please provide at least --start or --end.'));
            process.exit(1);
        }
        console.log(chalk.yellow(`Updating dates for sprint ${sprintId}...`));
        try {
            const payload: any = {};
            if (options.start) payload.estimated_start = options.start;
            if (options.end) payload.estimated_finish = options.end;

            const response = await apiClient.patch(`/milestones/${sprintId}`, payload);
            console.log(chalk.green(`\n✔ Sprint dates updated.`));
            console.log(`  New range: ${response.data.estimated_start} → ${response.data.estimated_finish}`);
        } catch (error: any) {
            handleError(`Failed to update sprint dates.`, error);
        }
    });

// --- taiga sprint close <sprintId> ---
sprintCommand
    .command('close <sprintId>')
    .description('Close/archive a sprint')
    .action(async (sprintId) => {
        console.log(chalk.yellow(`Closing sprint ${sprintId}...`));
        try {
            await apiClient.patch(`/milestones/${sprintId}`, { closed: true });
            console.log(chalk.green(`\n✔ Sprint ${sprintId} is now closed.`));
        } catch (error: any) {
            handleError(`Failed to close sprint ${sprintId}.`, error);
        }
    });

// --- taiga sprint reopen <sprintId> ---
sprintCommand
    .command('reopen <sprintId>')
    .description('Reopen a closed sprint')
    .action(async (sprintId) => {
        console.log(chalk.yellow(`Reopening sprint ${sprintId}...`));
        try {
            await apiClient.patch(`/milestones/${sprintId}`, { closed: false });
            console.log(chalk.green(`\n✔ Sprint ${sprintId} is now active again.`));
        } catch (error: any) {
            handleError(`Failed to reopen sprint ${sprintId}.`, error);
        }
    });

// --- taiga sprint delete <sprintId> ---
sprintCommand
    .command('delete <sprintId>')
    .description('Delete a sprint permanently')
    .action(async (sprintId) => {
        try {
            await apiClient.delete(`/milestones/${sprintId}`);
            console.log(chalk.green(`\n✔ Sprint ${sprintId} deleted.`));
        } catch (error: any) {
            handleError(`Failed to delete sprint ${sprintId}.`, error);
        }
    });

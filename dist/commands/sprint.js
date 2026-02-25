"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sprintCommand = void 0;
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
// ─── Commands ───────────────────────────────────────────────────────────────
exports.sprintCommand = new commander_1.Command('sprint')
    .description('Manage Taiga sprints (milestones)');
// --- taiga sprint list <projectId> ---
exports.sprintCommand
    .command('list <projectId>')
    .description('List all sprints for a project')
    .option('--open', 'Show only active sprints')
    .option('--closed', 'Show only closed sprints')
    .action(async (projectId, options) => {
    console.log(chalk_1.default.yellow(`Fetching sprints for project ${projectId}...`));
    try {
        let url = `/milestones?project=${projectId}`;
        if (options.open)
            url += `&closed=false`;
        if (options.closed)
            url += `&closed=true`;
        const response = await api_1.apiClient.get(url);
        const sprints = response.data;
        if (sprints.length === 0) {
            console.log(chalk_1.default.gray('No sprints found.'));
            return;
        }
        console.log(chalk_1.default.green(`Found ${sprints.length} sprints:\n`));
        sprints.forEach((s) => {
            const status = s.closed ? chalk_1.default.red('[Closed]') : chalk_1.default.green('[Active]');
            const stories = s.total_points != null ? chalk_1.default.gray(`${s.user_stories?.length ?? 0} stories`) : '';
            console.log(`  ${chalk_1.default.blue(s.name)} ${status}`);
            console.log(`      ID: ${s.id}  Dates: ${s.estimated_start} → ${s.estimated_finish}  ${stories}`);
            console.log('');
        });
    }
    catch (error) {
        handleError('Failed to fetch sprints.', error);
    }
});
// --- taiga sprint info <sprintId> ---
exports.sprintCommand
    .command('info <sprintId>')
    .description('Get detailed info about a sprint including its user stories')
    .action(async (sprintId) => {
    console.log(chalk_1.default.yellow(`Fetching sprint ${sprintId}...`));
    try {
        const [sprintRes, storiesRes] = await Promise.all([
            api_1.apiClient.get(`/milestones/${sprintId}`),
            api_1.apiClient.get(`/userstories?milestone=${sprintId}`),
        ]);
        const s = sprintRes.data;
        const stories = storiesRes.data;
        console.log(`\n${chalk_1.default.bold.blue(s.name)}`);
        console.log(`${'─'.repeat(60)}`);
        console.log(`  ID:      ${s.id}`);
        console.log(`  Status:  ${s.closed ? chalk_1.default.red('[Closed]') : chalk_1.default.green('[Active]')}`);
        console.log(`  Starts:  ${s.estimated_start}`);
        console.log(`  Ends:    ${s.estimated_finish}`);
        console.log(`  Stories: ${stories.length}`);
        if (stories.length > 0) {
            console.log(chalk_1.default.green('\n  User Stories:'));
            stories.forEach((st) => {
                const stStatus = st.status_extra_info?.name || 'Unknown';
                console.log(`    - ${chalk_1.default.blue(st.subject)} ${chalk_1.default.gray(`[${stStatus}]`)}`);
            });
        }
    }
    catch (error) {
        handleError(`Failed to fetch sprint ${sprintId}.`, error);
    }
});
// --- taiga sprint create ---
exports.sprintCommand
    .command('create')
    .description('Create a new sprint')
    .requiredOption('-p, --project <projectId>', 'Project ID')
    .requiredOption('-n, --name <name>', 'Sprint name')
    .requiredOption('--start <date>', 'Sprint start date (YYYY-MM-DD)')
    .requiredOption('--end <date>', 'Sprint end date (YYYY-MM-DD)')
    .action(async (options) => {
    console.log(chalk_1.default.yellow('Creating sprint...'));
    try {
        const response = await api_1.apiClient.post('/milestones', {
            project: parseInt(options.project),
            name: options.name,
            estimated_start: options.start,
            estimated_finish: options.end,
        });
        const s = response.data;
        console.log(chalk_1.default.green(`\n✔ Sprint created successfully!`));
        console.log(`  Name:   ${chalk_1.default.blue(s.name)}`);
        console.log(`  ID:     ${s.id}`);
        console.log(`  Dates:  ${s.estimated_start} → ${s.estimated_finish}`);
    }
    catch (error) {
        handleError('Failed to create sprint.', error);
    }
});
// --- taiga sprint rename <sprintId> ---
exports.sprintCommand
    .command('rename <sprintId>')
    .description('Rename a sprint')
    .requiredOption('-n, --name <name>', 'New sprint name')
    .action(async (sprintId, options) => {
    console.log(chalk_1.default.yellow(`Renaming sprint ${sprintId}...`));
    try {
        const response = await api_1.apiClient.patch(`/milestones/${sprintId}`, {
            name: options.name,
        });
        console.log(chalk_1.default.green(`\n✔ Sprint renamed to "${chalk_1.default.blue(response.data.name)}"`));
    }
    catch (error) {
        handleError(`Failed to rename sprint ${sprintId}.`, error);
    }
});
// --- taiga sprint set-dates <sprintId> ---
exports.sprintCommand
    .command('set-dates <sprintId>')
    .description('Update the start and/or end date of a sprint')
    .option('--start <date>', 'New start date (YYYY-MM-DD)')
    .option('--end <date>', 'New end date (YYYY-MM-DD)')
    .action(async (sprintId, options) => {
    if (!options.start && !options.end) {
        console.error(chalk_1.default.red('Please provide at least --start or --end.'));
        process.exit(1);
    }
    console.log(chalk_1.default.yellow(`Updating dates for sprint ${sprintId}...`));
    try {
        const payload = {};
        if (options.start)
            payload.estimated_start = options.start;
        if (options.end)
            payload.estimated_finish = options.end;
        const response = await api_1.apiClient.patch(`/milestones/${sprintId}`, payload);
        console.log(chalk_1.default.green(`\n✔ Sprint dates updated.`));
        console.log(`  New range: ${response.data.estimated_start} → ${response.data.estimated_finish}`);
    }
    catch (error) {
        handleError(`Failed to update sprint dates.`, error);
    }
});
// --- taiga sprint close <sprintId> ---
exports.sprintCommand
    .command('close <sprintId>')
    .description('Close/archive a sprint')
    .action(async (sprintId) => {
    console.log(chalk_1.default.yellow(`Closing sprint ${sprintId}...`));
    try {
        await api_1.apiClient.patch(`/milestones/${sprintId}`, { closed: true });
        console.log(chalk_1.default.green(`\n✔ Sprint ${sprintId} is now closed.`));
    }
    catch (error) {
        handleError(`Failed to close sprint ${sprintId}.`, error);
    }
});
// --- taiga sprint reopen <sprintId> ---
exports.sprintCommand
    .command('reopen <sprintId>')
    .description('Reopen a closed sprint')
    .action(async (sprintId) => {
    console.log(chalk_1.default.yellow(`Reopening sprint ${sprintId}...`));
    try {
        await api_1.apiClient.patch(`/milestones/${sprintId}`, { closed: false });
        console.log(chalk_1.default.green(`\n✔ Sprint ${sprintId} is now active again.`));
    }
    catch (error) {
        handleError(`Failed to reopen sprint ${sprintId}.`, error);
    }
});
// --- taiga sprint delete <sprintId> ---
exports.sprintCommand
    .command('delete <sprintId>')
    .description('Delete a sprint permanently')
    .action(async (sprintId) => {
    try {
        await api_1.apiClient.delete(`/milestones/${sprintId}`);
        console.log(chalk_1.default.green(`\n✔ Sprint ${sprintId} deleted.`));
    }
    catch (error) {
        handleError(`Failed to delete sprint ${sprintId}.`, error);
    }
});

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.taskCommand = void 0;
const commander_1 = require("commander");
const chalk_1 = __importDefault(require("chalk"));
const api_1 = require("../api");
exports.taskCommand = new commander_1.Command('task')
    .description('Manage Taiga tasks');
exports.taskCommand
    .command('list <projectId>')
    .description('List tasks for a project')
    .action(async (projectId) => {
    console.log(chalk_1.default.yellow(`Fetching tasks for project ${projectId}...`));
    try {
        const response = await api_1.apiClient.get(`/tasks?project=${projectId}`);
        const tasks = response.data;
        if (tasks.length === 0) {
            console.log(chalk_1.default.gray('No tasks found.'));
            return;
        }
        console.log(chalk_1.default.green(`Found ${tasks.length} tasks:\n`));
        tasks.forEach((t) => {
            const status = chalk_1.default.yellow(`[${t.status_extra_info?.name || 'Unknown'}]`);
            console.log(`- ${chalk_1.default.blue(t.subject)} (ID: ${t.id}) ${status}`);
            if (t.user_story_extra_info) {
                console.log(`  Story: ${chalk_1.default.gray(t.user_story_extra_info.subject)}`);
            }
        });
    }
    catch (error) {
        console.error(chalk_1.default.red('Failed to fetch tasks.'));
        if (error.response) {
            console.error(chalk_1.default.red(`Error ${error.response.status}: ${JSON.stringify(error.response.data)}`));
        }
        else {
            console.error(chalk_1.default.red(error.message));
        }
        process.exit(1);
    }
});

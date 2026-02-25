"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.storyCommand = void 0;
const commander_1 = require("commander");
const chalk_1 = __importDefault(require("chalk"));
const api_1 = require("../api");
exports.storyCommand = new commander_1.Command('story')
    .description('Manage Taiga user stories');
exports.storyCommand
    .command('list <projectId>')
    .description('List user stories for a project')
    .action(async (projectId) => {
    console.log(chalk_1.default.yellow(`Fetching user stories for project ${projectId}...`));
    try {
        const response = await api_1.apiClient.get(`/userstories?project=${projectId}`);
        const stories = response.data;
        if (stories.length === 0) {
            console.log(chalk_1.default.gray('No user stories found.'));
            return;
        }
        console.log(chalk_1.default.green(`Found ${stories.length} user stories:\n`));
        stories.forEach((s) => {
            const status = chalk_1.default.yellow(`[${s.status_extra_info?.name || 'Unknown'}]`);
            console.log(`- ${chalk_1.default.blue(s.subject)} (ID: ${s.id}) ${status}`);
        });
    }
    catch (error) {
        console.error(chalk_1.default.red('Failed to fetch user stories.'));
        if (error.response) {
            console.error(chalk_1.default.red(`Error ${error.response.status}: ${JSON.stringify(error.response.data)}`));
        }
        else {
            console.error(chalk_1.default.red(error.message));
        }
        process.exit(1);
    }
});

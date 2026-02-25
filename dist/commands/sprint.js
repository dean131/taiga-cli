"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sprintCommand = void 0;
const commander_1 = require("commander");
const chalk_1 = __importDefault(require("chalk"));
const api_1 = require("../api");
exports.sprintCommand = new commander_1.Command('sprint')
    .description('Manage Taiga sprints (milestones)');
exports.sprintCommand
    .command('list <projectId>')
    .description('List sprints for a project')
    .action(async (projectId) => {
    console.log(chalk_1.default.yellow(`Fetching sprints for project ${projectId}...`));
    try {
        const response = await api_1.apiClient.get(`/milestones?project=${projectId}`);
        const sprints = response.data;
        if (sprints.length === 0) {
            console.log(chalk_1.default.gray('No sprints found.'));
            return;
        }
        console.log(chalk_1.default.green(`Found ${sprints.length} sprints:\n`));
        sprints.forEach((s) => {
            const status = s.closed ? chalk_1.default.red('[Closed]') : chalk_1.default.green('[Active]');
            console.log(`- ${chalk_1.default.blue(s.name)} (ID: ${s.id}) ${status}`);
            console.log(`  Dates: ${s.estimated_start} to ${s.estimated_finish}`);
            console.log('');
        });
    }
    catch (error) {
        console.error(chalk_1.default.red('Failed to fetch sprints.'));
        if (error.response) {
            console.error(chalk_1.default.red(`Error ${error.response.status}: ${JSON.stringify(error.response.data)}`));
        }
        else {
            console.error(chalk_1.default.red(error.message));
        }
        process.exit(1);
    }
});

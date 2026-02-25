import { Command } from 'commander';
import chalk from 'chalk';
import { apiClient } from '../api';

export const taskCommand = new Command('task')
    .description('Manage Taiga tasks');

taskCommand
    .command('list <projectId>')
    .description('List tasks for a project')
    .action(async (projectId) => {
        console.log(chalk.yellow(`Fetching tasks for project ${projectId}...`));
        try {
            const response = await apiClient.get(`/tasks?project=${projectId}`);
            const tasks = response.data;
            if (tasks.length === 0) {
                console.log(chalk.gray('No tasks found.'));
                return;
            }

            console.log(chalk.green(`Found ${tasks.length} tasks:\n`));
            tasks.forEach((t: any) => {
                const status = chalk.yellow(`[${t.status_extra_info?.name || 'Unknown'}]`);
                console.log(`- ${chalk.blue(t.subject)} (ID: ${t.id}) ${status}`);
                if (t.user_story_extra_info) {
                    console.log(`  Story: ${chalk.gray(t.user_story_extra_info.subject)}`);
                }
            });
        } catch (error: any) {
            console.error(chalk.red('Failed to fetch tasks.'));
            if (error.response) {
                console.error(chalk.red(`Error ${error.response.status}: ${JSON.stringify(error.response.data)}`));
            } else {
                console.error(chalk.red(error.message));
            }
            process.exit(1);
        }
    });

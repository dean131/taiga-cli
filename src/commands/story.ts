import { Command } from 'commander';
import chalk from 'chalk';
import { apiClient } from '../api';

export const storyCommand = new Command('story')
    .description('Manage Taiga user stories');

storyCommand
    .command('list <projectId>')
    .description('List user stories for a project')
    .action(async (projectId) => {
        console.log(chalk.yellow(`Fetching user stories for project ${projectId}...`));
        try {
            const response = await apiClient.get(`/userstories?project=${projectId}`);
            const stories = response.data;
            if (stories.length === 0) {
                console.log(chalk.gray('No user stories found.'));
                return;
            }

            console.log(chalk.green(`Found ${stories.length} user stories:\n`));
            stories.forEach((s: any) => {
                const status = chalk.yellow(`[${s.status_extra_info?.name || 'Unknown'}]`);
                console.log(`- ${chalk.blue(s.subject)} (ID: ${s.id}) ${status}`);
            });
        } catch (error: any) {
            console.error(chalk.red('Failed to fetch user stories.'));
            if (error.response) {
                console.error(chalk.red(`Error ${error.response.status}: ${JSON.stringify(error.response.data)}`));
            } else {
                console.error(chalk.red(error.message));
            }
            process.exit(1);
        }
    });

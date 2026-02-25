import { Command } from 'commander';
import chalk from 'chalk';
import { apiClient } from '../api';

export const sprintCommand = new Command('sprint')
    .description('Manage Taiga sprints (milestones)');

sprintCommand
    .command('list <projectId>')
    .description('List sprints for a project')
    .action(async (projectId) => {
        console.log(chalk.yellow(`Fetching sprints for project ${projectId}...`));
        try {
            const response = await apiClient.get(`/milestones?project=${projectId}`);
            const sprints = response.data;
            if (sprints.length === 0) {
                console.log(chalk.gray('No sprints found.'));
                return;
            }

            console.log(chalk.green(`Found ${sprints.length} sprints:\n`));
            sprints.forEach((s: any) => {
                const status = s.closed ? chalk.red('[Closed]') : chalk.green('[Active]');
                console.log(`- ${chalk.blue(s.name)} (ID: ${s.id}) ${status}`);
                console.log(`  Dates: ${s.estimated_start} to ${s.estimated_finish}`);
                console.log('');
            });
        } catch (error: any) {
            console.error(chalk.red('Failed to fetch sprints.'));
            if (error.response) {
                console.error(chalk.red(`Error ${error.response.status}: ${JSON.stringify(error.response.data)}`));
            } else {
                console.error(chalk.red(error.message));
            }
            process.exit(1);
        }
    });

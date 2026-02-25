import { Command } from 'commander';
import chalk from 'chalk';
import { apiClient, getAuthToken } from '../api';

export const projectCommand = new Command('project')
    .description('Manage Taiga projects');

projectCommand
    .command('list')
    .description('List your projects')
    .action(async () => {
        let { memberId } = getAuthToken();

        // If not logged in, but .env credentials exist, we will try to make the request anyway 
        // to let the interceptor auto-login. But to list projects, we need a memberId.
        if (!memberId && process.env.TAIGA_USERNAME && process.env.TAIGA_PASSWORD) {
            console.log(chalk.gray('Auto-logging in using .env credentials...'));
            // Trigger a dummy auth request just to populate the token and memberId
            try {
                const { getBaseUrl, saveAuthToken } = await import('../api');
                const axios = (await import('axios')).default;

                const https = (await import('https')).default;
                const response = await axios.post(`${getBaseUrl()}/auth`, {
                    type: 'normal',
                    username: process.env.TAIGA_USERNAME,
                    password: process.env.TAIGA_PASSWORD,
                }, {
                    httpsAgent: new https.Agent({ family: 4 })
                });
                memberId = response.data.id;
                const token = response.data.auth_token;
                if (token && memberId !== undefined) {
                    saveAuthToken(token, memberId);
                }
            } catch (error: any) {
                console.error(chalk.red('Auto-login failed.'), error);
            }
        }

        if (!memberId) {
            console.error(chalk.red('You must be logged in to list projects. Use `taiga login` first or set TAIGA_USERNAME/TAIGA_PASSWORD in .env.'));
            process.exit(1);
        }

        console.log(chalk.yellow('Fetching projects...'));
        try {
            const response = await apiClient.get(`/projects?member=${memberId}`);

            const projects = response.data;
            if (projects.length === 0) {
                console.log(chalk.gray('No projects found.'));
                return;
            }

            console.log(chalk.green(`Found ${projects.length} projects:\n`));
            projects.forEach((p: any) => {
                console.log(`- ${chalk.blue(p.name)} (ID: ${p.id})`);
                console.log(`  Description: ${chalk.gray(p.description)}`);
                console.log('');
            });

        } catch (error: any) {
            console.error(chalk.red('Failed to fetch projects.'));
            if (error.response) {
                console.error(chalk.red(`Error ${error.response.status}: ${JSON.stringify(error.response.data)}`));
            } else {
                console.error(chalk.red(error.message));
            }
            process.exit(1);
        }
    });

projectCommand
    .command('info <projectId>')
    .description('Get details for a specific project')
    .action(async (projectId) => {
        try {
            console.log(chalk.yellow(`Fetching project ${projectId}...`));
            const response = await apiClient.get(`/projects/${projectId}`);

            const p = response.data;
            console.log(chalk.green(`\nProject: ${p.name}`));
            console.log(chalk.blue(`Slug: ${p.slug}`));
            console.log(`Total active user stories: ${p.total_activity_last_year}`);
            console.log(`Members: ${p.members.length}`);
        } catch (error: any) {
            console.error(chalk.red(`Failed to fetch project ${projectId}.`));
            process.exit(1);
        }
    });

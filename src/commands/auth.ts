import { Command } from 'commander';
import chalk from 'chalk';
import { apiClient, saveAuthToken } from '../api';

export const loginCommand = new Command('login')
    .description('Log into the Taiga API')
    .requiredOption('-u, --username <username>', 'Taiga username or email')
    .requiredOption('-p, --password <password>', 'Taiga password')
    .action(async (options) => {
        console.log(chalk.yellow('Logging in...'));
        try {
            const response = await apiClient.post('/auth', {
                type: 'normal',
                username: options.username,
                password: options.password,
            });

            const token = response.data.auth_token;
            const memberId = response.data.id;

            saveAuthToken(token, memberId);
            console.log(chalk.green('Successfully logged in!'));
            console.log(chalk.gray(`User ID: ${memberId}`));
        } catch (error: any) {
            console.error(chalk.red('Login failed.'));
            if (error.response) {
                console.error(chalk.red(`Error ${error.response.status}: ${JSON.stringify(error.response.data)}`));
            } else {
                console.error(chalk.red(error.message));
            }
            process.exit(1);
        }
    });

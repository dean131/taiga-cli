"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginCommand = void 0;
const commander_1 = require("commander");
const chalk_1 = __importDefault(require("chalk"));
const api_1 = require("../api");
exports.loginCommand = new commander_1.Command('login')
    .description('Log into the Taiga API')
    .requiredOption('-u, --username <username>', 'Taiga username or email')
    .requiredOption('-p, --password <password>', 'Taiga password')
    .action(async (options) => {
    console.log(chalk_1.default.yellow('Logging in...'));
    try {
        const response = await api_1.apiClient.post('/auth', {
            type: 'normal',
            username: options.username,
            password: options.password,
        });
        const token = response.data.auth_token;
        const memberId = response.data.id;
        (0, api_1.saveAuthToken)(token, memberId);
        console.log(chalk_1.default.green('Successfully logged in!'));
        console.log(chalk_1.default.gray(`User ID: ${memberId}`));
    }
    catch (error) {
        console.error(chalk_1.default.red('Login failed.'));
        if (error.response) {
            console.error(chalk_1.default.red(`Error ${error.response.status}: ${JSON.stringify(error.response.data)}`));
        }
        else {
            console.error(chalk_1.default.red(error.message));
        }
        process.exit(1);
    }
});

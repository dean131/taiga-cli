"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.projectCommand = void 0;
const commander_1 = require("commander");
const chalk_1 = __importDefault(require("chalk"));
const api_1 = require("../api");
exports.projectCommand = new commander_1.Command('project')
    .description('Manage Taiga projects');
exports.projectCommand
    .command('list')
    .description('List your projects')
    .action(async () => {
    let { memberId } = (0, api_1.getAuthToken)();
    // If not logged in, but .env credentials exist, we will try to make the request anyway 
    // to let the interceptor auto-login. But to list projects, we need a memberId.
    if (!memberId && process.env.TAIGA_USERNAME && process.env.TAIGA_PASSWORD) {
        console.log(chalk_1.default.gray('Auto-logging in using .env credentials...'));
        // Trigger a dummy auth request just to populate the token and memberId
        try {
            const { getBaseUrl, saveAuthToken } = await Promise.resolve().then(() => __importStar(require('../api')));
            const axios = (await Promise.resolve().then(() => __importStar(require('axios')))).default;
            const https = (await Promise.resolve().then(() => __importStar(require('https')))).default;
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
        }
        catch (error) {
            console.error(chalk_1.default.red('Auto-login failed.'), error);
        }
    }
    if (!memberId) {
        console.error(chalk_1.default.red('You must be logged in to list projects. Use `taiga login` first or set TAIGA_USERNAME/TAIGA_PASSWORD in .env.'));
        process.exit(1);
    }
    console.log(chalk_1.default.yellow('Fetching projects...'));
    try {
        const response = await api_1.apiClient.get(`/projects?member=${memberId}`);
        const projects = response.data;
        if (projects.length === 0) {
            console.log(chalk_1.default.gray('No projects found.'));
            return;
        }
        console.log(chalk_1.default.green(`Found ${projects.length} projects:\n`));
        projects.forEach((p) => {
            console.log(`- ${chalk_1.default.blue(p.name)} (ID: ${p.id})`);
            console.log(`  Description: ${chalk_1.default.gray(p.description)}`);
            console.log('');
        });
    }
    catch (error) {
        console.error(chalk_1.default.red('Failed to fetch projects.'));
        if (error.response) {
            console.error(chalk_1.default.red(`Error ${error.response.status}: ${JSON.stringify(error.response.data)}`));
        }
        else {
            console.error(chalk_1.default.red(error.message));
        }
        process.exit(1);
    }
});
exports.projectCommand
    .command('info <projectId>')
    .description('Get details for a specific project')
    .action(async (projectId) => {
    try {
        console.log(chalk_1.default.yellow(`Fetching project ${projectId}...`));
        const response = await api_1.apiClient.get(`/projects/${projectId}`);
        const p = response.data;
        console.log(chalk_1.default.green(`\nProject: ${p.name}`));
        console.log(chalk_1.default.blue(`Slug: ${p.slug}`));
        console.log(`Total active user stories: ${p.total_activity_last_year}`);
        console.log(`Members: ${p.members.length}`);
    }
    catch (error) {
        console.error(chalk_1.default.red(`Failed to fetch project ${projectId}.`));
        process.exit(1);
    }
});

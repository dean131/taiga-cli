#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import * as dotenv from 'dotenv';
import { loginCommand } from './commands/auth';
import { projectCommand } from './commands/project';
import { storyCommand } from './commands/story';
import { taskCommand } from './commands/task';
import { sprintCommand } from './commands/sprint';

// Load environment variables from .env file
dotenv.config();

const program = new Command();

program
  .name('taiga')
  .description(chalk.blue('CLI to interact with Taiga Project Management API'))
  .version('1.0.0');

// Register commands
program.addCommand(loginCommand);
program.addCommand(projectCommand);
program.addCommand(storyCommand);
program.addCommand(taskCommand);
program.addCommand(sprintCommand);

program.parse(process.argv);

import axios from 'axios';
import fs from 'fs';
import path from 'path';
import os from 'os';

const CONFIG_PATH = path.join(os.homedir(), '.taiga-cli.json');

export const getBaseUrl = (): string => {
    return process.env.TAIGA_URL || 'https://api.taiga.io/api/v1';
};

export const saveAuthToken = (token: string, memberId: number) => {
    fs.writeFileSync(CONFIG_PATH, JSON.stringify({ token, memberId }, null, 2));
};

export const getAuthToken = (): { token?: string; memberId?: number } => {
    if (fs.existsSync(CONFIG_PATH)) {
        return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
    }
    return {};
};

export const clearAuthToken = () => {
    if (fs.existsSync(CONFIG_PATH)) {
        fs.unlinkSync(CONFIG_PATH);
    }
};

import https from 'https';

export const apiClient = axios.create({
    baseURL: getBaseUrl(),
    headers: {
        'Content-Type': 'application/json',
    },
    // Fix node socket timeout when IPv6 is unroutable
    httpsAgent: new https.Agent({ family: 4 })
});

apiClient.interceptors.request.use(async (config) => {
    let { token, memberId } = getAuthToken();

    // Auto-login using environment variables if no valid token exists and credentials are provided
    if (!token && process.env.TAIGA_USERNAME && process.env.TAIGA_PASSWORD && config.url !== '/auth') {
        try {
            const response = await axios.post(`${getBaseUrl()}/auth`, {
                type: 'normal',
                username: process.env.TAIGA_USERNAME,
                password: process.env.TAIGA_PASSWORD,
            }, {
                httpsAgent: new https.Agent({ family: 4 })
            });
            token = response.data.auth_token;
            memberId = response.data.id;
            if (token && memberId !== undefined) {
                saveAuthToken(token, memberId);
            }
        } catch (error) {
            console.error('\nAuto-login failed using credentials from .env. Please check your username and password.');
        }
    }

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            clearAuthToken();
            console.error('\nYour Taiga session has expired (or is invalid). Local token cleared.');
            console.error('Please run the command again to re-authenticate.');
        }
        return Promise.reject(error);
    }
);

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.apiClient = exports.clearAuthToken = exports.getAuthToken = exports.saveAuthToken = exports.getBaseUrl = void 0;
const axios_1 = __importDefault(require("axios"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const os_1 = __importDefault(require("os"));
const CONFIG_PATH = path_1.default.join(os_1.default.homedir(), '.taiga-cli.json');
const getBaseUrl = () => {
    return process.env.TAIGA_URL || 'https://api.taiga.io/api/v1';
};
exports.getBaseUrl = getBaseUrl;
const saveAuthToken = (token, memberId) => {
    fs_1.default.writeFileSync(CONFIG_PATH, JSON.stringify({ token, memberId }, null, 2));
};
exports.saveAuthToken = saveAuthToken;
const getAuthToken = () => {
    if (fs_1.default.existsSync(CONFIG_PATH)) {
        return JSON.parse(fs_1.default.readFileSync(CONFIG_PATH, 'utf-8'));
    }
    return {};
};
exports.getAuthToken = getAuthToken;
const clearAuthToken = () => {
    if (fs_1.default.existsSync(CONFIG_PATH)) {
        fs_1.default.unlinkSync(CONFIG_PATH);
    }
};
exports.clearAuthToken = clearAuthToken;
const https_1 = __importDefault(require("https"));
exports.apiClient = axios_1.default.create({
    baseURL: (0, exports.getBaseUrl)(),
    headers: {
        'Content-Type': 'application/json',
    },
    // Fix node socket timeout when IPv6 is unroutable
    httpsAgent: new https_1.default.Agent({ family: 4 })
});
exports.apiClient.interceptors.request.use(async (config) => {
    let { token, memberId } = (0, exports.getAuthToken)();
    // Auto-login using environment variables if no valid token exists and credentials are provided
    if (!token && process.env.TAIGA_USERNAME && process.env.TAIGA_PASSWORD && config.url !== '/auth') {
        try {
            const response = await axios_1.default.post(`${(0, exports.getBaseUrl)()}/auth`, {
                type: 'normal',
                username: process.env.TAIGA_USERNAME,
                password: process.env.TAIGA_PASSWORD,
            }, {
                httpsAgent: new https_1.default.Agent({ family: 4 })
            });
            token = response.data.auth_token;
            memberId = response.data.id;
            if (token && memberId !== undefined) {
                (0, exports.saveAuthToken)(token, memberId);
            }
        }
        catch (error) {
            console.error('\nAuto-login failed using credentials from .env. Please check your username and password.');
        }
    }
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});
exports.apiClient.interceptors.response.use((response) => response, (error) => {
    if (error.response && error.response.status === 401) {
        (0, exports.clearAuthToken)();
        console.error('\nYour Taiga session has expired (or is invalid). Local token cleared.');
        console.error('Please run the command again to re-authenticate.');
    }
    return Promise.reject(error);
});

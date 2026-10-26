import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';

// Luôn nạp apps/api/.env, kể cả khi lệnh chạy từ monorepo root bằng npm workspaces.
const localEnvFile = fileURLToPath(new URL('../.env', import.meta.url));
dotenv.config({ path: localEnvFile });

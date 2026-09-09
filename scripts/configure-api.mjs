import { writeFile } from 'node:fs/promises';
import path from 'node:path';

const value = process.env.APP_API_URL?.trim();

if (!value) {
  throw new Error('APP_API_URL is required. Use the public HTTPS URL of the ONE-TO-ALL backend.');
}

const url = new URL(value);
if (url.protocol !== 'https:') {
  throw new Error('APP_API_URL must use HTTPS for production Android builds.');
}

const apiUrl = url.toString().replace(/\/$/, '');
const target = path.join(process.cwd(), 'public', 'config.js');
await writeFile(target, `window.ONE_TO_ALL_API_URL = ${JSON.stringify(apiUrl)};\n`, 'utf8');

console.log(`Configured Android API origin: ${url.origin}`);

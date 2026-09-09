import fs from 'node:fs';
import path from 'node:path';

const PRODUCTION_APP_ID = 'ca-app-pub-7097244683285445~4506030214';
const TEST_APP_ID = 'ca-app-pub-3940256099942544~3347511713';
const appId = process.env.ADMOB_APP_ID || PRODUCTION_APP_ID;

if (!/^ca-app-pub-\d{16}~\d{10}$/.test(appId)) {
  throw new Error('ADMOB_APP_ID must be a valid AdMob application ID.');
}

const androidRoot = path.resolve('android', 'app', 'src');
const manifestPath = path.join(androidRoot, 'main', 'AndroidManifest.xml');
const stringsPath = path.join(androidRoot, 'main', 'res', 'values', 'strings.xml');

if (!fs.existsSync(manifestPath) || !fs.existsSync(stringsPath)) {
  throw new Error('Android project is missing. Run `npx cap add android` first.');
}

let manifest = fs.readFileSync(manifestPath, 'utf8');
const metadata = [
  '        <meta-data',
  '            android:name="com.google.android.gms.ads.APPLICATION_ID"',
  '            android:value="@string/admob_app_id" />',
].join('\n');

if (/android:name="com\.google\.android\.gms\.ads\.APPLICATION_ID"/.test(manifest)) {
  manifest = manifest.replace(
    /\s*<meta-data\s+android:name="com\.google\.android\.gms\.ads\.APPLICATION_ID"[\s\S]*?\/>/,
    `\n${metadata}`,
  );
} else {
  manifest = manifest.replace(/\s*<\/application>/, `\n${metadata}\n    </application>`);
}
fs.writeFileSync(manifestPath, manifest);

let strings = fs.readFileSync(stringsPath, 'utf8');
const appIdResource = `    <string name="admob_app_id">${appId}</string>`;
if (/<string name="admob_app_id">.*?<\/string>/.test(strings)) {
  strings = strings.replace(/\s*<string name="admob_app_id">.*?<\/string>/, `\n${appIdResource}`);
} else {
  strings = strings.replace(/\s*<\/resources>/, `\n${appIdResource}\n</resources>`);
}
fs.writeFileSync(stringsPath, strings);

const debugValues = path.join(androidRoot, 'debug', 'res', 'values');
fs.mkdirSync(debugValues, { recursive: true });
fs.writeFileSync(
  path.join(debugValues, 'admob.xml'),
  `<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <string name="admob_app_id">${TEST_APP_ID}</string>\n</resources>\n`,
);

console.log(`Configured AdMob application ID ${appId} (Google test app ID for debug builds).`);

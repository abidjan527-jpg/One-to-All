import fs from 'node:fs';

const PRODUCTION_BANNER_ID = 'ca-app-pub-7097244683285445/2333388943';
const TEST_BANNER_ID = 'ca-app-pub-3940256099942544/6300978111';
const TEST_INTERSTITIAL_ID = 'ca-app-pub-3940256099942544/1033173712';
const mode = process.argv[2] || 'debug';

if (!['debug', 'release'].includes(mode)) {
  throw new Error('Build mode must be either debug or release.');
}

const testing = mode !== 'release';
const bannerId = testing ? TEST_BANNER_ID : PRODUCTION_BANNER_ID;
const interstitialId = testing ? TEST_INTERSTITIAL_ID : (process.env.ADMOB_INTERSTITIAL_ID || '');

if (interstitialId && !/^ca-app-pub-\d{16}\/\d{10}$/.test(interstitialId)) {
  throw new Error('ADMOB_INTERSTITIAL_ID must be a valid AdMob ad-unit ID.');
}

const config = [
  `window.ONE_TO_ALL_API_URL = ${JSON.stringify(process.env.APP_API_URL || '')};`,
  `window.ONE_TO_ALL_ADMOB_BANNER_ID = ${JSON.stringify(bannerId)};`,
  `window.ONE_TO_ALL_ADMOB_INTERSTITIAL_ID = ${JSON.stringify(interstitialId)};`,
  `window.ONE_TO_ALL_ADMOB_TESTING = ${JSON.stringify(testing)};`,
  '',
].join('\n');

fs.writeFileSync('public/config.js', config);
console.log(`Wrote ${mode} mobile configuration.`);

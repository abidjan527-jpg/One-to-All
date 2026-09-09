# AI ONE-TO-ALL — store release pack

Package ID: `com.abidjan527.aionetoall`

AdMob application ID: `ca-app-pub-7097244683285445~4506030214`

AdMob banner unit: `ca-app-pub-7097244683285445/2333388943`

## Build outputs

Run the **Android packages** GitHub Actions workflow.

- Test build: `app-debug.apk`
- Store build with signing secrets: `app-release.apk` and `app-release.aab`

Set the repository variable `APP_API_URL` to the public HTTPS address of the deployed AI ONE-TO-ALL backend before building. The app will not produce AI answers without that server and at least one provider API key.

Debug APKs always use Google's test app and ad-unit IDs. Signed release builds use the production AdMob app ID and banner unit above. To enable production interstitials, create a separate Android interstitial ad unit in AdMob and save its ID as the repository variable `ADMOB_INTERSTITIAL_ID`; the banner ID must not be reused for that format.

Publish `public/app-ads.txt` at the root of the developer website entered in the store listing. The file already contains the authorized Google seller record for publisher `pub-7097244683285445`.

For signed packages, create an upload keystore and save it only as these GitHub Actions secrets:

- `ANDROID_KEYSTORE_BASE64`
- `ANDROID_KEYSTORE_PASSWORD`
- `ANDROID_KEY_ALIAS`
- `ANDROID_KEY_PASSWORD`

Never commit a keystore or API key.

## Store listing

**Name:** AI ONE-TO-ALL  
**Short description:** Ask once. Compare leading AI answers side by side.  
**Category:** Productivity  
**Price:** Free  
**Support language:** English  
**Privacy URL:** `https://YOUR-DOMAIN/privacy.html`

### Full description

AI ONE-TO-ALL turns one question into multiple AI perspectives. Select the available models, send one prompt, and compare their answers in a clean side-by-side workspace.

Highlights:

- Compare multiple AI answers at once
- Continue conversations with local on-device history
- Installable, fast interface for phones and desktops
- Clear provider status and error handling
- Privacy controls to clear saved conversations
- Offline access to the application shell

AI output can be inaccurate. Verify important medical, legal, financial, or safety-related information with a qualified professional.

## Submission order

1. Deploy the backend over HTTPS and set its provider API keys.
2. Set `APP_API_URL` and create the signed APK/AAB workflow artifacts.
3. Verify the consent form and Google test banner in the debug APK.
4. Test the release APK on Samsung, Xiaomi, and Huawei devices.
5. Register the app in each developer console and add the listing, screenshots, privacy URL, developer website, support email, content rating, and data-safety answers.
6. Upload AAB to Samsung Galaxy Store. Upload the signed APK where requested by Huawei AppGallery and Xiaomi GetApps.
7. Use closed/beta testing first, then submit for review.

Do not claim that the app is available in a store until that store approves it.

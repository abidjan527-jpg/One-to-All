(function () {
  const TEST_BANNER_ID = 'ca-app-pub-3940256099942544/6300978111';
  const testing = window.ONE_TO_ALL_ADMOB_TESTING !== false;
  const bannerId = window.ONE_TO_ALL_ADMOB_BANNER_ID || (testing ? TEST_BANNER_ID : '');
  const interstitialId = window.ONE_TO_ALL_ADMOB_INTERSTITIAL_ID || '';
  let admob;
  let initialized = false;
  let interstitialReady = false;
  let completedAnswers = 0;

  function isNativeApp() {
    const capacitor = window.Capacitor;
    if (!capacitor) return false;
    if (typeof capacitor.isNativePlatform === 'function') return capacitor.isNativePlatform();
    return typeof capacitor.getPlatform === 'function' && capacitor.getPlatform() !== 'web';
  }

  async function prepareInterstitial() {
    if (!interstitialId || !admob || interstitialReady) return;
    try {
      await admob.prepareInterstitial({ adId: interstitialId, isTesting: testing });
      interstitialReady = true;
    } catch (error) {
      console.warn('AdMob interstitial could not be prepared.', error);
    }
  }

  async function start() {
    if (!isNativeApp() || initialized || !bannerId) return;
    admob = window.Capacitor?.Plugins?.AdMob;
    if (!admob) {
      console.warn('AdMob native plugin is unavailable.');
      return;
    }

    initialized = true;
    try {
      await admob.initialize({ initializeForTesting: testing, maxAdContentRating: 'Teen' });
      let consentInfo = await admob.requestConsentInfo({ tagForUnderAgeOfConsent: false });
      if (consentInfo?.isConsentFormAvailable && consentInfo.canRequestAds === false) {
        consentInfo = await admob.showConsentForm();
      }
      if (consentInfo?.canRequestAds === false) return;

      await admob.addListener('bannerAdSizeChanged', (size) => {
        const height = Number(size?.height || 60);
        document.documentElement.style.setProperty('--admob-height', `${height}px`);
        document.documentElement.classList.add('native-admob-banner');
      });
      await admob.addListener('bannerAdFailedToLoad', (error) => {
        document.documentElement.classList.remove('native-admob-banner');
        console.warn('AdMob banner could not be loaded.', error);
      });
      await admob.showBanner({
        adId: bannerId,
        adSize: 'ADAPTIVE_BANNER',
        position: 'BOTTOM_CENTER',
        margin: 0,
        isTesting: testing,
      });
      await prepareInterstitial();
    } catch (error) {
      initialized = false;
      console.warn('AdMob initialization failed.', error);
    }
  }

  async function showInterstitialAtBreak() {
    if (!interstitialId || completedAnswers < 3 || !interstitialReady || !admob) return;
    completedAnswers = 0;
    interstitialReady = false;
    try {
      await admob.showInterstitial();
    } catch (error) {
      console.warn('AdMob interstitial could not be shown.', error);
    } finally {
      await prepareInterstitial();
    }
  }

  window.OneToAllAds = {
    recordCompletedAnswer() {
      completedAnswers += 1;
    },
    showInterstitialAtBreak,
    async showPrivacyOptions() {
      if (admob) await admob.showPrivacyOptionsForm();
    },
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
}());

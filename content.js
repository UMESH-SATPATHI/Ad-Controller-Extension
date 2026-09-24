
(() => {
  if (window.__adVolumeControllerLoaded) return;
  window.__adVolumeControllerLoaded = true;

  let adWasShowing = false;
  let savedVolume = 1;
  let savedMuted = false;
  let originalVideo = null;

  let skipAttempts = 0;
  let lastSkipAttempt = 0;
  let lastSkipButton = null;

  const CHECK_INTERVAL = 300;
  const SKIP_RETRY_DELAY = 1200;
  const MAX_SKIP_ATTEMPTS = 5;

  const getPlayer = () =>
    document.querySelector("#movie_player");

  const getVideo = () =>
    getPlayer()?.querySelector("video") ?? null;

  const getVideos = () =>
    getPlayer()?.querySelectorAll("video") ?? [];

  const isAdShowing = () => {
    const player = getPlayer();

    return Boolean(
      player &&
      (
        player.classList.contains("ad-showing") ||
        player.classList.contains("ad-interrupting")
      )
    );
  };

  const findSkipButton = () => {
    const player = getPlayer();

    if (!player) return null;

    const selectors = [
      "button.ytp-skip-ad-button",
      "button.ytp-ad-skip-button-modern",
      "button.ytp-ad-skip-button",
      ".ytp-ad-skip-button-slot button",
      "#skip-button-2"
    ];

    for (const selector of selectors) {
      for (const button of player.querySelectorAll(selector)) {
        if (button.tagName !== "BUTTON") continue;

        const style = getComputedStyle(button);
        const rect = button.getBoundingClientRect();

        const visible =
          button.isConnected &&
          rect.width > 0 &&
          rect.height > 0 &&
          style.display !== "none" &&
          style.visibility !== "hidden" &&
          Number(style.opacity) > 0 &&
          style.pointerEvents !== "none";

        const enabled =
          !button.disabled &&
          button.getAttribute("aria-disabled") !== "true";

        if (visible && enabled) return button;
      }
    }

    return null;
  };

  const startAd = () => {
    const video = getVideo();

    if (!video) return;

    if (!adWasShowing) {
      savedVolume = video.volume;
      savedMuted = video.muted;
      originalVideo = video;

      adWasShowing = true;
      skipAttempts = 0;
      lastSkipAttempt = 0;
      lastSkipButton = null;

      console.log("[AVC] Advertisement detected.");
    }

    getVideos().forEach(currentVideo => {
      currentVideo.muted = true;
    });
  };

  const attemptSkip = async button => {
    const rect = button.getBoundingClientRect();

    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;

    try {
      const result = await chrome.runtime.sendMessage({
        type: "AVC_SKIP_CLICK",
        x,
        y
      });

      if (result?.success) {
        console.log("[AVC] Mouse input dispatched.");
      } else {
        console.warn(
          "[AVC] Mouse input failed:",
          result?.error || "Unknown error"
        );
      }
    } catch (error) {
      console.warn("[AVC] Could not contact background worker:", error);
    }
  };

  const trySkipAd = () => {
    if (!isAdShowing()) return;

    const button = findSkipButton();

    if (!button) return;

    if (button !== lastSkipButton) {
      lastSkipButton = button;
      skipAttempts = 0;
      lastSkipAttempt = 0;

      console.log("[AVC] Visible skip control detected.");
    }

    if (skipAttempts >= MAX_SKIP_ATTEMPTS) return;

    const now = Date.now();

    if (now - lastSkipAttempt < SKIP_RETRY_DELAY) return;

    lastSkipAttempt = now;
    skipAttempts++;

    console.log(
      `[AVC] Mouse input attempt ${skipAttempts}/${MAX_SKIP_ATTEMPTS}.`
    );

    attemptSkip(button);
  };

  const finishAd = () => {
    if (!adWasShowing || isAdShowing()) return;

    if (originalVideo) {
      originalVideo.volume = savedVolume;
      originalVideo.muted = savedMuted;
    }

    getVideos().forEach(video => {
      video.volume = savedVolume;
      video.muted = savedMuted;
    });

    adWasShowing = false;
    originalVideo = null;

    skipAttempts = 0;
    lastSkipAttempt = 0;
    lastSkipButton = null;

    console.log("[AVC] Ad ended. Audio restored.");
  };

  const checkAdState = () => {
    if (isAdShowing()) {
      startAd();
      trySkipAd();
    } else {
      finishAd();
    }
  };

  const playerObserver = new MutationObserver(checkAdState);

  const observePlayer = () => {
    const player = getPlayer();

    if (!player) return;

    playerObserver.disconnect();

    playerObserver.observe(player, {
      attributes: true,
      attributeFilter: ["class"],
      childList: true,
      subtree: true
    });

    checkAdState();
  };
  const pageObserver = new MutationObserver(observePlayer);

  pageObserver.observe(document.documentElement, {
    childList: true,
    subtree: true
  });

  observePlayer();

  setInterval(checkAdState, CHECK_INTERVAL);

  console.log("[AVC] Ad Volume Controller initialized.");
})();
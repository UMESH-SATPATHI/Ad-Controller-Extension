
const attachedTabs = new Set();

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type !== "AVC_SKIP_CLICK") return;

  const tabId = sender.tab?.id;
  const tabUrl = sender.tab?.url;

  if (
    tabId == null ||
    !tabUrl ||
    !tabUrl.startsWith("https://www.youtube.com/")
  ) {
    sendResponse({ success: false, error: "Invalid YouTube tab." });
    return;
  }

  const { x, y } = message;

  if (
    !Number.isFinite(x) ||
    !Number.isFinite(y) ||
    x < 0 ||
    y < 0
  ) {
    sendResponse({ success: false, error: "Invalid click coordinates." });
    return;
  }

  (async () => {
    const target = { tabId };
    let attachedHere = false;

    try {
      await chrome.debugger.attach(target, "1.3");
      attachedHere = true;
      attachedTabs.add(tabId);

      await chrome.debugger.sendCommand(target, "Input.dispatchMouseEvent", {
        type: "mouseMoved",
        x,
        y,
        button: "none"
      });

      await chrome.debugger.sendCommand(target, "Input.dispatchMouseEvent", {
        type: "mousePressed",
        x,
        y,
        button: "left",
        clickCount: 1
      });

      await chrome.debugger.sendCommand(target, "Input.dispatchMouseEvent", {
        type: "mouseReleased",
        x,
        y,
        button: "left",
        clickCount: 1
      });

      sendResponse({ success: true });
    } catch (error) {
      sendResponse({
        success: false,
        error: error?.message || "Debugger input failed."
      });
    } finally {
      if (attachedHere) {
        try {
          await chrome.debugger.detach(target);
        } catch (error) {
          console.warn("AVC debugger detach failed:", error);
        }

        attachedTabs.delete(tabId);
      }
    }
  })();

  return true;
});

chrome.debugger.onDetach.addListener(source => {
  if (source.tabId != null) {
    attachedTabs.delete(source.tabId);
  }
});
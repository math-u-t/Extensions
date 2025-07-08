chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.url) {
    const allowedDomains = [
      "scratch.mit.edu",
      "turbowarp.org",
      "wikipedia.org",
      "vscode.dev",
      "desmos.com",
      "wolframalpha.com",
      "mycompiler.io",
      "paiza.io",
      "bing.com",
      "microsoft.com",
      "chatgpt.com",
    ];

    const allowedExactHosts = [
      "www.google.com",               // 検索や翻訳など
      "colab.research.google.com",    // Google Colab
      "translate.google.com",
    ];

    const urlStr = changeInfo.url;

    if (
      urlStr.startsWith("chrome://") ||
      urlStr.startsWith("file://") ||
      urlStr.startsWith("about:") ||
      urlStr.startsWith("devtools://")
    ) {
      return;
    }

    try {
      const url = new URL(urlStr);
      const hostname = url.hostname;

      const isAllowed =
        allowedDomains.some(domain => hostname.endsWith(domain)) ||
        allowedExactHosts.includes(hostname);

      if (!isAllowed) {
        chrome.tabs.update(tabId, {
          url: chrome.runtime.getURL("blocked.html")
        });

        setTimeout(() => {
          chrome.tabs.get(tabId, (tab) => {
            if (chrome.runtime.lastError) {
              return;
            }
            chrome.tabs.remove(tabId);
          });
        }, 5000);
      }
    } catch (e) {
      // 無効なURLなど
    }
  }
});
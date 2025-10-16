// 通信ログの保存
const requestLog = new Map();

// 情報エントロピー計算用の定数（bits）
const ENTROPY_VALUES = {
  cookie: 15.0,
  authorization: 20.0,
  userAgent: 10.5,
  referer: 8.0,
  acceptLanguage: 6.8,
  customHeader: 12.0
};

// リクエスト監視
chrome.webRequest.onBeforeSendHeaders.addListener(
  (details) => {
    const { tabId, url, requestHeaders, method, type } = details;
    
    if (tabId < 0) return; // background request は無視
    
    const domain = new URL(url).hostname;
    const timestamp = Date.now();
    
    // ヘッダー解析
    const sensitiveHeaders = analyzeSensitiveHeaders(requestHeaders);
    const entropyScore = calculateEntropy(sensitiveHeaders);
    
    // ログに記録
    const logEntry = {
      url,
      domain,
      method,
      type,
      timestamp,
      sensitiveHeaders,
      entropyScore
    };
    
    // タブごとに保存
    if (!requestLog.has(tabId)) {
      requestLog.set(tabId, []);
    }
    requestLog.get(tabId).push(logEntry);
    
    // ストレージに永続化（最新100件まで）
    saveToStorage(tabId, logEntry);
    
    // バッジ更新（識別リスクレベル表示）
    updateBadge(tabId, entropyScore);
  },
  { urls: ["<all_urls>"] },
  ["requestHeaders"]
);

// センシティブヘッダーの検出
function analyzeSensitiveHeaders(headers) {
  const sensitive = [];
  
  for (const header of headers) {
    const name = header.name.toLowerCase();
    const value = header.value;
    
    // Cookie検出
    if (name === 'cookie') {
      const cookieCount = value.split(';').length;
      sensitive.push({
        type: 'cookie',
        name: 'Cookie',
        count: cookieCount,
        entropy: ENTROPY_VALUES.cookie * Math.log2(cookieCount + 1)
      });
    }
    
    // 認証トークン検出
    if (name === 'authorization') {
      sensitive.push({
        type: 'authorization',
        name: 'Authorization',
        entropy: ENTROPY_VALUES.authorization
      });
    }
    
    // User-Agent
    if (name === 'user-agent') {
      sensitive.push({
        type: 'userAgent',
        name: 'User-Agent',
        value: value.substring(0, 50) + '...',
        entropy: ENTROPY_VALUES.userAgent
      });
    }
    
    // Referer（トラッキング用途）
    if (name === 'referer') {
      sensitive.push({
        type: 'referer',
        name: 'Referer',
        entropy: ENTROPY_VALUES.referer
      });
    }
    
    // Accept-Language（地域識別）
    if (name === 'accept-language') {
      sensitive.push({
        type: 'acceptLanguage',
        name: 'Accept-Language',
        value: value,
        entropy: ENTROPY_VALUES.acceptLanguage
      });
    }
    
    // カスタムヘッダー（X-で始まる独自ヘッダー）
    if (name.startsWith('x-')) {
      sensitive.push({
        type: 'customHeader',
        name: header.name,
        entropy: ENTROPY_VALUES.customHeader
      });
    }
  }
  
  return sensitive;
}

// エントロピー合計計算（識別力の定量評価）
function calculateEntropy(sensitiveHeaders) {
  return sensitiveHeaders.reduce((sum, h) => sum + (h.entropy || 0), 0);
}

// ストレージへの保存
async function saveToStorage(tabId, logEntry) {
  try {
    const key = `log_${tabId}`;
    const result = await chrome.storage.local.get(key);
    const logs = result[key] || [];
    
    logs.push(logEntry);
    
    // 最新100件まで保持
    if (logs.length > 100) {
      logs.shift();
    }
    
    await chrome.storage.local.set({ [key]: logs });
  } catch (error) {
    console.error('Storage error:', error);
  }
}

// バッジ更新（リスクレベル表示）
function updateBadge(tabId, entropy) {
  let color = '#00FF00'; // 緑（低リスク）
  let text = 'L';
  
  if (entropy > 50) {
    color = '#FF0000'; // 赤（高リスク）
    text = 'H';
  } else if (entropy > 25) {
    color = '#FFA500'; // オレンジ（中リスク）
    text = 'M';
  }
  
  chrome.action.setBadgeText({ tabId, text });
  chrome.action.setBadgeBackgroundColor({ tabId, color });
}

// タブが閉じられたらログをクリア
chrome.tabs.onRemoved.addListener((tabId) => {
  requestLog.delete(tabId);
});

// メッセージハンドラ（popup/contentからの要求）
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'getLog') {
    const tabId = message.tabId;
    const logs = requestLog.get(tabId) || [];
    sendResponse({ logs });
  }
  
  if (message.action === 'getStoredLog') {
    chrome.storage.local.get(`log_${message.tabId}`).then(result => {
      sendResponse({ logs: result[`log_${message.tabId}`] || [] });
    });
    return true; // 非同期応答
  }
  
  if (message.action === 'clearLog') {
    requestLog.delete(message.tabId);
    chrome.storage.local.remove(`log_${message.tabId}`);
    sendResponse({ success: true });
  }
});
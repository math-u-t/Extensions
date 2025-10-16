// Popup UI ロジック

let currentTabId = null;

// 初期化
async function init() {
  // 現在のタブID取得
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  currentTabId = tab.id;
  
  // フィンガープリント情報読み込み
  loadFingerprint();
  
  // 通信ログ読み込み
  loadRequestLog();
  
  // クリアボタン
  document.getElementById('clearBtn').addEventListener('click', clearLog);
}

// フィンガープリント表示
async function loadFingerprint() {
  try {
    const data = await chrome.storage.local.get([
      'currentFingerprint',
      'currentEntropy',
      'currentUniqueness'
    ]);
    
    const fp = data.currentFingerprint || {};
    const entropy = data.currentEntropy || 0;
    const uniqueness = data.currentUniqueness || {};
    
    // エントロピースコア表示
    document.getElementById('totalEntropy').textContent = entropy.toFixed(1);
    
    // 一意性表示
    const uniquenessEl = document.getElementById('uniqueness');
    if (uniqueness.isUnique) {
      uniquenessEl.textContent = `あなたは ${uniqueness.uniquenessPercent}% 識別可能`;
      uniquenessEl.style.background = 'rgba(244, 67, 54, 0.3)';
      document.getElementById('warningBox').style.display = 'block';
    } else {
      uniquenessEl.textContent = `識別確率: ${uniqueness.uniquenessPercent}%`;
    }
    
    // フィンガープリント詳細表示
    const fpList = document.getElementById('fingerprintList');
    fpList.innerHTML = '';
    
    const displayItems = [
      { key: 'User Agent', value: fp.userAgent, entropy: 10.5 },
      { key: 'Screen', value: fp.screenResolution, entropy: 4.8 },
      { key: 'Timezone', value: fp.timezone, entropy: 3.4 },
      { key: 'Language', value: fp.language, entropy: 6.8 },
      { key: 'Canvas Hash', value: fp.canvasFingerprint, entropy: 5.7 },
      { key: 'WebGL', value: fp.webglRenderer, entropy: 4.5 },
      { key: 'CPU Cores', value: fp.hardwareConcurrency, entropy: 2.9 },
      { key: 'Color Depth', value: fp.colorDepth + ' bit', entropy: 1.5 }
    ];
    
    displayItems.forEach(item => {
      if (!item.value || item.value === 'undefined') return;
      
      const div = document.createElement('div');
      div.className = 'fingerprint-item';
      div.innerHTML = `
        <span class="fp-key">${item.key} (${item.entropy}b)</span>
        <span class="fp-value">${item.value}</span>
      `;
      fpList.appendChild(div);
    });
    
  } catch (error) {
    console.error('Failed to load fingerprint:', error);
  }
}

// 通信ログ表示
async function loadRequestLog() {
  try {
    // バックグラウンドからログ取得
    chrome.runtime.sendMessage(
      { action: 'getStoredLog', tabId: currentTabId },
      (response) => {
        if (!response || !response.logs) return;
        
        const logs = response.logs;
        const logContainer = document.getElementById('requestLog');
        logContainer.innerHTML = '';
        
        if (logs.length === 0) {
          logContainer.innerHTML = '<p style="color: #999; font-size: 13px;">通信ログなし</p>';
          return;
        }
        
        // ドメインごとに集計
        const domainMap = new Map();
        logs.forEach(log => {
          if (!domainMap.has(log.domain)) {
            domainMap.set(log.domain, {
              domain: log.domain,
              count: 0,
              totalEntropy: 0,
              sensitiveHeaders: new Set()
            });
          }
          
          const entry = domainMap.get(log.domain);
          entry.count++;
          entry.totalEntropy += log.entropyScore || 0;
          
          log.sensitiveHeaders.forEach(h => {
            entry.sensitiveHeaders.add(h.name);
          });
        });
        
        // エントロピー順にソート
        const sortedDomains = Array.from(domainMap.values())
          .sort((a, b) => b.totalEntropy - a.totalEntropy)
          .slice(0, 10); // 上位10件
        
        // 表示
        sortedDomains.forEach(entry => {
          const div = document.createElement('div');
          div.className = 'request-item';
          
          let entropyClass = 'entropy-low';
          if (entry.totalEntropy > 50) entropyClass = 'entropy-high';
          else if (entry.totalEntropy > 25) entropyClass = 'entropy-medium';
          
          div.innerHTML = `
            <div class="request-domain">${entry.domain}</div>
            <div>
              <span class="request-entropy ${entropyClass}">
                ${entry.totalEntropy.toFixed(1)} bits
              </span>
              <span style="margin-left: 8px; color: #999;">
                ${entry.count} requests
              </span>
            </div>
            <div class="sensitive-headers">
              送信: ${Array.from(entry.sensitiveHeaders).join(', ')}
            </div>
          `;
          
          logContainer.appendChild(div);
        });
      }
    );
    
  } catch (error) {
    console.error('Failed to load request log:', error);
  }
}

// ログクリア
async function clearLog() {
  chrome.runtime.sendMessage(
    { action: 'clearLog', tabId: currentTabId },
    () => {
      loadRequestLog();
      alert('ログをクリアしました');
    }
  );
}

// 定期更新（5秒ごと）
setInterval(() => {
  loadRequestLog();
}, 5000);

// 初期化実行
init();
// ブラウザフィンガープリント収集
// 数学的根拠：各要素の情報エントロピー（bits）を算出

function collectFingerprint() {
  const fp = {};
  
  // Navigator情報
  fp.userAgent = navigator.userAgent;
  fp.language = navigator.language;
  fp.languages = navigator.languages.join(',');
  fp.platform = navigator.platform;
  fp.hardwareConcurrency = navigator.hardwareConcurrency || 0;
  fp.deviceMemory = navigator.deviceMemory || 0;
  
  // 画面情報
  fp.screenResolution = `${screen.width}x${screen.height}`;
  fp.availableResolution = `${screen.availWidth}x${screen.availHeight}`;
  fp.colorDepth = screen.colorDepth;
  fp.pixelRatio = window.devicePixelRatio;
  
  // タイムゾーン
  fp.timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  fp.timezoneOffset = new Date().getTimezoneOffset();
  
  // Canvas Fingerprint（5.7 bits entropy）
  fp.canvasFingerprint = getCanvasFingerprint();
  
  // WebGL Fingerprint
  fp.webglVendor = getWebGLInfo().vendor;
  fp.webglRenderer = getWebGLInfo().renderer;
  
  // Plugins（非推奨だが一部ブラウザで利用可能）
  fp.plugins = Array.from(navigator.plugins || []).map(p => p.name).join(',');
  
  // タッチサポート
  fp.touchSupport = 'ontouchstart' in window;
  
  // Cookie有効化
  fp.cookieEnabled = navigator.cookieEnabled;
  
  // Do Not Track
  fp.doNotTrack = navigator.doNotTrack;
  
  return fp;
}

// Canvas Fingerprint生成
function getCanvasFingerprint() {
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    canvas.width = 200;
    canvas.height = 50;
    
    // テキスト描画（フォントレンダリングの差異を利用）
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillStyle = '#f60';
    ctx.fillRect(0, 0, 100, 50);
    ctx.fillStyle = '#069';
    ctx.fillText('EvalSite 🔒', 2, 15);
    ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
    ctx.fillText('Fingerprint', 4, 30);
    
    // データURL化してハッシュ
    const dataURL = canvas.toDataURL();
    return simpleHash(dataURL);
  } catch (e) {
    return 'error';
  }
}

// WebGL情報取得
function getWebGLInfo() {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    
    if (!gl) return { vendor: 'none', renderer: 'none' };
    
    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    if (!debugInfo) return { vendor: 'unknown', renderer: 'unknown' };
    
    return {
      vendor: gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL),
      renderer: gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)
    };
  } catch (e) {
    return { vendor: 'error', renderer: 'error' };
  }
}

// 簡易ハッシュ関数
function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16);
}

// エントロピー計算（情報理論に基づく）
function calculateFingerprintEntropy(fp) {
  let totalEntropy = 0;
  
  // 各要素のエントロピー推定値（Panopticlick論文より）
  const entropyMap = {
    userAgent: 10.5,
    screenResolution: 4.8,
    timezone: 3.4,
    language: 6.8,
    canvasFingerprint: 5.7,
    webglRenderer: 4.5,
    plugins: 15.4,
    colorDepth: 1.5,
    hardwareConcurrency: 2.9,
    deviceMemory: 1.2,
    touchSupport: 0.5
  };
  
  for (const key in entropyMap) {
    if (fp[key] !== undefined && fp[key] !== 'unknown' && fp[key] !== 'error') {
      totalEntropy += entropyMap[key];
    }
  }
  
  return totalEntropy;
}

// 一意性推定（2^entropy ≈ 識別可能ユーザー数）
function estimateUniqueness(entropy) {
  const identifiableUsers = Math.pow(2, entropy);
  const internetUsers = 5e9; // 約50億人
  const uniquenessProbability = Math.min(1, identifiableUsers / internetUsers);
  
  return {
    entropy,
    identifiableUsers: identifiableUsers.toExponential(2),
    uniquenessPercent: (uniquenessProbability * 100).toFixed(4),
    isUnique: uniquenessProbability > 0.99
  };
}

// ページロード時に実行
const fingerprint = collectFingerprint();
const entropy = calculateFingerprintEntropy(fingerprint);
const uniqueness = estimateUniqueness(entropy);

// バックグラウンドに送信
chrome.runtime.sendMessage({
  action: 'fingerprintCollected',
  fingerprint,
  entropy,
  uniqueness
});

// ストレージに保存
chrome.storage.local.set({
  currentFingerprint: fingerprint,
  currentEntropy: entropy,
  currentUniqueness: uniqueness,
  lastUpdate: Date.now()
});

console.log('[EvalSite] Fingerprint collected:', {
  entropy: entropy.toFixed(2) + ' bits',
  uniqueness: uniqueness.uniquenessPercent + '%',
  identifiable: uniqueness.identifiableUsers
});
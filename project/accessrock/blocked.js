// タブを閉じるまでの秒数
let countdownTime = 5;

// カウントダウンを表示
function updateCountdown() {
  document.getElementById("countdown").textContent = `あと ${countdownTime} 秒でこのタブが閉じます。`;

  if (countdownTime <= 0) {
    clearInterval(countdownInterval);
  } else {
    countdownTime--;
  }
}

// 1秒ごとにカウントダウンを更新
const countdownInterval = setInterval(updateCountdown, 1000);

// 初回のカウントダウン表示
updateCountdown();
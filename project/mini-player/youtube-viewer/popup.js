document.getElementById('embed-btn').addEventListener('click', function() {
  const url = document.getElementById('youtube-url').value.trim();
  
  if (url === "") {
    alert("URLを入力してください。");
    return;
  }

  const regex = /(?:https?:\/\/(?:www\.)?(?:youtube\.com\/(?:(?:v|e(?:mbed)?)\/|(?:watch\?v=))([a-zA-Z0-9_-]+))|youtu\.be\/([a-zA-Z0-9_-]+))/;
  const match = url.match(regex);

  if (match) {
    const videoId = match[1] || match[2];
    const embedUrl = `https://www.youtube.com/embed/${videoId}`;
    
    const iframe = document.createElement('iframe');
    iframe.src = embedUrl;
    iframe.allow = "accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture";
    iframe.allowfullscreen = true;

    const embedContainer = document.getElementById('embed-container');
    embedContainer.innerHTML = '';
    embedContainer.appendChild(iframe);
    embedContainer.style.display = 'block';
  } else {
    alert("無効なYouTube URLです。");
  }
});
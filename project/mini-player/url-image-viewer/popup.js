document.getElementById('loadImage').addEventListener('click', function() {
    const url = document.getElementById('urlInput').value;
    const imageContainer = document.getElementById('imageContainer');
    
    if (url) {
      const img = new Image();
      img.src = url;
      img.onload = function() {
        imageContainer.innerHTML = '';
        imageContainer.appendChild(img);
      };
      img.onerror = function() {
        imageContainer.innerHTML = '画像を読み込めませんでした。';
      };
    } else {
      imageContainer.innerHTML = 'URLを入力してください。';
    }
});
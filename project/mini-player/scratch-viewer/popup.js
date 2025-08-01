document.getElementById('generateEmbed').addEventListener('click', function() {
  const url = document.getElementById('url').value;

  if (url.includes('scratch.mit.edu')) {
    const iframe = createEmbedIframe(url);
    
    const embedArea = document.getElementById('embedArea');
    embedArea.innerHTML = '';
    embedArea.appendChild(iframe);

    document.getElementById('embedContainer').style.display = 'block';
  } else {
    alert("URLが無効です。ScratchのURLを入力してください。");
  }
});

function createEmbedIframe(url) {
  const projectId = extractProjectId(url);
  return createIframe(`https://scratch.mit.edu/projects/${projectId}/embed`);
}

function createIframe(embedUrl) {
  const iframe = document.createElement('iframe');
  iframe.src = embedUrl;
  iframe.width = "485";
  iframe.height = "402";
  iframe.frameborder = "0";
  iframe.allowtransparency = "true";
  iframe.allowfullscreen = "true";
  return iframe;
}

function extractProjectId(url) {
  const match = url.match(/scratch\.mit\.edu\/projects\/(\d+)/);
  return match ? match[1] : null;
}
document.getElementById("convert").addEventListener("click", () => {
  const input = document.getElementById("scratch-link").value;
  const iframe = document.getElementById("output-frame");

  let projectId, turboWarpEmbedLink;
  
  if (input.includes("scratch.mit.edu/projects/")) {

    projectId = input.split("projects/")[1].split("/")[0];	// scratch
    turboWarpEmbedLink = `https://turbowarp.org/${projectId}/embed`;
  } else if (input.includes("turbowarp.org/")) {

    projectId = input.split("turbowarp.org/")[1].split("/embed")[0];	// turbowarp
    turboWarpEmbedLink = `https://turbowarp.org/${projectId}/embed`;
  } else {
    document.getElementById("output").textContent = "Invalid URL! Please provide a valid Scratch or TurboWarp link.";
    return;
  }

  const turboMode = document.getElementById("turbo-mode").checked;
  const fpsValue = document.getElementById("fps-slider").value;

  let url = turboWarpEmbedLink + "?addons=pause";

  if (turboMode) url += "&turbo=true";
  url += `&fps=${fpsValue}`;

  iframe.src = url;
  iframe.style.width = "482px";
  iframe.style.height = "412px";
  document.getElementById("output").textContent = `Running project in embedded TurboWarp mode. FPS: ${fpsValue}`;

});
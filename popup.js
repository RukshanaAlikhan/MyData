document.getElementById("checkData").addEventListener("click", async () => {
  const result = document.getElementById("result");
  result.innerText = "🔍 Scanning your data footprint...";

  try {
    // Get current active tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true }); //how it works is that it finds an active site counts all the cookies from the domain 
    const domain = new URL(tab.url).hostname;                                      //checks if the browser gave any sensitive permissions

    // Get cookies
    const cookies = await chrome.cookies.getAll({ domain });
    const cookieCount = cookies.length;

    // Get site permissions
    const permissions = ["camera", "microphone", "notifications", "geolocation"];
    const granted = [];

    for (let perm of permissions) {
      const status = await chrome.permissions.contains({
        permissions: [perm],
        origins: ["<all_urls>"]
      });
      if (status) granted.push(perm);
    }

    //Compute Data Health Score
    let score = 100;
    score -= cookieCount * 1.5;
    score -= granted.length * 10;

    if (score < 0) score = 0;
    if (score > 100) score = 100;

    //Display results
    result.innerHTML = `
      Site: <b>${domain}</b><br>
      Cookies detected: <b>${cookieCount}</b><br>
      Permissions granted: <b>${granted.join(", ") || "None"}</b><br>
      Data Health Score: <b>${Math.round(score)}</b>/100
    `;

    //Simple advice
    let advice = "";
    if (score > 80) advice = "Excellent! Your privacy settings look solid.";
    else if (score > 50) advice = "Moderate risk. Consider clearing cookies or reviewing permissions.";
    else advice = "High risk! Too many trackers or permissions enabled.";

    result.innerHTML += `<br><br>${advice}`;

  } catch (error) {
    result.innerText = "Could not scan data: " + error.message;
    console.error(error);
  }
});

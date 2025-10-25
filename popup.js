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

// -------------------- TAB LOGIC --------------------
const scanTab = document.getElementById("tab-scan");
const dashTab = document.getElementById("tab-dashboard");
const scanView = document.getElementById("scan-view");
const dashView = document.getElementById("dashboard-view");

scanTab.addEventListener("click", () => {
  scanView.style.display = "block";
  dashView.style.display = "none";
  scanTab.classList.add("active");
  dashTab.classList.remove("active");
});

dashTab.addEventListener("click", () => {
  scanView.style.display = "none";
  dashView.style.display = "block";
  dashTab.classList.add("active");
  scanTab.classList.remove("active");
  loadChart();
});

// -------------------- SCAN LOGIC --------------------
document.getElementById("checkData").addEventListener("click", async () => {
  const result = document.getElementById("result");
  result.innerText = "🔍 Scanning your data footprint...";

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const domain = new URL(tab.url).hostname;
    const cookies = await chrome.cookies.getAll({ domain });
    const cookieCount = cookies.length;

    // Permissions check
    const permissions = ["camera", "microphone", "notifications", "geolocation"];
    const granted = [];
    for (let perm of permissions) {
      const status = await chrome.permissions.contains({
        permissions: [perm],
        origins: ["<all_urls>"]
      });
      if (status) granted.push(perm);
    }

    // Score calculation
    let score = 100 - cookieCount * 1.5 - granted.length * 10;
    score = Math.max(0, Math.min(score, 100));

    result.innerHTML = `
      🌐 Site: <b>${domain}</b><br>
      🍪 Cookies detected: <b>${cookieCount}</b><br>
      🔐 Permissions: <b>${granted.join(", ") || "None"}</b><br>
      💯 Score: <b>${Math.round(score)}</b>/100
    `;

    let advice = "";
    if (score > 80) advice = "✅ Excellent! Your privacy looks strong.";
    else if (score > 50) advice = "⚠️ Moderate risk. Review your cookies or permissions.";
    else advice = "🚨 High risk! Too many trackers or permissions.";
    result.innerHTML += `<br><br>${advice}`;

    // Save result
    const historyItem = {
      domain,
      score: Math.round(score),
      date: new Date().toLocaleDateString()
    };
    const { history = [] } = await chrome.storage.local.get("history");
    history.push(historyItem);
    await chrome.storage.local.set({ history });

  } catch (err) {
    console.error(err);
    result.innerText = "❌ Error: " + err.message;
  }
});

// -------------------- DASHBOARD LOGIC --------------------
async function loadChart() {
  const { history = [] } = await chrome.storage.local.get("history");
  const noData = document.getElementById("noData");
  const canvas = document.getElementById("scoreChart");

  if (history.length === 0) {
    noData.style.display = "block";
    canvas.style.display = "none";
    return;
  }

  noData.style.display = "none";
  canvas.style.display = "block";

  const labels = history.map(item => item.domain + " (" + item.date + ")");
  const scores = history.map(item => item.score);

  new Chart(canvas, {
    type: "line",
    data: {
      labels: labels,
      datasets: [{
        label: "Data Health Score",
        data: scores,
        borderColor: "#3b82f6",
        backgroundColor: "rgba(59, 130, 246, 0.2)",
        fill: true,
        tension: 0.3
      }]
    },
    options: {
      plugins: { legend: { display: false } },
      scales: {
        y: { beginAtZero: true, max: 100, grid: { color: "#334155" } },
        x: { grid: { color: "#334155" } }
      }
    }
  });
}

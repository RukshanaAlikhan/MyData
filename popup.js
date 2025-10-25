import { calculateScore } from "./utils/logic.js";
import { exportPDF } from "./assets/pdfexport.js";

document.addEventListener("DOMContentLoaded", () => {
  const scanTab = document.getElementById("tab-scan");
  const dashTab = document.getElementById("tab-dashboard");
  const scanView = document.getElementById("scan-view");
  const dashView = document.getElementById("dashboard-view");
  const result = document.getElementById("result");
  const clearBtn = document.getElementById("clearHistory");

  scanTab.addEventListener("click", () => toggleTab("scan"));
  dashTab.addEventListener("click", () => toggleTab("dashboard"));
  clearBtn.addEventListener("click", clearHistory);

  document.getElementById("checkData").addEventListener("click", scanSite);

  function toggleTab(view) {
    const active = view === "scan";
    scanView.style.display = active ? "block" : "none";
    dashView.style.display = active ? "none" : "block";
    scanTab.classList.toggle("active", active);
    dashTab.classList.toggle("active", !active);
    if (!active) loadChart();
  }

  async function scanSite() {
    result.innerHTML = "🔍 Scanning...";
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      const domain = new URL(tab.url).hostname;

      // --- cookies ---
      const cookies = await chrome.cookies.getAll({ domain });
      const cookieCount = cookies.length;

      // --- fake tracker detection (simulate third-party requests) ---
      const trackerCount = Math.floor(cookieCount * 0.4); // simple ratio placeholder

      // --- permissions ---
      const permissionsList = ["camera", "microphone", "notifications", "geolocation"];
      const granted = [];
      for (let perm of permissionsList) {
        const status = await chrome.permissions.contains({ permissions: [perm], origins: ["<all_urls>"] });
        if (status) granted.push(perm);
      }

      // --- autofill detection ---
      const autofill = navigator.credentials ? true : false;

      // --- compute score ---
      const score = calculateScore({
        cookies: cookieCount,
        trackers: trackerCount,
        permissions: granted,
        autofill
      });

      // --- contextual advice ---
      const advice = [];
      if (cookieCount > 10) advice.push("🍪 Too many cookies detected. Consider clearing site data.");
      if (granted.length > 0) advice.push("🎙 Check your site permission settings.");
      if (score < 50) advice.push("⚠️ Low privacy score. Use tracker blockers or incognito mode.");
      if (advice.length === 0) advice.push("✅ Great job! Minimal privacy exposure detected.");

      result.innerHTML = `
        <b>${domain}</b><br>
        🍪 Cookies: ${cookieCount}<br>
        🕵️‍♀️ Trackers: ${trackerCount}<br>
        🔐 Permissions: ${granted.join(", ") || "None"}<br>
        💾 Autofill active: ${autofill ? "Yes" : "No"}<br>
        <h3>💯 Score: ${score}/100</h3>
        <progress value="${score}" max="100" style="width: 100%;"></progress><br>
        <p>${advice.join("<br>")}</p>
        <button id="exportPDF">📄 Export Report</button>
      `;

      document.getElementById("exportPDF").addEventListener("click", () =>
        exportPDF(domain, score, cookieCount, trackerCount, granted, advice)
      );

      // --- save history ---
      const item = { domain, score, date: new Date().toLocaleString() };
      const { history = [] } = await chrome.storage.local.get("history");
      history.push(item);
      await chrome.storage.local.set({ history });

    } catch (err) {
      console.error(err);
      result.innerText = "❌ Scan failed: " + err.message;
    }
  }

  async function loadChart() {
    const { history = [] } = await chrome.storage.local.get("history");
    const canvas = document.getElementById("scoreChart");
    const noData = document.getElementById("noData");

    if (history.length === 0) {
      noData.style.display = "block";
      canvas.style.display = "none";
      return;
    }

    noData.style.display = "none";
    canvas.style.display = "block";

    const labels = history.map(i => i.domain);
    const scores = history.map(i => i.score);

    new Chart(canvas, {
      type: "bar",
      data: {
        labels,
        datasets: [{
          label: "Privacy Score",
          data: scores,
          backgroundColor: scores.map(s => s > 80 ? "#10b981" : s > 50 ? "#f59e0b" : "#ef4444")
        }]
      },
      options: {
        scales: { y: { beginAtZero: true, max: 100 } },
        plugins: { legend: { display: false } }
      }
    });
  }

  async function clearHistory() {
    await chrome.storage.local.clear();
    alert("History cleared.");
    loadChart();
  }
});

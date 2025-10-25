export function exportPDF(domain, score, cookies, trackers, permissions, advice) {
  const html = `
    <h1>MyData Privacy Report</h1>
    <p><b>Website:</b> ${domain}</p>
    <p><b>Cookies:</b> ${cookies}</p>
    <p><b>Trackers:</b> ${trackers}</p>
    <p><b>Permissions:</b> ${permissions.join(", ") || "None"}</p>
    <p><b>Score:</b> ${score}/100</p>
    <hr>
    <p><b>Recommendations:</b><br>${advice.join("<br>")}</p>
  `;
  const newWin = window.open("", "_blank");
  newWin.document.write(html);
  newWin.print();
}

import http from "node:http";

async function main() {
  const targets = await new Promise((resolve, reject) => {
    http.get("http://127.0.0.1:8088/json", (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => resolve(JSON.parse(data)));
    }).on("error", reject);
  });

  const xpui = targets.find((t) => t.url && t.url.includes("xpui.app.spotify.com"));
  if (!xpui) {
    console.error("No xpui target found");
    process.exit(1);
  }

  const wsUrl = xpui.webSocketDebuggerUrl;
  const ws = new WebSocket(wsUrl);

  await new Promise((resolve) => ws.onopen = resolve);

  let id = 1;
  function evaluate(expr) {
    return new Promise((resolve) => {
      const msgId = id++;
      const handler = (evt) => {
        const res = JSON.parse(evt.data);
        if (res.id === msgId) {
          ws.removeEventListener("message", handler);
          resolve(res.result?.result?.value);
        }
      };
      ws.addEventListener("message", handler);
      ws.send(JSON.stringify({
        id: msgId,
        method: "Runtime.evaluate",
        params: { expression: expr, returnByValue: true }
      }));
    });
  }

  const currentScheme = await evaluate(`Spicetify?.Config?.color_scheme`);
  const settings = await evaluate(`localStorage.getItem("spicetify-auto-theme:settings")`);
  const styleEl = await evaluate(`document.querySelector("style#spicetify-auto-theme")?.textContent?.slice(0, 100)`);

  console.log("Current Applied Scheme:", currentScheme);
  console.log("Current Settings:", settings);
  console.log("Style tag snippet:", styleEl?.trim());

  ws.close();
}

main().catch(console.error);

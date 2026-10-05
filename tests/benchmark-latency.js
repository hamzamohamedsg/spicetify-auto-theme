import http from "node:http";
import fs from "node:fs";

const XPUI_PATH = "/Applications/Spotify.app/Contents/Resources/Apps/xpui/os-appearance.json";

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

  const ws = new WebSocket(xpui.webSocketDebuggerUrl);
  await new Promise((resolve) => (ws.onopen = resolve));

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

  // 1. Initial State
  const initialScheme = await evaluate(`Spicetify?.Config?.color_scheme`);
  console.log(`Initial Scheme: ${initialScheme}`);

  // 2. Measure transition to Dark (Base)
  console.log("\nSimulating macOS switch to Dark Mode...");
  const t0 = Date.now();
  fs.writeFileSync(XPUI_PATH, JSON.stringify({ appearance: "dark", updated: Math.floor(Date.now() / 1000) }));

  let darkSwitched = false;
  let elapsedDark = 0;
  for (let i = 0; i < 60; i++) {
    await new Promise((r) => setTimeout(r, 50));
    const scheme = await evaluate(`Spicetify?.Config?.color_scheme`);
    if (scheme === "Base") {
      elapsedDark = Date.now() - t0;
      darkSwitched = true;
      break;
    }
  }

  if (darkSwitched) {
    console.log(`⚡ Switched to Dark (Base) in: ${elapsedDark}ms`);
  } else {
    console.error("❌ Timed out waiting for Dark switch");
  }

  // 3. Measure transition back to Light (Orange)
  console.log("\nSimulating macOS switch to Light Mode...");
  const t1 = Date.now();
  fs.writeFileSync(XPUI_PATH, JSON.stringify({ appearance: "light", updated: Math.floor(Date.now() / 1000) }));

  let lightSwitched = false;
  let elapsedLight = 0;
  for (let i = 0; i < 60; i++) {
    await new Promise((r) => setTimeout(r, 50));
    const scheme = await evaluate(`Spicetify?.Config?.color_scheme`);
    if (scheme === "Orange") {
      elapsedLight = Date.now() - t1;
      lightSwitched = true;
      break;
    }
  }

  if (lightSwitched) {
    console.log(`⚡ Switched to Light (Orange) in: ${elapsedLight}ms`);
  } else {
    console.error("❌ Timed out waiting for Light switch");
  }

  ws.close();
}

main().catch(console.error);

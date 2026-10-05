import test from "node:test";
import assert from "node:assert/strict";

test("integration: auto-theme engine reacts to matchMedia change events and syncs Marketplace", async () => {
  // Setup simulated Spotify DOM & Spicetify environment
  const localStorageStore = {};
  const themeRecord = {
    manifest: { name: "StarryNight" },
    schemes: {
      Base: { main: "000000", text: "FFFFFF", sidebar: "142b44" },
      Orange: { main: "FFA500", text: "000000", sidebar: "FF8C00" }
    },
    activeScheme: "Base"
  };

  localStorageStore["marketplace:theme-installed"] = "marketplace:installed:spicetify/StarryNight/user.css";
  localStorageStore["marketplace:installed:spicetify/StarryNight/user.css"] = JSON.stringify(themeRecord);

  const styleElements = new Map();
  const mockDocument = {
    head: {
      appendChild: (el) => styleElements.set(el.id || el.className, el)
    },
    body: {},
    querySelector: (sel) => {
      if (sel === "style#spicetify-auto-theme") return styleElements.get("spicetify-auto-theme") || null;
      if (sel === "style.marketplaceCSS.marketplaceScheme") return styleElements.get("marketplaceCSS marketplaceScheme") || null;
      return null;
    },
    createElement: (tag) => {
      const el = {
        tagName: tag.toUpperCase(),
        id: "",
        className: "",
        classList: {
          add: (c) => { el.className = el.className ? el.className + " " + c : c; }
        },
        innerHTML: "",
        remove: () => styleElements.delete(el.id || el.className)
      };
      return el;
    }
  };

  let mediaListener = null;
  let currentMatches = true; // starts Dark
  const mockMatchMedia = (query) => ({
    matches: currentMatches,
    media: query,
    addEventListener: (evt, cb) => {
      if (evt === "change") mediaListener = cb;
    },
    removeEventListener: () => {}
  });

  const menuItems = [];
  const topbarButtons = [];
  const contextMenuItems = [];
  const mockSpicetify = {
    LocalStorage: {
      get: (k) => localStorageStore[k] || null,
      set: (k, v) => { localStorageStore[k] = v; }
    },
    Config: {
      color_scheme: "Base"
    },
    Topbar: {
      Button: class {
        constructor(label, icon, onClick) {
          topbarButtons.push({ label, icon, onClick });
        }
      }
    },
    ContextMenuV2: {
      Item: class {
        constructor(opts) {
          contextMenuItems.push(opts);
        }
        register() {}
      }
    },
    Menu: {
      Item: class {
        constructor(name, state, onClick) {
          menuItems.push({ name, state, onClick });
        }
        register() {}
      }
    },
    PopupModal: {
      display: () => {},
      hide: () => {}
    },
    showNotification: () => {}
  };

  // Import engine module
  const { initAutoTheme } = await import("../src/engine.js");

  const controller = initAutoTheme({
    document: mockDocument,
    matchMedia: mockMatchMedia,
    spicetify: mockSpicetify
  });
  await controller.evaluateAndApply();

  // Verify initial dark mode application
  assert.ok(controller, "Controller initialized");
  const initialStyle = mockDocument.querySelector("style#spicetify-auto-theme");
  assert.ok(initialStyle, "Style element created");
  assert.match(initialStyle.innerHTML, /--spice-main: #000000;/);
  assert.match(initialStyle.innerHTML, /--spice-sidebar: #142b44;/);
  assert.strictEqual(mockSpicetify.Config.color_scheme, "Base");

  // Simulate macOS switching to Light mode
  assert.ok(mediaListener, "mediaListener was registered");
  currentMatches = false;
  mediaListener({ matches: false });
  await controller.evaluateAndApply(false);

  // Verify dynamic update to Orange
  const updatedStyle = mockDocument.querySelector("style#spicetify-auto-theme");
  assert.match(updatedStyle.innerHTML, /--spice-main: #FFA500;/);
  assert.match(updatedStyle.innerHTML, /--spice-sidebar: #FF8C00;/);
  assert.strictEqual(mockSpicetify.Config.color_scheme, "Orange");

  // Verify Marketplace storage was updated
  const updatedRecord = JSON.parse(localStorageStore["marketplace:installed:spicetify/StarryNight/user.css"]);
  assert.strictEqual(updatedRecord.activeScheme, "Orange");

  // Verify Topbar button and ContextMenuV2 items were registered
  assert.strictEqual(topbarButtons.length, 1);
  assert.strictEqual(topbarButtons[0].label, "Auto Theme Settings");
  assert.strictEqual(contextMenuItems.length, 1);
  assert.strictEqual(contextMenuItems[0].children, "Auto Theme Settings");
});

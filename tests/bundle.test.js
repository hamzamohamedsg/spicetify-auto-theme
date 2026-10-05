import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

test("auto-theme.js evaluates as valid JavaScript and registers cleanly", () => {
  const code = fs.readFileSync(new URL("../auto-theme.js", import.meta.url), "utf8");

  // Ensure no syntax errors by compiling
  const script = new vm.Script(code);
  assert.ok(script);

  const registeredMenuItems = [];
  const sandbox = {
    console,
    setTimeout: (fn, ms) => fn(),
    document: {
      body: {},
      head: { appendChild: () => {} },
      querySelector: () => null,
      createElement: () => ({ id: "", innerHTML: "", classList: { add: () => {} } })
    },
    window: {
      matchMedia: () => ({
        matches: true,
        addEventListener: () => {}
      })
    },
    Spicetify: {
      LocalStorage: { get: () => null, set: () => {} },
      Config: { color_scheme: "Base" },
      Menu: {
        Item: class {
          constructor(name, state, cb) {
            registeredMenuItems.push({ name, state, cb });
          }
          register() {}
        }
      },
      PopupModal: { display: () => {}, hide: () => {} }
    }
  };

  const context = vm.createContext(sandbox);
  script.runInContext(context);

  assert.strictEqual(registeredMenuItems.length, 1);
  assert.strictEqual(registeredMenuItems[0].name, "Auto Theme Settings");
});

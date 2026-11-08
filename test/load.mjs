// Test loader: evaluates the card source (a plain script, as shipped in dist/) in an isolated context
// with minimal browser stubs, and returns the requested top-level bindings. The bundle is unchanged.
import { readFileSync } from "node:fs";
import vm from "node:vm";

export const load = (file, names) => {
  const src = readFileSync(new URL(`../src/${file}`, import.meta.url), "utf8");
  class HTMLElement {
    attachShadow() {
      // Listeners kept by type, so tests can dispatch events to them.
      this.shadowRoot = {
        listeners: {},
        addEventListener(type, fn) {
          (this.listeners[type] ??= []).push(fn);
        },
        innerHTML: "",
      };
      return this.shadowRoot;
    }
    dispatchEvent() {}
    appendChild() {}
  }
  const registry = new Map();
  const context = {
    HTMLElement,
    customElements: { get: (n) => registry.get(n), define: (n, c) => registry.set(n, c) },
    // The last window listener of each type is kept as on_<type>, so tests can call it.
    window: {
      addEventListener(type, fn) {
        this[`on_${type}`] = fn;
      },
      removeEventListener(type, fn) {
        if (this[`on_${type}`] === fn) delete this[`on_${type}`];
      },
    },
    document: { addEventListener() {}, removeEventListener() {}, createElement: (tag) => ({ tag, addEventListener() {} }) },
    console: { info() {}, error() {}, log() {} },
    CustomEvent: class {},
    Intl,
    Date,
  };
  vm.createContext(context);
  return vm.runInContext(`${src}\n;({ ${names.join(", ")} })`, context);
};

import { defineCustomElement } from "vue";

const LifeTab = await import("./LifeTab.vue").then((m) => m.default);
const LifeTabDefinition = defineCustomElement(LifeTab, {
  shadowRoot: false,
});


const LegendTab = await import("./LegendTab.vue").then((m) => m.default);
const LegendTabDefinition = defineCustomElement(LegendTab, {
  shadowRoot: false,
});

const DicePoolOptions = await import("./DicePoolOptions.vue").then((m) => m.default);
const DicePoolOptionsDefinition = defineCustomElement(DicePoolOptions, {
  shadowRoot: false,
});

// Register the custom element.
// After registration, all `<my-vue-element>` tags
// on the page will be upgraded.
function init() {
  window.customElements.define("beast-life-tab", LifeTabDefinition);
  window.customElements.define("beast-legend-tab", LegendTabDefinition);
  window.customElements.define("beast-dice-pool-options", DicePoolOptionsDefinition);
}

export default { init };

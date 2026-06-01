import { defineCustomElement } from "vue";
import LifeTab from "./LifeTab.vue";
import LegendTab from "./LegendTab.vue";
import DicePoolOptions from "./DicePoolOptions.vue";

const LifeTabDefinition = defineCustomElement(LifeTab, {
  shadowRoot: false,
});

const LegendTabDefinition = defineCustomElement(LegendTab, {
  shadowRoot: false,
});

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

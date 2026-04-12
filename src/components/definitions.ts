import { defineCustomElement } from "vue";
import LifeTab from "./LifeTab.vue";
import LegendTab from "./LegendTab.vue";

const LifeTabDefinition = defineCustomElement(LifeTab, {
  shadowRoot: false,
});

const LegendTabDefinition = defineCustomElement(LegendTab, {
  shadowRoot: false,
});

// Register the custom element.
// After registration, all `<my-vue-element>` tags
// on the page will be upgraded.
function init() {
  window.customElements.define("beast-life-tab", LifeTabDefinition);
  window.customElements.define("beast-legend-tab", LegendTabDefinition);
}

export default { init };

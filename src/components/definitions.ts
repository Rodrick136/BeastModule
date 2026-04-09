import { defineCustomElement } from "vue";

const LifeTabDefinition = defineCustomElement({
  // normal Vue component options here
  props: {},
  emits: {},
  template: `...`,

  // defineCustomElement only: CSS to be injected into shadow root
  // styles: [`/* inlined css */`],
});

const LegendTabDefinition = defineCustomElement({
  // normal Vue component options here
  props: {},
  emits: {},
  template: `...`,

  // defineCustomElement only: CSS to be injected into shadow root
  // styles: [`/* inlined css */`],
});

// Register the custom element.
// After registration, all `<my-vue-element>` tags
// on the page will be upgraded.
function init() {
  window.customElements.define("beast-life-tab", LifeTabDefinition);
  window.customElements.define("beast-legend-tab", LegendTabDefinition);
}

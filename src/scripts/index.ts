import { Logger } from "@/scripts/utils/logging";
import MTAConfig from "@/scripts/data/mta_config";

declare global {
  interface Window {
    BeastEphemeralData: {
      tabsTracking: {
        [id: string]: string | undefined;
      };
    };
  }
}
window.BeastEphemeralData = {
  tabsTracking: {},
};

Logger("Beast module as been loaded!");

Hooks.once("init", async () => {
  Logger("Initializing Beast module...");

  Logger("Extending MTA Character Data Options...");
  MTAConfig();
});

Hooks.once("ready", async () => {
  Logger(
    "This code runs once core initialization is ready and game data is available.",
  );
});

//function handleCharacter() { }
const lifeNavItem = `<a class="item" data-tab="beastLife">Life</a>` as const;
const legendNavItem =
  `<a class="item" data-tab="beastLegend">Legend</a>` as const;

Hooks.on("renderActorSheet", (app, html, data) => {
  // @ts-ignore
  if (app.actor.type !== "character") return;
  // @ts-ignore
  if (app.actor.system.characterType !== "beast") return;

  Logger("renderActorSheet", {
    app,
    html,
    data,
  });

  const sheet_tabs = html.find("nav.sheet-tabs");
  const sheet_body = html.find("section.sheet-body");
  if (sheet_tabs.children("a[data-tab=beastLife]").length === 0) {
    sheet_tabs.append(lifeNavItem);
    // @ts-ignore
    const customNote = app.actor.getFlag("beast", "customNote") || "";
    const beastTab = `
    <div class="tab beastLife" data-tab="beastLife">
      <div class="item-stat-block">
        <div class="form-line">
          <label> Custom Note </label>
          <input name="flags.beast.customNote" type="text" value="${customNote}">
        </div>
      </div>
    </div>
    `;
    sheet_body.append(beastTab);
  }
  if (sheet_tabs.children("a[data-tab=beastLegend]").length === 0) {
    sheet_tabs.append(legendNavItem);
    // @ts-ignore
    const customNote = app.actor.getFlag("beast", "customNote") || "";
    const beastTab = `
    <div class="tab beastLife" data-tab="beastLife">
      <div class="item-stat-block">
        <div class="form-line">
          <label> Custom Note </label>
          <input name="flags.beast.customNote" type="text" value="${customNote}">
        </div>
      </div>
    </div>
    `;
    sheet_body.append(beastTab);
  }

  const id = app.actor.id ?? app.id.toString();
  html.find<HTMLAnchorElement>(".sheet-tabs .item").on("click", (event) => {
    const target = event.currentTarget;

    window.BeastEphemeralData.tabsTracking[id] = target.dataset.tab;
  });

  if (window.BeastEphemeralData.tabsTracking[id]) {
    app.activateTab(window.BeastEphemeralData.tabsTracking[id]);
  }
});

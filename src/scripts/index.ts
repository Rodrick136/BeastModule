import { Logger } from "@/scripts/utils/logging";
import MTAConfig from "@/scripts/data/mta_config";
import Definitions from "../components/definitions";
import { html } from "common-tags";
import {
  diceRollerMacroClicked,
  renderDicePoolForm,
} from "./utils/rolls/rolls";
import { ScreenGM } from "./screen-gm/application";
import { RegisterModuleData } from "./utils/data";
import type { DicePoolOptions } from "./utils/rolls/dice-pool-form";

window.BeastEphemeralData = {
  debug: true,
  actors: {},
  gm_screen: null,
};

Logger("Beast module as been loaded!");

Hooks.once("init", async () => {
  Logger("Initializing Beast module...");

  Logger("Extending MTA Character Data Options...");
  MTAConfig();

  Logger("Initializing Component Definitions...");
  Definitions.init();
  RegisterModuleData();
});

Hooks.once("ready", async () => {
  Logger(
    "This code runs once core initialization is ready and game data is available.",
  );
});

Hooks.on("getSceneControlButtons", (controls) => {
  // Ensure the target core layer exists
  if (!controls.tokens) return;

  // Append your tool straight into the active Token layer list
  controls.tokens.tools.beastGmScreen = {
    name: "beastGmScreen",
    title: "Open Beast GM Screen",
    icon: "fa-solid fa-desktop",
    button: true,
    visible: game.user?.isGM,
    order: 100,
    toggle: false,
    onChange: async (event, active) => {
      // Logger("Beast GM Screen Button Clicked", { event, active });
      const screen = window.BeastEphemeralData.gm_screen ?? new ScreenGM();
      window.BeastEphemeralData.gm_screen = screen;
      try {
        if (screen.rendered) {
          screen.bringToFront();
        } else {
          await screen.render();
        }
      } catch (error) {
        Logger("Error rendering Beast GM Screen", { error }, "error");
      }
    },
  };
});

/** Add the dice roller button **/
// @ts-expect-error
Hooks.on("renderChatInput", (chatApp, elements) => {
  Logger("Adding Dice Roller Button", {
    chatApp,
    elements,
    root: elements["#roll-privacy"],
  });
  const root = elements["#roll-privacy"] as HTMLDivElement | undefined;
  if (!root) return;

  const makeBTN = () => {
    const btn = document.createElement("button");
    btn.classList.add(
      "ui-control",
      "icon",
      "cofd-d10-roller",
      "beast-dice-roller",
    );
    btn.setAttribute("data-tooltip", "Dice Roller");
    btn.setAttribute("data-tooltip-direction", "DOWN");
    btn.addEventListener("click", (event) => {
      event.preventDefault();
      const actor =
        canvas?.tokens?.controlled[0]?.actor ?? game.user?.character ?? null;

      const options: DicePoolOptions = {
        cat: "ChatDiceRoller",
        name: actor?.name ?? game.user?.name ?? "Unknown",
      };
      return renderDicePoolForm(actor, options);
    });

    return btn;
  };

  const roller = root.querySelector(".cofd-d10-roller");
  if (roller) {
    if (roller.classList.contains("beast-dice-roller")) return;
    roller.replaceWith(makeBTN());
  } else {
    root.appendChild(makeBTN());
  }
});

//function handleCharacter() { }
const lifeNavItem = `<a class="item" data-tab="beastLife">Life</a>` as const;
const legendNavItem =
  `<a class="item" data-tab="beastLegend">Legend</a>` as const;
const diceRollerMacro = html`<div
  class="button charMacroButton diceRollerButton tooltip"
  style="filter: hue-rotate(165deg);"
>
  <span class="tooltip-text"
    >Opens a Dice Roller form that allows you to roll a dice pool.</span
  >
  <img
    src="systems/mta/icons/gui/d10.svg"
    alt="Dice Roller"
  />
</div>`;

Hooks.on("renderActorSheet", (app, html, data) => {
  const macroPanel = html.find("div.characterMacroPanel > div");
  if (macroPanel.length > 0) {
    const existing = macroPanel.find(".charMacroButton.rollButton");
    if (existing.length > 0) {
      existing.remove();
    }

    const el = document.createElement("div");
    macroPanel.append(el);
    el.outerHTML = diceRollerMacro;
    const button = html.find("div.characterMacroPanel .diceRollerButton");
    button.on("click", () => diceRollerMacroClicked(app, html));
  }
  // @ts-ignore
  if (app.actor.type !== "character") return;

  // @ts-ignore
  if (app.actor.system.characterType !== "beast") return;

  const id = app.actor.id ?? app.id.toString();
  if (!window.BeastEphemeralData.actors[id]) {
    window.BeastEphemeralData.actors[id] = {
      id: id,
      name: app.actor.name,
      // @ts-ignore
      activeTab: app._tabs[0]?.active ?? "attributes",
      changedElement: null,
      scrollY: null,
    };
  }
  const sheetData = window.BeastEphemeralData.actors[id];

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
    //const customNote = app.actor.getFlag("beast", "customNote") || "";
    const tab = `<div class="tab beastLife" data-tab="beastLife">
      <beast-life-tab id="${id}"></beast-life-tab>
    </div>`;
    sheet_body.append(tab);
  }
  if (sheet_tabs.children("a[data-tab=beastLegend]").length === 0) {
    sheet_tabs.append(legendNavItem);
    // @ts-ignore
    //const customNote = app.actor.getFlag("beast", "customNote") || "";
    const tab = `<div class="tab beastLegend" data-tab="beastLegend">
      <beast-legend-tab id="${id}"></beast-legend-tab>
    </div>`;
    sheet_body.append(tab);
  }

  app.activateTab(sheetData.activeTab);
  html.find<HTMLAnchorElement>(".sheet-tabs .item").on("click", (event) => {
    const target = event.currentTarget;
    sheetData.activeTab = target.dataset.tab || "attributes";
  });

  //const changedElement = sheetData.changedElement?.dataset.name;
  if (sheetData.activeTab.startsWith("beast") && sheetData.scrollY) {
    const selectors = `#MtAActorSheet-Actor-${id} .window-content`;
    const window_content = document.querySelector(selectors);

    if (window_content) {
      window_content.scroll({
        behavior: "instant",
        top: sheetData.scrollY,
      });

      Logger("sheetData.changedElement.scrollIntoView", {
        window_content,
        sheetData,
      });
    }
  }
});

Hooks.on("closeActorSheet", (app, _html) => {
  const id = app.actor.id ?? app.id.toString();
  if (window.BeastEphemeralData.actors[id]) {
    const data = window.BeastEphemeralData.actors[id];
    data.changedElement = null;
  }
});

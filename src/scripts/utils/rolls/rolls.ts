import { html } from "common-tags";
import { Logger } from "../logging";
import { DicePoolForm, type DicePoolOptions } from "./dice-pool-form";
import { Clone } from "../data";

export type DicePool = {
  name: string;
  desc: string | null;
  num: number;
  condition?: number;
  trait?: string;
};
export type RollOptions = {
  dicePools: DicePool[];
  successThreshold: number;
  explodes: number | null;
  rote: boolean;
  amount: number;
};
export const DEFAULT_ROLL_OPTIONS: RollOptions = {
  dicePools: [{ name: "Default", desc: null, num: 1 }],
  successThreshold: 8,
  explodes: 10,
  rote: false,
  amount: 1,
} as const;

type DicePoolsResolved = {
  config: RollOptions;
  formula: string;
  rolls: Roll.Evaluated<Roll<{}>>[];
};

async function resolveDicePools(
  options?: Partial<RollOptions>,
): Promise<DicePoolsResolved | null> {
  try {
    const config = Clone({ ...DEFAULT_ROLL_OPTIONS, ...options });

    const totalDice = config.dicePools.reduce(
      (acc, pool) => acc + pool.num + (pool.condition ?? 0),
      0,
    );

    Logger("Total Dice:", {
      dicePools: config.dicePools,
      totalDice,
    });

    if (totalDice <= 0) {
      const fatePool: DicePool = {
        name: "Fate",
        desc: "Your Fate Beckons",
        num: 1,
      };
      config.dicePools.push(fatePool);
      config.explodes = null;
      config.successThreshold = 10;
    }

    const reroll = config.rote ? `r<${config.successThreshold}` : "";
    const explodes = config.explodes !== null ? `x>=${config.explodes}` : "";
    const count = `cs>=${config.successThreshold}`;
    const formula = config.dicePools
      .map((pool) => {
        const num = Math.max(pool.num + (pool.condition ?? 0), 0);
        return `${num}d10${reroll}${explodes}${count}[${pool.name}]`; //ie 5d10r<8x>=8cs>=8
      })
      .join(" + ");

    const rolls = [];
    for (let i = 0; i < config.amount; i++) {
      const roll = new Roll(formula).evaluate();
      rolls.push(roll);
    }

    const result = {
      config,
      formula,
      rolls: await Promise.all(rolls),
    };

    Logger("Resolved Roll", result);

    return result;
  } catch (error) {
    Logger("Error resolving dice pools", { error }, "error");
    return null;
  }
}

function printDicePoolsResolved(name: string, resolved: DicePoolsResolved) {
  const { config, rolls } = resolved;

  const parts = [];
  for (const roll of rolls) {
    const die_parts = [];
    for (const die of roll.dice) {
      const pool = config.dicePools.find((p) => p.name === die.options.flavor);
      const isFateRoll = pool?.name === "Fate";

      const list: string[] = [];
      let exploded = 0;

      for (const result of die.results) {
        const success = !!result.success ? "success" : "failure";
        const explodedClass = !!result.exploded ? "exploded" : "";
        if (result.exploded) exploded++;

        const dramaticFailure = result.result === 1 ? "dramatic-failure" : "";
        const fate = isFateRoll ? `fate-roll ${dramaticFailure}`.trim() : "";
        const classList = [success, explodedClass, fate].filter(Boolean).join(" ");

        const classes = `roll die d10 ${classList}`.trim();
        const resultHtml: string = html`<li class="die-result">
          <p class="${classes}">${result.result}</p>
        </li>`;
        list.push(resultHtml);
      }
      const part = html` <header class="part-header flexrow">
          <span class="part-formula">Part Name:</span>
          <span class="part-total">${die?.options?.flavor ?? "Unknown"}</span>
        </header>
        <header class="part-header flexrow">
          <span class="part-formula">Formula:</span>
          <span class="part-total">${die.formula.split("[")[0]}</span>
        </header>
        <header class="part-header flexrow">
          <span class="part-formula">Condition:</span>
          <span class="part-total">${pool?.condition ?? 0}</span>
        </header>
        <header class="part-header flexrow">
          <span class="part-formula">Successes:</span>
          <span class="part-total">${die.total}</span>
        </header>
        <header class="part-header flexrow">
          <span class="part-formula">Exploded:</span>
          <span class="part-total">${exploded}</span>
        </header>
        <ol class="dice-rolls">
          ${list}
        </ol>`;
      die_parts.push(part);
    }

    const roll_num = rolls.indexOf(roll) + 1;
    const even_or_odd = roll_num % 2 === 0 ? "even" : "odd";
    const roll_html = html`<section class="tooltip-part ${even_or_odd}">
      <div class="dice">
        <header class="part-header flexrow">
          <span class="part-formula">Roll #:</span>
          <span class="part-total">${roll_num}</span>
        </header>
        ${die_parts}
      </div>
    </section>`;
    parts.push(roll_html);
  }

  const config_html = html`<section class="tooltip-part">
    <div class="dice">
      <header class="part-header flexrow">
        <span class="part-formula">Amount:</span>
        <span class="part-total">${config.amount}</span>
      </header>
      <header class="part-header flexrow">
        <span class="part-formula">Success Threshold:</span>
        <span class="part-total">${config.successThreshold}</span>
      </header>
      <header class="part-header flexrow">
        <span class="part-formula">Explodes:</span>
        <span class="part-total"
          >${config.explodes ? config.explodes : "No"}</span
        >
      </header>
      <header class="part-header flexrow">
        <span class="part-formula">Rote Quality:</span>
        <span class="part-total">${config.rote ? "Yes" : "No"}</span>
      </header>
    </div>
  </section>`;

  let successTotal = 0;
  for (const roll of rolls) {
    successTotal += roll.total;
  }
  //dramaticFailure

  const exceptional =
    successTotal >= config.amount * 5 ? "exceptional-success" : "";
  const outcome = successTotal === 0 ? "failure" : "success";

  const final = html`<div
    class="dice-roll beast-roll"
    data-action="expandRoll"
  >
    <div class="dice-result">
      <div class="dice-formula">${name}</div>
      <div class="dice-tooltip">
        <div class="wrapper">${config_html} ${parts}</div>
      </div>

      <h4 class="dice-total ${outcome} ${exceptional}">${successTotal}</h4>
    </div>
  </div>`;

  return final;
}

export async function printDicePool(form: DicePoolForm) {
  Logger("printDicePool", { form });
  const { cat, name, rollOptions } = form.dicePoolOptions;

  const resolved = await resolveDicePools(rollOptions);
  let msg = "";
  if (resolved) {
    msg = printDicePoolsResolved(name, resolved);
  } else {
    msg = `<p>Error resolving dice pools, try again.</p>`;
  }
  // Logger("Printing Roll Results", { resolved, msg });
  const rollMode = game.settings?.get("core", "rollMode") ?? "publicroll";

  const flavor = rollOptions?.dicePools?.map((pool) => pool.name).join(", ");
  ChatMessage.create(
    {
      speaker: ChatMessage.getSpeaker({ actor: form.actor }),
      flavor: flavor ?? cat,
      content: msg,
      sound: CONFIG.sounds.dice,
    },
    {
      rollMode,
      chatBubble: false,
    },
  );

  if (form.actor) {
    const el = document.getElementById(`MtAActorSheet-Actor-${form.actor.id}`);
    for (const pool of rollOptions?.dicePools ?? []) {
      if (pool.trait) {
        const input = el?.querySelector(
          `input[data-trait="${pool.trait}"].attribute-check:checked`,
        ) as HTMLInputElement | null | undefined;
        if (input) {
          input.checked = false;
        }
      }

      if (pool.trait === "willpower") {
        // minus 1 willpower if rolled
        // @ts-expect-error
        const willpower = form.actor.system.willpower;
        if (willpower.value > 0) {
          await form.actor.update({
            // @ts-expect-error
            "system.willpower.value": willpower.value - 1,
          });
        }
      }
    }
  }
}

export async function renderDicePoolForm(
  actor: ActorSheet.Any["actor"] | null,
  options: DicePoolOptions,
) {
  try {
    const form = new DicePoolForm(actor, options);
    await form.render({ force: true });
  } catch (error) {
    Logger("Error rendering form", { error }, "error");
  }
}

function toSentenceCase(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

export async function diceRollerMacroClicked(
  app: ActorSheet,
  html: JQuery<HTMLElement>,
) {
  Logger("Dice Roller Macro Clicked", { app });
  const element = html[0];
  const system = app.actor.system as Record<string, any>;
  const rollableInputs = element.querySelectorAll(
    "input[data-trait].attribute-check:checked",
  ) as NodeListOf<HTMLInputElement>;

  const pools: DicePool[] = [];
  for (const input of rollableInputs) {
    const data_trait = input.dataset.trait as string;
    Logger("Processing rollable input", { input, data_trait });

    const parts = data_trait.split(".");
    const trait = parts.reduce((acc, key) => acc?.[key], system);
    if (trait) {
      const label = element.querySelector(
        `label[for="${input.id}"]`,
      ) as HTMLLabelElement | null;
      const labelText =
        label?.textContent?.trim() ?? toSentenceCase(parts.at(-1) ?? "unknown");
      let num: number = trait?.final ?? trait?.value ?? 0;

      if (data_trait === "willpower") {
        if (num > 0) {
          num = 3;
        } else {
          continue; // skip willpower if it's 0 or less
        }
      }

      const pool: DicePool = {
        name: labelText,
        desc: null,
        num: num,
        trait: data_trait,
        condition: 0,
      };

      const untrained = (trait?.value ?? 0) === 0;
      if (untrained) {
        if (parts[0] === "skills_mental") {
          pool.condition = -3;
        } else if (parts[0] === "skills_physical") {
          pool.condition = -1;
        } else if (parts[0] === "skills_social") {
          pool.condition = -1;
        }
      }

      pools.push(pool);
    }
  }

  const options: DicePoolOptions = {
    cat: "Character",
    name: app.actor.name,
  };
  if (pools.length > 0) {
    options.rollOptions = {
      ...DEFAULT_ROLL_OPTIONS,
      dicePools: pools,
    };
  }

  return renderDicePoolForm(app.actor, options);
}

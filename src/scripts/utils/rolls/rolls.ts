import { html } from "common-tags";
import { Logger } from "../logging";
import { DicePoolForm, type DicePoolOptions } from "./dice-pool-form";

export type DicePool = {
  name: string;
  desc: string | null;
  num: number;
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
    const config = { ...DEFAULT_ROLL_OPTIONS, ...options };

    const totalDice = config.dicePools.reduce((acc, pool) => acc + pool.num, 0);
    if (totalDice === 0) {
      const fatePool: DicePool = {
        name: "Fate",
        desc: "Your Fate Beckons",
        num: 1,
      };
      config.dicePools.push(fatePool);
      config.explodes = null;
    }

    const reroll = config.rote ? `r<${config.successThreshold}` : "";
    const explodes = config.explodes ? `x>=${config.explodes}` : "";
    const count = `cs>=${config.successThreshold}`;
    const formula = config.dicePools
      .map((pool) => {
        const num = Math.max(pool.num.toNearest(1, "floor"), 0);
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
      const list: string[] = [];
      let exploded = 0;

      for (const result of die.results) {
        const success = !!result.success ? "success" : "failure";
        const explodedClass = !!result.exploded ? "exploded" : "";
        if (result.exploded) exploded++;

        const classes = `roll die d10 ${success} ${explodedClass}`.trim();
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

  const exceptional =
    successTotal >= config.amount * 5 ? "exceptionalSuccess" : "";
  const failure = successTotal === 0 ? "dramaticFailure" : "";
  const final = html`<div
    class="dice-roll beast-roll"
    data-action="expandRoll"
  >
    <div class="dice-result">
      <div class="dice-formula">${name}</div>
      <div class="dice-tooltip">
        <div class="wrapper">${config_html} ${parts}</div>
      </div>

      <h4 class="dice-total ${failure}${exceptional}">${successTotal}</h4>
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

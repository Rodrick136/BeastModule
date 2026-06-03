import { html } from "common-tags";
import { Logger } from "../logging";
import { DicePoolForm, type DicePoolOptions } from "./dice-pool-form";

export type RollOptions = {
  dicePool: number;
  successThreshold: number;
  explodesThreshold: number;
  rote: boolean;
  amount: number;
};
export const DEFAULT_ROLL_OPTIONS: RollOptions = {
  dicePool: 0,
  successThreshold: 8,
  explodesThreshold: 10,
  rote: false,
  amount: 1,
} as const;

type ResolvedDieResult = {
  term: Roll.Evaluated<Roll<{}>>["dice"][number]["results"][number];
  success: boolean;
  exploded: boolean;
  childRolls: DicePoolResolvedItem[];
};

export type DicePoolResolvedItem = {
  roll: Roll<{}>;
  results: ResolvedDieResult[];
  options: Partial<RollOptions>;
};
async function resolveDicePool(
  options?: Partial<RollOptions>,
  childRoll = false,
): Promise<DicePoolResolvedItem[]> {
  const config = { ...DEFAULT_ROLL_OPTIONS, ...options };

  const items = [];
  const amount = Math.max(1, config.amount);
  for (let index = 1; index <= amount; index++) {
    const roll = await new Roll(`${config.dicePool}d10`).evaluate();
    const results: ResolvedDieResult[] = [];
    for (const die of roll.dice) {
      for (const term of die.results) {
        const result: ResolvedDieResult = {
          term,
          success: term.result >= config.successThreshold,
          exploded: term.result >= config.explodesThreshold,
          childRolls: [],
        };

        if (result.success) {
          if (result.exploded) {
            const options = {
              ...config,
              dicePool: 1,
              amount: 1,
            };
            result.childRolls = await resolveDicePool(options, true);
          }
        } else if (config.rote && !childRoll) {
          const options = {
            ...config,
            dicePool: 1,
            amount: 1,
          };
          result.childRolls = await resolveDicePool(options, true);
        }

        results.push(result);
      }
    }
    const item = {
      roll,
      results,
      options: config,
    };
    items.push(item);
  }

  return items;
}

function printDieLists(items: DicePoolResolvedItem[]) {
  const lists = [];
  for (const item of items) {
    const listItems: {
      listItemHtml: string;
      result: ResolvedDieResult;
    }[] = [];
    for (const result of item.results) {
      const success = result.success ? "success" : "";
      const exploded = result.exploded ? "exploded" : "";
      const childrenLists = printDieLists(result.childRolls);

      const className = `roll die d10 ${success} ${exploded}`.trim();
      const resultHtml: string = html`<li class="die-result">
        <p class="${className}">${result.term.result}</p>
        ${childrenLists.map((i) => i.listHtml)}
      </li>`;
      listItems.push({
        listItemHtml: resultHtml,
        result,
      });
    }

    if (listItems.length > 0) {
      const listHtml = html`<ol class="dice-rolls">
        ${listItems.map((i) => i.listItemHtml)}
      </ol>`;

      lists.push({
        listItems,
        listHtml,
        item,
      });
    }
  }

  return lists;
}

function printDiceMessage(name: string, items: DicePoolResolvedItem[]) {
  const gatherData = (items: DicePoolResolvedItem[]) => {
    let successTotal = 0;
    for (const item of items) {
      for (const result of item.results) {
        if (result.success) {
          successTotal++;
        }
        if (result.childRolls.length > 0) {
          successTotal += gatherData(result.childRolls);
        }
      }
    }

    return successTotal;
  };
  const successTotal = gatherData(items);

  const lists = printDieLists(items);

  const parts = lists.map(
    (list, index) =>
      html`<section class="tooltip-part">
        <div class="dice">
          <header class="part-header flexrow">
            <span class="part-formula">Roll #:</span>
            <span class="part-total">${index + 1}</span>
          </header>
          <header class="part-header flexrow">
            <span class="part-formula">Successes:</span>
            <span class="part-total">${gatherData([list.item])}</span>
          </header>
          <header class="part-header flexrow">
            <span class="part-formula">Success Threshold:</span>
            <span class="part-total"
              >${list.item.options.successThreshold}</span
            >
          </header>
          <header class="part-header flexrow">
            <span class="part-formula">Explodes Threshold:</span>
            <span class="part-total"
              >${list.item.options.explodesThreshold}</span
            >
          </header>
          <header class="part-header flexrow">
            <span class="part-formula">Rote Quality:</span>
            <span class="part-total"
              >${list.item.options.rote ? "Yes" : "No"}</span
            >
          </header>
          ${list.listHtml}
        </div>
      </section>`,
  );

  const msg = html`<div
    class="dice-roll"
    data-action="expandRoll"
  >
    <div class="dice-result">
      <div class="dice-formula">${name}</div>
      <div class="dice-tooltip">
        <div class="wrapper">${parts}</div>
      </div>

      <h4 class="dice-total">${successTotal}</h4>
    </div>
  </div>`;

  return msg;
}

export async function printDicePool(form: DicePoolForm) {
  Logger("printDicePool", { form });
  const { cat, name, rollOptions } = form.dicePoolOptions;

  const results = await resolveDicePool(rollOptions);
  const msg = printDiceMessage(name, results);

  Logger("Printing Roll Results", { results, msg });

  const gatherRolls = (results: DicePoolResolvedItem[]): Roll<{}>[] => {
    let rolls: Roll<{}>[] = [];
    for (const item of results) {
      rolls.push(item.roll);
      for (const result of item.results) {
        if (result.childRolls.length > 0) {
          const childRolls = gatherRolls(result.childRolls);
          rolls = rolls.concat(childRolls);
        }
      }
    }
    return rolls;
  };
  const rollMode = game.settings?.get("core", "rollMode") ?? "publicroll";

  ChatMessage.create(
    {
      speaker: ChatMessage.getSpeaker({ actor: form.actor }),
      flavor: cat,
      content: msg,
      sound: CONFIG.sounds.dice,
      rolls: gatherRolls(results),
    },
    {
      rollMode,
      chatBubble: false,
    },
  );
}

export async function renderDicePoolForm(
  actor: ActorSheet.Any["actor"],
  options: DicePoolOptions,
) {
  try {
    const form = new DicePoolForm(actor, options);
    await form.render({ force: true });
  } catch (error) {
    Logger("Error rendering form", { error }, "error");
  }
}

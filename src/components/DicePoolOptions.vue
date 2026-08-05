<script lang="ts" setup>
import { Clone, Handlize } from "@/scripts/utils/data";
import { Logger } from "@/scripts/utils/logging";
import { ConfirmationPrompt } from "@/scripts/utils/prompts";
import type {
  DicePoolForm,
  DicePoolOptions,
} from "@/scripts/utils/rolls/dice-pool-form";
import {
  DEFAULT_ROLL_OPTIONS,
  printDicePool,
  type DicePool,
} from "@/scripts/utils/rolls/rolls";
import { useLocalStorage } from "@vueuse/core";
import {
  computed,
  reactive,
  ref,
  shallowRef,
  toRaw,
  watch,
  type PropType,
} from "vue";

const props = defineProps({
  application: {
    type: Object as PropType<DicePoolForm | null>,
    default: null,
  },
});

const dicePoolOptions = ref<{
  cat: string;
  name: string;
  rollMode: ChatMessage.PassableRollMode;
}>({
  cat: "UnCategorized",
  name: "Roll",
  rollMode: CONST.DICE_ROLL_MODES.PUBLIC,
});

const storageKey = shallowRef("beast--rollOptionsForm");
const rollOptions = useLocalStorage(storageKey, DEFAULT_ROLL_OPTIONS);
watch(
  () => props.application,
  (newApp) => {
    if (newApp?.dicePoolOptions) {
      Logger("Updating dice pool options from application", {
        dicePoolOptions: newApp.dicePoolOptions,
      });
      const cat = newApp.dicePoolOptions.cat || "UnCategorized";
      const name = newApp.dicePoolOptions.name || "Roll";
      let rollMode = newApp.dicePoolOptions.rollMode;
      if (!rollMode) {
        const defaultRollMode = game.settings?.get("core", "rollMode");
        rollMode = defaultRollMode ?? CONST.DICE_ROLL_MODES.PUBLIC;
      }

      dicePoolOptions.value = { cat, name, rollMode };

      const handle = Handlize(`${cat}-${name}`);
      const key = `beast--rollOptionsForm::${handle}`;
      const rollOptionsExisting = Clone(
        useLocalStorage(key, DEFAULT_ROLL_OPTIONS).value,
      );
      storageKey.value = key;
      rollOptions.value = rollOptionsExisting;

      if (newApp.dicePoolOptions.rollOptions) {
        for (const [key, value] of Object.entries(
          newApp.dicePoolOptions.rollOptions,
        )) {
          if (key in rollOptions.value) {
            (rollOptions.value as any)[key] = value;
          }
        }
      }
    }
  },
  { deep: false, immediate: true },
);
const explodes = computed({
  get: () => rollOptions.value.explodes !== null,
  set: (value: boolean) => {
    if (value) {
      rollOptions.value.explodes = 10;
    } else {
      rollOptions.value.explodes = null;
    }
  },
});
const loading = computed(() => !props.application);
const errors = reactive<Record<string, string | undefined>>({});

async function onSubmit(event?: SubmitEvent) {
  try {
    {
      // check that all dice pools have a unique name
      const dicePools = rollOptions.value.dicePools;
      const names = dicePools.map((pool) => pool.name);
      const uniqueNames = new Set(names);
      if (names.length !== uniqueNames.size) {
        Logger("Duplicate dice pool names found", { names }, "error");
        errors.duplicateNames = "Duplicate dice pool names found";
        return;
      } else {
        errors.duplicateNames = undefined;
      }
    }

    Logger("Form Submitted", { event });

    if (dicePoolOptions.value && props.application) {
      props.application.dicePoolOptions = toRaw(dicePoolOptions.value);
      props.application.dicePoolOptions.rollOptions = toRaw(rollOptions.value);
      await printDicePool(props.application);
    } else {
      Logger("No options provided for dice pool form", { props }, "error");
    }

    if (props.application) {
      await props.application.close();
    } else {
      Logger("No application provided for dice pool form", { props }, "error");
    }
  } catch (error) {
    Logger("Error submitting form", { error }, "error");
  }
}

function addToPool() {
  rollOptions.value.dicePools.push({
    name: `Additive ${rollOptions.value.dicePools.length + 1}`,
    desc: null,
    num: 1,
  });
}
async function removeFromPool(index: number) {
  errors.lastPool = undefined;

  //confirm with the user that they want to remove the dice pool
  const confirm = await ConfirmationPrompt();
  if (!confirm) return;

  // check that theere is at least one dice pool remaining
  if (rollOptions.value.dicePools.length <= 1) {
    errors.lastPool = "There must be at least one remaining.";
    return;
  }

  rollOptions.value.dicePools.splice(index, 1);
}
function clearPool() {
  rollOptions.value.dicePools = Clone(DEFAULT_ROLL_OPTIONS.dicePools);
}
function reset() {
  rollOptions.value = Clone(DEFAULT_ROLL_OPTIONS);
}

function addCondition(dicePool: DicePool) {
  dicePool.condition = (dicePool.condition ?? 0) + 1;
}

function minusCondition(dicePool: DicePool) {
  dicePool.condition = (dicePool.condition ?? 0) - 1;
}

function addWillpowerToPool() {
  errors.willpower = undefined;

  const countOfWillpowerPools = rollOptions.value.dicePools.filter(
    (pool) => pool.trait === "willpower",
  ).length;

  const willpower =
    // @ts-expect-error
    props.application?.actor?.system?.willpower;
  const current = willpower?.value ?? 0;
  const max = willpower?.max ?? 2;

  if (countOfWillpowerPools >= max) {
    errors.willpower = `You cannot add more than ${max} willpower dice to the roll.`;
    return;
  }

  const canAdd = current - countOfWillpowerPools >= 1;
  if (!canAdd) {
    errors.willpower = `You cannot add more willpower dice to the roll than you have available.`;
    return;
  }

  let name = "Willpower";
  if (countOfWillpowerPools > 0) {
    name = `Willpower ${countOfWillpowerPools + 1}`;
  }
  rollOptions.value.dicePools.push({
    name,
    desc: null,
    num: 3,
    trait: "willpower",
  });
}

// The further the condition is from 0, the more red the dice will be. The closer to 0, the more green the dice will be.
function calcConditionFilter(condition?: number) {
  const curCond = condition ?? 0;
  const maxDeviation = 10; // The maximum deviation from 0 that we will consider for color calculation
  const normalizedCond =
    Math.min(Math.abs(curCond), maxDeviation) / maxDeviation;

  /* Logger("Calculating condition filter", {
    condition: curCond,
    normalizedCond,
  }); */

  // Red for negative, Green for positive, 180 being closer to green, 80 being closer to red
  let hue = 130; // Start in between red and green
  if (curCond > 0) {
    // if positive, being green
    hue = normalizedCond * 50 + hue; // shift towards green
  } else {
    // if negative, being red
    hue = hue - normalizedCond * 50; // shift towards red
  }

  // Saturation increases with the value of the condition, 0 min, 10 max
  const saturation = normalizedCond * 10;

  // using css filter
  return `hue-rotate(${hue}deg) saturate(${saturation})`;
}

function rollAFateDie() {
  reset();

  rollOptions.value.successThreshold = 10;
  rollOptions.value.explodes = null;
  rollOptions.value.dicePools = [];
  rollOptions.value.dicePools.push({
    name: "Fate",
    desc: "Your Fate Beckons",
    num: 1,
  });

  return onSubmit();
}
</script>
<template>
  <form
    class="beast-dice-pool-options"
    :class="{ loading }"
    @submit.prevent="onSubmit"
  >
    <div class="title-bar">
      <h3
        style="width: max-content"
        data-tooltip="Who you are rolling as"
      >
        {{ dicePoolOptions.name }}
      </h3>

      <button
        type="button"
        class="button stoneButton roll-fate"
        @click="rollAFateDie"
      >
        Roll a Fate die
      </button>
    </div>
    <fieldset name="dice-pools">
      <legend>
        <p>Dice Pool:</p>
        <div class="actions">
          <button
            type="button"
            @click="addToPool()"
            class="button stoneButton item-add"
            data-tooltip="Add new additive dice to the roll."
          >
            <i class="fas fa-plus"></i>
          </button>
          <button
            type="button"
            @click="clearPool()"
            class="button stoneButton item-delete"
            data-tooltip="Clear all additive dice from the roll."
          >
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </legend>

      <ul class="list-dice-pools">
        <template
          v-for="(dicePool, index) in rollOptions.dicePools"
          :key="index"
        >
          <li
            class="dice-pool"
            :data-tooltip="`Number of dice because of ${dicePool.name}.`"
          >
            <input
              name="name"
              data-tooltip="The name of the dice, used for display purposes."
              type="text"
              v-model="dicePool.name"
            />
            <input
              name="num"
              data-tooltip="The base number of dice in the roll."
              type="number"
              v-model.number="dicePool.num"
              min="0"
              step="1"
            />
            <input
              name="condition"
              data-tooltip="The pluses or minuses to the number of dice in the roll."
              type="number"
              v-model.number="dicePool.condition"
              step="1"
              :style="{ filter: calcConditionFilter(dicePool.condition) }"
            />
            <button
              type="button"
              @click="addCondition(dicePool)"
              class="button stoneButton item-add"
              data-tooltip="Add 1 to the condition."
            >
              <i class="fas fa-plus"></i>
            </button>
            <button
              type="button"
              @click="minusCondition(dicePool)"
              class="button stoneButton item-delete"
              data-tooltip="Subtract 1 from the condition."
            >
              <i class="fas fa-minus"></i>
            </button>
            <button
              type="button"
              @click="removeFromPool(index)"
              class="button stoneButton item-delete"
              data-tooltip="Remove these dice from the roll."
            >
              <i class="fas fa-times-circle"></i>
            </button>
          </li>
        </template>
      </ul>
    </fieldset>

    <label
      class="roll-option"
      data-tooltip="What the dice need to meet or beat to succeed."
    >
      <p>Success Threshold:</p>
      <input
        type="number"
        v-model.number="rollOptions.successThreshold"
        min="2"
        max="10"
      />
    </label>
    <label
      class="roll-option"
      data-tooltip="What the dice need to meet or beat to explode."
    >
      <p>Explodes Threshold:</p>
      <input
        type="checkbox"
        v-model="explodes"
      />
      <input
        type="number"
        v-model.number="rollOptions.explodes"
        min="1"
        max="10"
        :disabled="rollOptions.explodes === null"
      />
    </label>
    <label
      class="roll-option"
      data-tooltip="Add a willpower die to the roll."
    >
      <p>Add Willpower:</p>
      <button
        type="button"
        @click="addWillpowerToPool()"
        class="button stoneButton item-add"
        data-tooltip="Add a willpower die to the roll."
      >
        <i class="fas fa-plus"></i>
      </button>
    </label>
    <label
      class="roll-option"
      data-tooltip="Indicates if the roll is rote."
    >
      <p>Rote Quality:</p>
      <input
        type="checkbox"
        v-model="rollOptions.rote"
      />
    </label>
    <label
      class="roll-option"
      data-tooltip="The number of times to repeat the roll."
    >
      <p>Amount:</p>
      <input
        type="number"
        v-model.number="rollOptions.amount"
        min="1"
        max="100"
      />
    </label>
    <label
      class="roll-option"
      data-tooltip=""
    >
      <p>Roll Mode:</p>
      <select
        type="text"
        v-model="dicePoolOptions.rollMode"
      >
        <option value="publicroll">Public Roll</option>
        <option value="gmroll">GM Roll</option>
        <option value="blindroll">Blind Roll</option>
        <option value="selfroll">Self Roll</option>
      </select>
    </label>
    <div
      v-if="Object.values(errors).some((error) => !!error)"
      class="error"
    >
      <template
        v-for="(error, key) in errors"
        :key="key"
      >
        <p v-if="error">{{ error }}</p>
      </template>
    </div>
    <div class="actions">
      <button
        type="button"
        @click="reset"
        class="button stoneButton item-reset"
        data-tooltip="Reset all options to their default values."
      >
        <i class="fas fa-undo"></i>
      </button>
      <button type="submit">Execute</button>
    </div>
  </form>
</template>
<style>
.beast-dice-pool-options {
  --background-button: linear-gradient(#6cb0d2a1, #2f4a568c);
  --background-button-remove: linear-gradient(#d8464e9e, #3f050bad);
  --background-button-add: linear-gradient(#74d244a6, #425612a3);

  display: flex;
  flex-direction: column;
  gap: 1rem;
  min-width: 500px;

  &.loading {
    opacity: 0.5;
    pointer-events: none;
  }

  & .title-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  & .actions {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }

  & fieldset {
    display: flex;
    flex-direction: column;
    gap: 8px;

    & legend {
      display: flex;
      gap: 8px;
    }
  }

  .list-dice-pools {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 0;
    margin: 0;
    list-style-type: none;
  }

  & .dice-pool {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 16px;

    & input {
      padding: 8px;
      margin: 0;
      font-size: 1rem;
    }

    & [name="name"],
    & [name="condition"] {
      width: 120px;
    }

    & [name="num"] {
      width: 60px;
      background: linear-gradient(
        oklch(0.65 0.12 336 / 0.6),
        oklch(0.39 0.04 336 / 0.5)
      );
    }
  }

  & label.roll-option {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 8px;

    & p {
      min-width: 150px;
      margin: 0;
      flex-shrink: 0;
    }

    & input {
      width: 100%;
      padding: 8px;
      font-size: 1rem;
    }

    & input[type="checkbox"] {
      width: max-content;
    }
  }

  & .item-delete {
    display: flex;
    padding: 4px 8px;
    background: var(--background-button-remove);
    text-align: center;
  }

  & .item-add {
    display: flex;
    padding: 4px 8px;
    background: var(--background-button-add);
    text-align: center;
  }

  & .error {
    background: var(--color-level-error-bg);
    font-weight: bold;
    padding: 8px;
  }

  & button.roll-fate {
    min-width: 100px;
    background: var(--background-button);
  }

  & button[type="submit"] {
    min-width: 200px;
    background: var(--background-button);
  }
}
</style>

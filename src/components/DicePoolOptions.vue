<script lang="ts" setup>
import { Clone, Handlize } from "@/scripts/utils/data";
import { Logger } from "@/scripts/utils/logging";
import type { DicePoolForm } from "@/scripts/utils/rolls/dice-pool-form";
import {
  DEFAULT_ROLL_OPTIONS,
  printDicePool,
} from "@/scripts/utils/rolls/rolls";
import { useLocalStorage } from "@vueuse/core";
import { computed, reactive, ref, shallowRef, watch, type PropType } from "vue";

const props = defineProps({
  application: {
    type: Object as PropType<DicePoolForm | null>,
    default: null,
  },
});
const dicePoolOptions = ref({
  cat: "UnCategorized",
  name: "Roll",
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
      dicePoolOptions.value = { cat, name };

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

async function onSubmit(event: SubmitEvent) {
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
      props.application.dicePoolOptions = dicePoolOptions.value;
      props.application.dicePoolOptions.rollOptions = rollOptions.value;
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
function removeFromPool(index: number) {
  // check that theere is at least one dice pool remaining
  if (rollOptions.value.dicePools.length <= 1) {
    errors.lastPool = "There must be at least one die remaining.";
    return;
  } else {
    errors.lastPool = undefined;
  }

  rollOptions.value.dicePools.splice(index, 1);
}
function clearPool() {
  rollOptions.value.dicePools = Clone(DEFAULT_ROLL_OPTIONS.dicePools);
}
function reset() {
  rollOptions.value = Clone(DEFAULT_ROLL_OPTIONS);
}
</script>
<template>
  <form
    class="beast-dice-pool-options"
    :class="{ loading }"
    @submit.prevent="onSubmit"
  >
    <h3
      style="width: max-content"
      data-tooltip="Who you are rolling as"
    >
      {{ dicePoolOptions.name }}
    </h3>
    <fieldset>
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
      <template
        v-for="(dicePool, index) in rollOptions.dicePools"
        :key="index"
      >
        <label :data-tooltip="`Number of dice because of ${dicePool.name}.`">
          <input
            data-tooltip="The name of the dice, used for display purposes."
            type="text"
            v-model="dicePool.name"
          />
          <input
            data-tooltip="The number of dice to roll."
            type="number"
            v-model.number="dicePool.num"
            min="0"
            max="100"
          />
          <button
            type="button"
            @click="removeFromPool(index)"
            class="button stoneButton item-delete"
            data-tooltip="Remove these dice from the roll."
          >
            <i class="fas fa-times-circle"></i>
          </button>
        </label>
      </template>
    </fieldset>

    <label data-tooltip="What the dice need to meet or beat to succeed.">
      <p>Success Threshold:</p>
      <input
        type="number"
        v-model.number="rollOptions.successThreshold"
        min="2"
        max="10"
      />
    </label>
    <label data-tooltip="What the dice need to meet or beat to explode.">
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
    <label>
      <p>Rote Quality:</p>
      <input
        type="checkbox"
        v-model="rollOptions.rote"
      />
    </label>
    <label data-tooltip="The number of times to repeat the roll.">
      <p>Amount:</p>
      <input
        type="number"
        v-model.number="rollOptions.amount"
        min="1"
        max="100"
      />
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

  & label {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 16px;

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
      width: 20px;
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

  & button[type="submit"] {
    min-width: 200px;
    background: var(--background-button);
  }
}
</style>

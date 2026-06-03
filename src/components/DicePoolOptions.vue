<script lang="ts" setup>
import { Clone } from "@/scripts/utils/data";
import { Logger } from "@/scripts/utils/logging";
import type { DicePoolForm } from "@/scripts/utils/rolls/dice-pool-form";
import {
  DEFAULT_ROLL_OPTIONS,
  printDicePool,
} from "@/scripts/utils/rolls/rolls";
import { computed, ref, watch, type PropType } from "vue";

const props = defineProps({
  application: {
    type: Object as PropType<DicePoolForm | null>,
    default: null,
  },
});
const dicePoolOptions = ref({
  cat: "",
  name: "",
  rollOptions: Clone(DEFAULT_ROLL_OPTIONS),
});
watch(
  () => props.application,
  (newApp) => {
    if (newApp?.dicePoolOptions) {
      dicePoolOptions.value = {
        cat: newApp.dicePoolOptions.cat,
        name: newApp.dicePoolOptions.name,
        rollOptions: {
          ...DEFAULT_ROLL_OPTIONS,
          ...newApp.dicePoolOptions.rollOptions,
        },
      };
    }
  },
  { deep: false, immediate: true },
);
const loading = computed(() => !props.application);

async function onSubmit(event: SubmitEvent) {
  try {
    Logger("Form Submitted", { event });

    if (dicePoolOptions.value && props.application) {
      props.application.dicePoolOptions = dicePoolOptions.value;
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
</script>
<template>
  <form
    class="beast-dice-pool-options"
    :class="{ loading }"
    @submit.prevent="onSubmit"
  >
    <label title="The number of dice to roll.">
      <p>Dice Pool:</p>
      <input
        type="number"
        v-model.number="dicePoolOptions.rollOptions.dicePool"
        min="1"
        max="100"
      />
    </label>
    <label title="What the dice need to meet or beat to succeed.">
      <p>Success Threshold:</p>
      <input
        type="number"
        v-model.number="dicePoolOptions.rollOptions.successThreshold"
        min="2"
        max="10"
      />
    </label>
    <label title="What the dice need to meet or beat to explode.">
      <p>Explodes Threshold:</p>
      <input
        type="number"
        v-model.number="dicePoolOptions.rollOptions.explodesThreshold"
        min="2"
        max="10"
      />
    </label>
    <label>
      <p>Rote Quality:</p>
      <input
        type="checkbox"
        v-model="dicePoolOptions.rollOptions.rote"
      />
    </label>
    <label title="The number of times to repeat the roll.">
      <p>Amount:</p>
      <input
        type="number"
        v-model.number="dicePoolOptions.rollOptions.amount"
        min="1"
        max="100"
      />
    </label>
    <button type="submit">Execute</button>
  </form>
</template>
<style>
.beast-dice-pool-options {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  min-width: 500px;

  &.loading {
    opacity: 0.5;
    pointer-events: none;
  }

  & label {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 0.5rem;

    & p {
      margin: 0;
      flex-shrink: 0;
    }

    & input {
      width: 100%;
      padding: 0.5rem;
      font-size: 1rem;
    }
  }
}
</style>

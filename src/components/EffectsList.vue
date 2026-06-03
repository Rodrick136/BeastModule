<script lang="ts" setup>
import type * as TYPES from "@/types/beast-types";
import * as DATA from "@/scripts/utils/data";

import { computed, ref, useModel, type Ref } from "vue";
const props = defineProps<{
  type: keyof TYPES.TabMap;
  cat: string;
  index: number;
  item:
    | TYPES.Atavism
    | TYPES.Nightmare
    | TYPES.Gift
    | TYPES.LairTraitV1
    | TYPES.Chamber;
}>();
const item = useModel(props, "item");
type Keys = Array<keyof typeof item.value.effects>;

const keys = computed(() => Object.keys(item.value.effects) as Keys);
</script>
<template>
  <h6>Effects:</h6>
  <template v-for="key in keys">
    <div class="form-line">
      <p>{{ DATA.EffectKeyToTitleMap[key] }}</p>
      <textarea
        :data-name="`${type}__state.${cat}[${index}].effects.${key}`"
        placeholder="Effects..."
        v-model="item.effects[key]"
      ></textarea>
    </div>
  </template>
</template>

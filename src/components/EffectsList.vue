<script lang="ts" setup>
import * as DATA from "@/scripts/utils/data";
import { computed, ref, useModel, type Ref } from "vue";
const props = defineProps<{
  type: keyof DATA.TabMap;
  cat: string;
  index: number;
  item: DATA.Atavism | DATA.Nightmare | DATA.Gift | DATA.LairTraitV1;
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

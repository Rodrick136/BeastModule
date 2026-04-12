<script lang="ts" setup>
import * as DATA from "@/scripts/utils/data";
import { Logger } from "@/scripts/utils/logging";
import { onMounted } from "vue";

const props = defineProps<{
  id: string;
}>();
const { state, save } = DATA.useTabStorage(props.id, "LIFE");

onMounted(() => {
  Logger("LifeTab Component was Mounted");
});
</script>
<template>
  <div
    class="item-stat-block"
    @change.stop.prevent="save"
  >
    <div class="form-line">
      <h5>Name</h5>
      <input
        data-name="LIFE__state.name"
        type="text"
        v-model="state.name"
      />
    </div>

    <div class="form-line">
      <h5>Occupation</h5>
      <input
        data-name="LIFE__state.occupation"
        type="text"
        v-model="state.occupation"
      />
    </div>

    <div class="form-line">
      <h5>Identity</h5>
      <textarea
        data-name="LIFE__state.identity"
        placeholder="Identity..."
        v-model="state.identity"
      ></textarea>
    </div>

    <div class="form-line">
      <h5>Notes</h5>
      <textarea
        data-name="LIFE__state.notes"
        placeholder="Notes..."
        v-model="state.notes"
      ></textarea>
    </div>
  </div>
</template>

<script lang="ts" setup>
import * as DATA from "@/scripts/utils/data";
import { Logger } from "@/scripts/utils/logging";
import { onMounted, shallowRef } from "vue";

const props = defineProps<{
  id: string;
}>();
const { state, save } = DATA.useTabStorage(props.id, "LIFE");

const isGM = Boolean(game.user?.isGM);
const showAuditLog = shallowRef(false);

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

    <template v-if="isGM">
      <h5>
        Audit Log
        <span
          class="button stoneButton item-edit"
          title="Show"
          ><i
            class="fas"
            :class="{
              'fa-eye': !showAuditLog,
              'fa-window-minimize': showAuditLog,
            }"
            @click.prevent="showAuditLog = !showAuditLog"
          ></i
        ></span>
      </h5>
      <div
        v-if="showAuditLog"
        class="form-line"
        style="display: flex"
      >
        <div class="history-items">
          <div
            v-for="(item, index) in state.history.toReversed()"
            class="history-item"
          >
            <p>
              #{{ index }} | OP: {{ item.op }} | At:
              {{ new Date(item.at || Date()).toLocaleString() }} | Path:
              {{ item.path.join(", ") }}
            </p>
            <pre>{{
              JSON.stringify(
                {
                  value: item.value,
                  og_value: item.og_value,
                },
                null,
                2,
              )
            }}</pre>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

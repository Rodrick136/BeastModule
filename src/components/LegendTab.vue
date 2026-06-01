<script lang="ts" setup>
import * as DATA from "@/scripts/utils/data";
import { computed, shallowRef, useTemplateRef, watch } from "vue";
import EffectsList from "./EffectsList.vue";
import { renderDicePoolForm } from "@/scripts/utils/rolls/rolls";
import { useThrottleFn } from "@vueuse/core";

const props = defineProps<{
  id: string;
}>();
const { state, save } = DATA.useTabStorage(props.id, "LEGEND");

const isGM = Boolean(game.user?.isGM);
const showAuditLog = shallowRef(false);
const actor = game.actors?.get(props.id);
const system = actor?.system as any;
const variant = system?.characterVariant || "beast";

const setSatiety = useThrottleFn((newSatiety: number) => {
  state.value.satiety = Math.max(0, Math.min(10, newSatiety));
}, 500);
const satiety = computed({
  get() {
    return state.value.satiety || 0;
  },
  set: setSatiety,
});
const satiety_condition = computed<(typeof DATA.SatietyConditionMap)[number]>(
  () => {
    return (
      DATA.SatietyConditionMap[satiety.value] ?? DATA.SatietyConditionMap[0]
    );
  },
);

const lair_el = useTemplateRef("lair");
watch(
  () => state.value.lair,
  (newValue) => {
    if (lair_el.value) {
      lair_el.value.value = newValue.toString();
      lair_el.value.dispatchEvent(
        new Event("change", {
          bubbles: true,
        }),
      );
    }
  },
  {
    immediate: false,
    deep: false,
  },
);

const lairTraits = computed(() => {
  const results = [];
  for (const lairTrait of state.value.lairTraits) {
    if ("__version" in lairTrait && lairTrait.__version === 1) {
      results.push(lairTrait);
    } else {
      // Handle legacy lair traits without __version
      results.push({
        __version: 1,
        edit: true,
        name: lairTrait.name,
        desc: "effect" in lairTrait ? lairTrait.effect : "",
        effects: "effects" in lairTrait ? lairTrait.effects : { normal: "" },
      } satisfies DATA.LairTrait);
    }
  }
  return results;
});
const addLairTrait = () => {
  if (!state.value.lairTraits.length) {
    state.value.lairTraits = [];
  }
  state.value.showLairTraits = true;
  const item: DATA.LairTrait = {
    __version: 1,
    edit: true,
    name: "Lair Trait",
    desc: "",
    effects: {
      normal: "",
    },
  };
  state.value.lairTraits.push(item);
};
const lairTraits_deleted = useTemplateRef("lairTraits.deleted");
const deleteLairTrait = async (index: number) => {
  const confirm = await DATA.ConfirmationPrompt();
  if (!confirm) return;

  const deleted_trait = state.value.lairTraits[index];
  const new_traits = state.value.lairTraits.filter((item, i) => index !== i);
  state.value.lairTraits = new_traits;

  ui.notifications?.info(`Deleted trait with name: ${deleted_trait?.name}`);

  const el = lairTraits_deleted;
  if (el.value) {
    el.value.value = deleted_trait?.name || "";
    el.value.dispatchEvent(
      new Event("change", {
        bubbles: true,
      }),
    );
  }
};

const addNightmare = () => {
  if (!state.value.nightmares) {
    state.value.nightmares = [];
  }
  state.value.showNightmares = true;
  const item = {
    edit: true,
    name: "Nightmare",
    dicePool: 0,
    effects: {
      normal: "",
      highSatiety: "",
      satietyExpenditure: "",
      exceptionalSuccess: "",
      misc: "",
    },
  };
  state.value.nightmares.push(item);
};
const nightmares_deleted = useTemplateRef("nightmares.deleted");
const deleteNightmare = async (index: number) => {
  const confirm = await DATA.ConfirmationPrompt();
  if (!confirm) return;

  const deleted_item = state.value.nightmares[index];
  const new_items = state.value.nightmares.filter((item, i) => index !== i);
  state.value.nightmares = new_items;

  ui.notifications?.info(`Deleted nightmare with name: ${deleted_item?.name}`);

  const el = nightmares_deleted;
  if (el.value) {
    el.value.value = deleted_item?.name || "";
    el.value.dispatchEvent(
      new Event("change", {
        bubbles: true,
      }),
    );
  }
};

const addAtavism = () => {
  if (!state.value.atavisms) {
    state.value.atavisms = [];
  }
  state.value.showAtavisms = true;
  const item: DATA.Atavism = {
    edit: true,
    name: "Atavism",
    dicePool: 0,
    actionCost: 0,
    effects: {
      normal: "",
      lowSatiety: "",
      satietyExpenditure: "",
      misc: "",
    },
  };
  state.value.atavisms.push(item);
};
const atavisms_deleted = useTemplateRef("atavisms.deleted");
const deleteAtavism = async (index: number) => {
  const confirm = await DATA.ConfirmationPrompt();
  if (!confirm) return;

  const deleted_item = state.value.atavisms[index];
  const new_items = state.value.atavisms.filter((item, i) => index !== i);
  state.value.atavisms = new_items;

  ui.notifications?.info(`Deleted atavism with name: ${deleted_item?.name}`);

  const el = atavisms_deleted;
  if (el.value) {
    el.value.value = deleted_item?.name || "";
    el.value.dispatchEvent(
      new Event("change", {
        bubbles: true,
      }),
    );
  }
};

const addGift = () => {
  if (!state.value.gifts) {
    state.value.gifts = [];
  }
  state.value.showGifts = true;
  const item: DATA.Gift = {
    edit: true,
    name: "Gift",
    dicePool: 0,
    actionCost: 0,
    effects: {
      normal: "",
      active: "",
    },
  };
  state.value.gifts.push(item);
};
const gifts_deleted = useTemplateRef("gifts.deleted");
const deleteGift = async (index: number) => {
  const confirm = await DATA.ConfirmationPrompt();
  if (!confirm) return;

  const deleted_item = state.value.gifts[index];
  const new_items = state.value.gifts.filter((item, i) => index !== i);
  state.value.gifts = new_items;

  ui.notifications?.info(`Deleted gift with name: ${deleted_item?.name}`);

  const el = gifts_deleted;
  if (el.value) {
    el.value.value = deleted_item?.name || "";
    el.value.dispatchEvent(
      new Event("change", {
        bubbles: true,
      }),
    );
  }
};
</script>
<template>
  <div
    v-if="actor"
    class="legend-tab-sheet item-stat-block"
    @change.stop.prevent="save"
  >
    <div style="display: flex; gap: 1rem">
      <div class="identity-block">
        <h5>Identity</h5>
        <div class="form-line">
          <h5>
            Title
            <template v-if="variant === 'beast'">
              <span title="The name of your Horror">
                <i class="fas fa-circle-info"></i>
              </span>
            </template>
            <template v-if="variant === 'hero'">
              <span title="The name of your Hero Persona">
                <i class="fas fa-circle-info"></i>
              </span>
            </template>
          </h5>
          <input
            data-name="LEGEND__state.title"
            type="text"
            v-model="state.title"
          />
        </div>
        <div class="form-line">
          <h5>Concept</h5>
          <input
            data-name="LEGEND__state.concept"
            type="text"
            v-model="state.concept"
          />
        </div>
        <template v-if="variant === 'beast'">
          <div class="form-line">
            <h5>Family</h5>
            <input
              data-name="LEGEND__state.family"
              type="text"
              v-model="state.family"
            />
          </div>
          <div class="form-line">
            <h5>Hunger</h5>
            <input
              data-name="LEGEND__state.hunger"
              type="text"
              v-model="state.hunger"
            />
          </div>
        </template>
      </div>
      <template v-if="variant === 'beast'">
        <div style="width: 100%">
          <h5>Tracks</h5>
          <div class="form-line">
            <h5>Satiety</h5>
            <div style="display: flex; gap: 1rem">
              <input
                data-name="LEGEND__state.satiety"
                type="number"
                v-model.number="satiety"
                min="0"
                max="10"
              />
              <p
                style="margin: 0.25em"
                title="Satiety Condition"
              >
                {{ satiety_condition.lang }}
              </p>
            </div>
          </div>
          <div class="form-line">
            <h5>Lair</h5>
            <div style="display: flex; gap: 4px">
              <input
                data-name="LEGEND__state.lair"
                type="hidden"
                ref="lair"
              />
              <template
                v-for="n in 10"
                :key="`dots-${n}__${state.lair}`"
              >
                <input
                  class="lair-dot-input"
                  :title="`${n}`"
                  type="radio"
                  :checked="n <= state.lair"
                  @click.prevent="state.lair = n"
                />
              </template>
            </div>
          </div>
        </div>
      </template>
    </div>
    <template v-if="variant === 'beast'">
      <div class="form-line">
        <h5>Birthright</h5>
        <textarea
          data-name="LEGEND__state.birthright"
          placeholder="Birthright..."
          v-model="state.birthright"
        ></textarea>
      </div>

      <div class="form-line">
        <h5>Satiety Preferences</h5>
        <textarea
          data-name="LEGEND__state.satietyPreferences"
          placeholder="Satiety Preferences..."
          v-model="state.satietyPreferences"
        ></textarea>
      </div>

      <h5>Liar Traits</h5>
      <input
        data-name="LEGEND__state.lairTraits.deleted"
        type="hidden"
        ref="lairTraits.deleted"
      />
      <table class="item-table">
        <thead>
          <tr class="item-row header">
            <th class="cell header first">
              <span
                class="collapsible button fas"
                :class="{
                  'fa-minus-square': state.showLairTraits,
                  'fa-plus-square': !state.showLairTraits,
                }"
                @click.prevent="state.showLairTraits = !state.showLairTraits"
              >
              </span>
              Name
            </th>
            <th
              class="cell header"
              :style="{
                textAlign: 'left',
                width: '60%',
              }"
            >
              Description
            </th>
            <th
              class="cell header button item-create"
              @click.prevent.stop="addLairTrait()"
            >
              + Add
            </th>
          </tr>
        </thead>
        <tbody
          v-if="state.showLairTraits"
          style="text-align: left"
        >
          <template
            v-for="(item, index) in lairTraits"
            :key="`lairTrait-${index}`"
          >
            <tr class="item-row item">
              <td
                class="cell item-name"
                :class="{
                  lastRow: index === state.lairTraits.length - 1,
                }"
              >
                <input
                  :data-name="`LEGEND__state.lairTraits[${index}].name`"
                  type="text"
                  v-model="item.name"
                />
              </td>
              <td
                class="cell"
                style="width: 60%"
                :class="{
                  lastRow: index === lairTraits.length - 1,
                }"
              >
                <input
                  :data-name="`LEGEND__state.lairTraits[${index}].effect`"
                  type="text"
                  v-model="item.desc"
                />
              </td>
              <td
                class="cell cell--buttons"
                :class="{
                  lastRow: index === lairTraits.length - 1,
                }"
              >
                <span
                  class="button stoneButton item-edit"
                  title="Edit Item"
                  @click.prevent="item.edit = !item.edit"
                  ><i
                    class="fas"
                    :class="{
                      'fa-edit': !item.edit,
                      'fa-window-minimize': item.edit,
                    }"
                  ></i
                ></span>
                <span
                  class="button stoneButton item-delete"
                  title="Delete Item"
                  @click.prevent.stop="deleteLairTrait(index)"
                  ><i class="fas fa-times-circle"></i
                ></span>
              </td>
            </tr>
            <tr v-if="item.edit">
              <td
                class="cell"
                colspan="3"
              >
                <EffectsList
                  type="LEGEND"
                  cat="lairTraits"
                  :index="index"
                  :item="item"
                />
              </td>
            </tr>
          </template>
        </tbody>
      </table>

      <h5>Nightmares</h5>
      <table class="item-table">
        <thead>
          <tr class="item-row header">
            <th class="cell header first">
              <span
                class="collapsible button fas"
                :class="{
                  'fa-minus-square': state.showNightmares,
                  'fa-plus-square': !state.showNightmares,
                }"
                @click.prevent="state.showNightmares = !state.showNightmares"
              >
              </span>
              Name
            </th>
            <th
              class="cell header"
              :style="{
                textAlign: 'left',
              }"
            >
              Dice Pool
            </th>
            <th
              class="cell header button item-create"
              @click.prevent.stop="addNightmare()"
            >
              + Add
            </th>
          </tr>
        </thead>
        <tbody
          v-if="state.showNightmares"
          style="text-align: left"
        >
          <input
            data-name="LEGEND__state.nightmares.deleted"
            type="hidden"
            ref="nightmares.deleted"
          />
          <template v-for="(item, index) in state.nightmares">
            <tr class="item-row item">
              <td class="cell item-name">
                <input
                  :data-name="`LEGEND__state.nightmares[${index}].name`"
                  type="text"
                  v-model="item.name"
                />
              </td>
              <td class="cell item-name">
                <input
                  :data-name="`LEGEND__state.nightmares[${index}].dicePool`"
                  type="number"
                  v-model="item.dicePool"
                />
              </td>
              <td class="cell cell--buttons">
                <span
                  class="button stoneButton item-edit"
                  title="Roll Nightmare"
                  @click.prevent="
                    renderDicePoolForm(actor, {
                      cat: 'Nightmare',
                      name: item.name,
                      rollOptions: {
                        dicePool: item.dicePool,
                      },
                    })
                  "
                  ><i class="fas fa-dice-d10"></i
                ></span>
                <span
                  class="button stoneButton item-edit"
                  title="Edit Item"
                  @click.prevent="item.edit = !item.edit"
                  ><i
                    class="fas"
                    :class="{
                      'fa-edit': !item.edit,
                      'fa-window-minimize': item.edit,
                    }"
                  ></i
                ></span>
                <span
                  class="button stoneButton item-delete"
                  title="Delete Item"
                  @click.prevent.stop="deleteNightmare(index)"
                  ><i class="fas fa-times-circle"></i
                ></span>
              </td>
            </tr>
            <tr v-if="item.edit">
              <td
                class="cell"
                colspan="3"
              >
                <EffectsList
                  type="LEGEND"
                  cat="nightmares"
                  :index="index"
                  :item="item"
                />
              </td>
            </tr>
          </template>
        </tbody>
      </table>

      <h5>Atavisms</h5>
      <input
        data-name="LEGEND__state.atavisms.deleted"
        type="hidden"
        ref="atavisms.deleted"
      />
      <table class="item-table">
        <thead>
          <tr class="item-row header">
            <th class="cell header first">
              <span
                class="collapsible button fas"
                :class="{
                  'fa-minus-square': state.showAtavisms,
                  'fa-plus-square': !state.showAtavisms,
                }"
                @click.prevent="state.showAtavisms = !state.showAtavisms"
              >
              </span>
              Name
            </th>
            <th
              class="cell header"
              :style="{
                textAlign: 'left',
              }"
            >
              Dice Pool
            </th>
            <th
              class="cell header"
              :style="{
                textAlign: 'left',
              }"
            >
              Action Cost
            </th>
            <th
              class="cell header button item-create"
              @click.prevent.stop="addAtavism()"
            >
              + Add
            </th>
          </tr>
        </thead>
        <tbody
          v-if="state.showAtavisms"
          style="text-align: left"
        >
          <template v-for="(item, index) in state.atavisms">
            <tr class="item-row item">
              <td class="cell item-name">
                <input
                  :data-name="`LEGEND__state.atavisms[${index}].name`"
                  type="text"
                  v-model="item.name"
                />
              </td>
              <td class="cell item-name">
                <input
                  :data-name="`LEGEND__state.atavisms[${index}].dicePool`"
                  type="number"
                  v-model="item.dicePool"
                />
              </td>
              <td class="cell item-name">
                <input
                  :data-name="`LEGEND__state.atavisms[${index}].actionCost`"
                  type="number"
                  v-model="item.actionCost"
                />
              </td>
              <td class="cell cell--buttons">
                <span
                  class="button stoneButton item-edit"
                  title="Roll Atavism"
                  @click.prevent="
                    renderDicePoolForm(actor, {
                      cat: 'Atavism',
                      name: item.name,
                      rollOptions: {
                        dicePool: item.dicePool,
                      },
                    })
                  "
                  ><i class="fas fa-dice-d10"></i
                ></span>
                <span
                  class="button stoneButton item-edit"
                  title="Edit Item"
                  @click.prevent="item.edit = !item.edit"
                  ><i
                    class="fas"
                    :class="{
                      'fa-edit': !item.edit,
                      'fa-window-minimize': item.edit,
                    }"
                  ></i
                ></span>
                <span
                  class="button stoneButton item-delete"
                  title="Delete Item"
                  @click.prevent.stop="deleteAtavism(index)"
                  ><i class="fas fa-times-circle"></i
                ></span>
              </td>
            </tr>
            <tr v-if="item.edit">
              <td
                class="cell"
                colspan="3"
              >
                <EffectsList
                  type="LEGEND"
                  cat="atavisms"
                  :index="index"
                  :item="item"
                />
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </template>
    <template v-if="variant === 'hero'">
      <div class="form-line">
        <h5>Team</h5>
        <input
          data-name="LEGEND__state.team"
          type="text"
          v-model="state.team"
        />
      </div>

      <h5>Gifts</h5>
      <input
        data-name="LEGEND__state.gifts.deleted"
        type="hidden"
        ref="gifts.deleted"
      />
      <table class="item-table">
        <thead>
          <tr class="item-row header">
            <th class="cell header first">
              <span
                class="collapsible button fas"
                :class="{
                  'fa-minus-square': state.showGifts,
                  'fa-plus-square': !state.showGifts,
                }"
                @click.prevent="state.showGifts = !state.showGifts"
              >
              </span>
              Name
            </th>
            <th
              class="cell header"
              :style="{
                textAlign: 'left',
              }"
            >
              Dice Pool
            </th>
            <th
              class="cell header"
              :style="{
                textAlign: 'left',
              }"
            >
              Action Cost
            </th>
            <th
              class="cell header button item-create"
              @click.prevent.stop="addGift()"
            >
              + Add
            </th>
          </tr>
        </thead>
        <tbody
          v-if="state.showGifts"
          style="text-align: left"
        >
          <template v-for="(item, index) in state.gifts">
            <tr class="item-row item">
              <td class="cell item-name">
                <input
                  :data-name="`LEGEND__state.gifts[${index}].name`"
                  type="text"
                  v-model="item.name"
                />
              </td>
              <td class="cell item-name">
                <input
                  :data-name="`LEGEND__state.gifts[${index}].dicePool`"
                  type="number"
                  v-model="item.dicePool"
                />
              </td>
              <td class="cell item-name">
                <input
                  :data-name="`LEGEND__state.gifts[${index}].actionCost`"
                  type="number"
                  v-model="item.actionCost"
                />
              </td>
              <td class="cell cell--buttons">
                <span
                  class="button stoneButton item-edit"
                  title="Roll Gift"
                  @click.prevent="
                    renderDicePoolForm(actor, {
                      cat: 'Gift',
                      name: item.name,
                      rollOptions: {
                        dicePool: item.dicePool,
                      },
                    })
                  "
                  ><i class="fas fa-dice-d10"></i
                ></span>
                <span
                  class="button stoneButton item-edit"
                  title="Edit Item"
                  @click.prevent="item.edit = !item.edit"
                  ><i
                    class="fas"
                    :class="{
                      'fa-edit': !item.edit,
                      'fa-window-minimize': item.edit,
                    }"
                  ></i
                ></span>
                <span
                  class="button stoneButton item-delete"
                  title="Delete Item"
                  @click.prevent.stop="deleteGift(index)"
                  ><i class="fas fa-times-circle"></i
                ></span>
              </td>
            </tr>
            <tr v-if="item.edit">
              <td
                class="cell"
                colspan="3"
              >
                <EffectsList
                  type="LEGEND"
                  cat="gifts"
                  :index="index"
                  :item="item"
                />
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </template>

    <h5>Other</h5>
    <div class="form-line">
      <h6>Notes</h6>
      <textarea
        data-name="LEGEND__state.notes"
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
        <div
          class="history-items"
          v-once
        >
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
<style>
.legend-tab-sheet .lair-dot-input {
  width: 20px;
  height: 20px;
}

.legend-tab-sheet .history-items {
  width: 100%;
  height: auto;
}

.cell--buttons {
  display: flex;
  gap: 0.5rem;
}

.dice-tooltip .dice-rolls {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: flex-start;
  row-gap: 0.5rem;
}
.die-result {
  display: flex;
  flex-direction: column;
  width: 24px;
}
.die-result p {
  margin: 0;
}
</style>

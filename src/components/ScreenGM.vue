<script lang="ts" setup>
import type { ScreenGM } from "@/scripts/screen-gm/application";
import {
  Clone,
  RetrieveModuleData,
  StoreModuleData,
} from "@/scripts/utils/data";
import { Logger } from "@/scripts/utils/logging";
import { BeatPrompt } from "@/scripts/utils/prompts";
import { html, id } from "common-tags";
import type { PropType } from "vue";
import {
  computed,
  onBeforeUnmount,
  onMounted,
  ref,
  shallowRef,
  watch,
} from "vue";

const isGM = game.user?.isGM;
if (!isGM) {
  throw new Error("ScreenGM component can only be used by a GM user.");
}

const props = defineProps({
  application: {
    type: Object as PropType<ScreenGM>,
    required: true,
  },
  context: {
    type: Object as PropType<any>,
    required: true,
  },
});
const initialStoredData = RetrieveModuleData();
const data = ref(initialStoredData);
const showRawData = shallowRef(false);

const addBeat = async () => {
  const prompt = await BeatPrompt();
  if (!prompt?.reason) return;
  if (!prompt?.beats) return;

  const newBeat = {
    id: crypto.randomUUID(),
    at: new Date().toISOString(),
    reason: prompt.reason,
    value: prompt.beats,
  };
  data.value.experience.beats.push(newBeat);

  // Update the module data with the new beat
  await StoreModuleData(data.value);

  ChatMessage.create(
    {
      speaker: ChatMessage.getSpeaker({
        alias: "Game Master",
      }),
      flavor: "New Group Beat Added",
      content: html`
        <p><strong>Reason:</strong> ${prompt.reason}</p>
        <p><strong>Beats:</strong> ${prompt.beats}</p>
      `,
      sound: "modules/beast/assets/beat-click.mp3",
    },
    {
      rollMode: "publicroll",
      chatBubble: false,
    },
  );

  try {
    // update character sheets with new beat
    if (!game.actors) {
      return;
    }
    const actors = Array.from(game.actors) as Actor[];
    for (const actor of actors) {
      const playerOwned = true; //actor.hasPlayerOwner;
      // @ts-expect-error
      const isCharacter = actor.type === "character";
      if (isCharacter && playerOwned) {
        const mtaBeat = {
          __beast_id: newBeat.id,
          name: newBeat.reason,
          beats: 0,
          arcaneBeats: newBeat.value,
        };

        // @ts-expect-error
        const currentProgress = Clone(actor.system?.progress ?? []) as Array<
          typeof mtaBeat
        >;
        currentProgress.push(mtaBeat);

        // @ts-expect-error
        await actor.update({ "system.progress": currentProgress });
      }
    }
  } catch (error) {
    Logger("Error updating character sheets with new beat", error, "error");
  }
};

Logger("ScreenGM Component rendered", props);
onMounted(() => {
  Logger("ScreenGM Component Mounted", props);
});
onBeforeUnmount(() => {
  Logger("ScreenGM Component Before Unmount", props);
});
</script>
<template>
  <div class="content-inner">
    <h1>GM Screen</h1>

    <section class="experience">
      <div class="experience--header">
        <h5>Experience</h5>
      </div>
      <div class="experience--content">
        <div class="actions">
          <button
            type="button"
            class="button stoneButton"
            @click.prevent="addBeat()"
          >
            Add Beat
          </button>
        </div>
      </div>
    </section>

    <section class="raw-data">
      <div class="raw-data--header">
        <h5>
          Data
          <span
            class="button stoneButton item-edit"
            title="Show"
            ><i
              class="fas"
              :class="{
                'fa-eye': !showRawData,
                'fa-window-minimize': showRawData,
              }"
              @click.prevent="showRawData = !showRawData"
            ></i
          ></span>
        </h5>
      </div>
      <div
        v-if="showRawData"
        class="raw-data--content"
      >
        <pre>{{ data }}</pre>
      </div>
    </section>
  </div>
</template>
<style>
#beast-gm-screen {
  & section {
    display: block;
    width: 100%;
    margin-top: 16px;
    margin-bottom: 16px;
  }

  & section:last-of-type {
    margin-bottom: 0;
  }

  & .content-inner {
    display: block;
    min-width: 800px;
    height: 100%;
  }

  & actions {
    display: flex;
    gap: 8px;
    width: 100%;
  }

  & .raw-data--header {
    display: flex;
    align-items: flex-start;
    justify-content: flex-end;
  }
}
</style>

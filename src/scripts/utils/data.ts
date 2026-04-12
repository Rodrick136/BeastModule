import { useStorageAsync, type StorageLikeAsync } from "@vueuse/core";
import { ref, shallowRef, toRaw } from "vue";
import { Logger } from "./logging";

const MODULE_SCOPE = "beast" as const;

export function StoreDataToActor(
  actor: any,
  key: string,
  value: unknown,
  scope = MODULE_SCOPE,
) {
  return actor.setFlag(scope, key, value) as Promise<void>;
}

export function RetrieveDataFromActor(
  actor: any,
  key: string,
  scope = MODULE_SCOPE,
) {
  return actor.getFlag(scope, key) as unknown | undefined;
}

type LIfeTabData = {
  type: "LIFE";
  name: string;
  identity: string;
  occupation: string;
  notes: string;
};
export const DEFAULT_LIFE_TAB_DATA: LIfeTabData = {
  type: "LIFE",
  name: "",
  identity: "",
  occupation: "",
  notes: "",
};

export type Nightmare = {
  edit: boolean;
  name: string;
  dicePool: number;
  effects: {
    normal: string;
    highSatiety: string;
    satietyExpenditure: string;
    exceptionalSuccess: string;
    misc: string;
  };
};
export type Atavism = {
  edit: boolean;
  name: string;
  dicePool: number;
  actionCost: number;
  effects: {
    normal: string;
    lowSatiety: string;
    satietyExpenditure: string;
    misc: string;
  };
};
export type Gift = {
  edit: boolean;
  name: string;
  dicePool: number;
  actionCost: number;
  effects: {
    normal: string;
    active: string;
  };
};

export type EffectKey =
  | keyof Atavism["effects"]
  | keyof Nightmare["effects"]
  | keyof Gift["effects"];
export const EffectKeyToTitleMap: Record<EffectKey, string> = {
  normal: "Normal",
  highSatiety: "Sigh Satiety",
  exceptionalSuccess: "Exceptional Success",
  lowSatiety: "Low Satiety",

  satietyExpenditure: "Satiety Expenditure",
  misc: "Miscellaneous",

  active: "Active",
};
export type LegendTabData = {
  type: "LEGEND";
  title: string;
  concept: string;
  notes: string;

  /* Beast's */
  family: string;
  hunger: string;
  horror: string;
  satietyCondition: string;
  birthright: string;
  lairTraits: Array<{
    name: string;
    effect: string;
  }>;
  showLairTraits: boolean;
  nightmares: Nightmare[];
  showNightmares: boolean;
  atavisms: Atavism[];
  showAtavisms: boolean;

  /* Hero's */
  team: string;
  gifts: Gift[];
  showGifts: boolean;
};
export const DEFAULT_LEGEND_TAB_DATA: LegendTabData = {
  type: "LEGEND",
  title: "",
  concept: "",
  notes: "",

  /* Beast's */
  family: "",
  hunger: "",
  horror: "",
  satietyCondition: "",
  birthright: "",
  lairTraits: [],
  showLairTraits: true,
  nightmares: [],
  showNightmares: true,
  atavisms: [],
  showAtavisms: true,

  /* Hero's */
  team: "",
  gifts: [],
  showGifts: true,
};
/*
satietyCondition needs to be dots and replaces with satietyPreferences here
also still needs lair dots

hero lair dots?
*/

export type TabMap = {
  LIFE: LIfeTabData;
  LEGEND: LegendTabData;
};

type TabData<T extends keyof TabMap> = TabMap[T];

function getDefaultTabData<T extends keyof TabMap>(type: T) {
  switch (type) {
    case "LIFE": {
      return DEFAULT_LIFE_TAB_DATA as TabData<T>;
    }
    case "LEGEND": {
      return DEFAULT_LEGEND_TAB_DATA as TabData<T>;
    }
  }
}

export function StoreTabData<T extends keyof TabMap>(
  id: string,
  type: T,
  value: TabData<T>,
) {
  const actor = game.actors?.get(id);
  if (actor) {
    const system = actor.system as any;
    const key = `${system.characterVariant}${type}`;
    return StoreDataToActor(actor, key, value);
  } else {
    throw new Error("No actor present when attempting to save data!");
  }
}

export function RetrieveTabData<T extends keyof TabMap>(id: string, type: T) {
  const actor = game.actors?.get(id);
  if (actor) {
    const system = actor.system as any;
    const key = `${system.characterVariant}${type}`;
    return RetrieveDataFromActor(actor, key) as TabData<T> | undefined;
  } else {
    throw new Error("No actor present when attempting to save data!");
  }
}

export function useTabStorage<T extends keyof TabMap>(id: string, type: T) {
  const state = ref(RetrieveTabData(id, type) || getDefaultTabData<T>(type));

  const save = (event: Event) => {
    Logger("LifeTab Component Data Changed", {
      id,
      state: state.value,
    });

    const sheetData = window.BeastEphemeralData.actors[id];
    if (sheetData) {
      sheetData.changedElement = event.target as HTMLElement;
    }

    const value = toRaw(state.value);
    return StoreTabData(id, type, value);
  };

  return { state, save };
}

export function ConfirmationPrompt() {
  return foundry.applications.api.DialogV2.confirm({
    window: { title: "Confirmation" },
    content: "<p>Are you sure?</p>",
  });
}

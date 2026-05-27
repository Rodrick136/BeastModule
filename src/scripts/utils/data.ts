import { ref, toRaw } from "vue";
import { Logger } from "./logging";
import { diff } from "just-diff";
import { cloneFnJSON } from "@vueuse/core";

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
  const result = actor.getFlag(scope, key);
  if (!result) return undefined;

  const data = cloneFnJSON(result);
  return data as unknown;
}

type HistoryItem = {
  op: "add" | "remove" | "replace";
  path: Array<string | number>;
  value: unknown;
  og_value: unknown;
  at: string;
};

type LIfeTabData = {
  type: "LIFE";
  history: HistoryItem[];
  name: string;
  identity: string;
  occupation: string;
  notes: string;
};
export const DEFAULT_LIFE_TAB_DATA: LIfeTabData = {
  type: "LIFE",
  history: [],
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
} as const;

export const SatietyConditions = [
  "STARED",
  "STARVING",
  "SATED",
  "HIGH",
  "GORGED",
] as const;
const SI_STARED = {
  type: "STARED",
  lang: "Stared",
} as const;
const SI_STARVING = {
  type: "STARVING",
  lang: "Starving",
} as const;
const SI_SATED = {
  type: "SATED",
  lang: "Sated",
} as const;
const SI_HIGH = {
  type: "HIGH",
  lang: "High",
} as const;
const SI_GORGED = {
  type: "GORGED",
  lang: "Gorged",
} as const;
/**
 * Condition the beast is in.
 * - 0 -> STARED
 * - 1-3 -> STARVING
 * - 4-6 -> SATED
 * - 7-9 -> HIGH
 * - 10 -> GORGED
 */
export const SatietyConditionMap = [
  SI_STARED, // 0
  SI_STARVING, // 1
  SI_STARVING, // 2
  SI_STARVING, // 3
  SI_SATED, // 4
  SI_SATED, // 5
  SI_SATED, // 6
  SI_HIGH, // 7
  SI_HIGH, // 8
  SI_HIGH, // 9
  SI_GORGED,
] as const;

export type LegendTabData = {
  type: "LEGEND";
  history: HistoryItem[];
  title: string;
  concept: string;
  notes: string;

  /* Beast's */
  family: string;
  hunger: string;
  horror: string;
  lair: number;
  satiety: number;
  satietyPreferences: string;
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
  history: [],
  title: "",
  concept: "",
  notes: "",

  /* Beast's */
  family: "",
  hunger: "",
  horror: "",
  lair: 1,
  satiety: 5,
  satietyPreferences: "",
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
  let result;
  switch (type) {
    case "LIFE": {
      result = DEFAULT_LIFE_TAB_DATA;
      break;
    }
    case "LEGEND": {
      result = DEFAULT_LEGEND_TAB_DATA;
      break;
    }
  }

  return JSON.parse(JSON.stringify(result)) as TabData<T>;
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

function getValueByPath(obj: any, path: (string | number)[]) {
  return path.reduce((current, key) => {
    // Check if current is a valid object/array and not null
    return typeof current === "object" && current !== null
      ? current[key]
      : undefined;
  }, obj);
}

export function useTabStorage<T extends keyof TabMap>(id: string, type: T) {
  const state = ref<TabData<T>>(
    RetrieveTabData(id, type) || getDefaultTabData<T>(type),
  );

  const save = (event: Event) => {
    const new_data = toRaw(state.value) as TabData<T>;
    const old_data = RetrieveTabData(id, type);
    const history = cloneFnJSON(old_data?.history ?? []);
    Logger("LifeTab Component Data Changed", {
      id,
      new_data,
      //old_data,
      //history,
    });

    if (old_data) {
      old_data.history = [];
      new_data.history = [];

      const delta = diff(old_data, new_data);
      if (delta.length > 0) {
        for (const change of delta) {
          const item: HistoryItem = {
            ...change,
            og_value: getValueByPath(old_data, change.path),
            at: new Date().toISOString(),
          };
          history.push(item);
        }
        Logger("Changes", {
          delta,
          history,
        });
        // only keep the last 100 items
        if (history.length > 100) {
          history.splice(0, history.length - 100);
        }
      } else {
        Logger("No change detected!", {
          old_data,
          new_data,
        });
      }
    }

    const target = event.target as HTMLElement | null;
    const sheetData = window.BeastEphemeralData.actors[id];
    if (target && sheetData) {
      sheetData.changedElement = target;

      const parent = target.closest<HTMLElement>(".window-content");
      if (parent) {
        sheetData.scrollY = parent.scrollTop;
      }
    }

    new_data.history = history;
    return StoreTabData(id, type, new_data);
  };

  return { state, save };
}

export function ConfirmationPrompt() {
  return foundry.applications.api.DialogV2.confirm({
    window: { title: "Confirmation" },
    content: "<p>Are you sure?</p>",
  });
}

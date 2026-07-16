import { ref, toRaw } from "vue";
import { Logger } from "./logging";
import { diff } from "just-diff";
import extend from "just-extend";
import type * as TYPES from "@/types/beast-types";
import { useThrottleFn } from "@vueuse/core";

const MODULE_SCOPE = "beast" as const;

const DEFAULT_MODULE_DATA: TYPES.ModuleData = {
  __version: 1,
  experience: {
    beats: [],
  },
};

export const DEFAULT_LIFE_TAB_DATA: TYPES.LIfeTabData = {
  type: "LIFE",
  history: [],
  name: "",
  identity: "",
  occupation: "",
  notes: "",
};

export const DEFAULT_LEGEND_TAB_DATA: TYPES.LegendTabData = {
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
  chambers: [],
  showChambers: true,
  nightmares: [],
  showNightmares: true,
  atavisms: [],
  showAtavisms: true,

  /* Hero's */
  team: "",
  gifts: [],
  showGifts: true,
};

export function Clone<T extends unknown>(data: T) {
  const value = toRaw(data);
  return JSON.parse(JSON.stringify(value)) as T;
}

export function RegisterModuleData() {
  return game.settings?.register(MODULE_SCOPE, "moduleData", {
    name: "Data Store for the Beast Module",
    scope: "world", // "world" makes it global database persistent
    config: false, // false hides it from the standard settings UI menu
    type: Object,
    default: DEFAULT_MODULE_DATA,
  });
}

export function RetrieveModuleData() {
  return Clone(
    game.settings?.get(MODULE_SCOPE, "moduleData") ?? DEFAULT_MODULE_DATA,
  );
}

const _storeModuleData = useThrottleFn(
  (data: TYPES.ModuleData) => {
    const obj = Clone(data);
    const value = extend(true, DEFAULT_MODULE_DATA, obj) as TYPES.ModuleData;
    return game.settings?.set(MODULE_SCOPE, "moduleData", value);
  },
  1000,
  true,
  true,
);
export function StoreModuleData(data: TYPES.ModuleData) {
  return _storeModuleData(data);
}

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

  const data = Clone(result);
  return data as unknown;
}

export const EffectKeyToTitleMap: Record<TYPES.EffectKey, string> = {
  normal: "Normal",
  highSatiety: "High Satiety",
  exceptionalSuccess: "Exceptional Success",
  lowSatiety: "Low Satiety",

  satietyExpenditure: "Satiety Expenditure",
  misc: "Miscellaneous",

  active: "Active",
} as const;

export const SatietyConditions = [
  "STARVED",
  "STARVING",
  "SATED",
  "HIGH",
  "GORGED",
] as const;
const SI_STARVED = {
  type: "STARVED",
  lang: "Starved",
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
  SI_STARVED, // 0
  SI_STARVING, // 1
  SI_STARVING, // 2
  SI_STARVING, // 3
  SI_SATED, // 4
  SI_SATED, // 5
  SI_SATED, // 6
  SI_HIGH, // 7
  SI_HIGH, // 8
  SI_HIGH, // 9
  SI_GORGED, // 10
] as const;

function getDefaultTabData<T extends keyof TYPES.TabMap>(type: T) {
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

  return Clone(result) as TYPES.TabData<T>;
}

export function StoreTabData<T extends keyof TYPES.TabMap>(
  id: string,
  type: T,
  value: TYPES.TabData<T>,
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

export function RetrieveTabData<T extends keyof TYPES.TabMap>(
  id: string,
  type: T,
) {
  const actor = game.actors?.get(id);
  if (actor) {
    const system = actor.system as any;
    const key = `${system.characterVariant}${type}`;

    const stored_data = RetrieveDataFromActor(actor, key) as TYPES.TabData<T> | undefined;
    if (!stored_data) return undefined;

    const default_data = getDefaultTabData<T>(type);
    const data = extend(true, default_data, stored_data) as TYPES.TabData<T>;
    return data;
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

export function useTabStorage<T extends keyof TYPES.TabMap>(
  id: string,
  type: T,
) {
  const state = ref<TYPES.TabData<T>>(
    RetrieveTabData(id, type) || getDefaultTabData<T>(type),
  );

  const save = (event: Event) => {
    const new_data = toRaw(state.value) as TYPES.TabData<T>;
    const old_data = RetrieveTabData(id, type);
    const history = Clone(old_data?.history ?? []);
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
          const item: TYPES.HistoryItem = {
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

export function Handlize(str: string) {
  return str
    .toLowerCase()
    // only allow a-z and 0-9, replace all other characters with a dash
    .replace(/[^a-z0-9]+/g, "-")
    // replace multiple dashes with a single dash
    .replace(/-+/g, "-")
    // remove leading and trailing dashes
    .replace(/^-+|-+$/g, "");
}

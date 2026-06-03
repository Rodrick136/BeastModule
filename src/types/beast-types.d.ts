export type ModuleData = {
  __version: 1;
  experience: {
    beats: Array<{
      id: string;
      at: string;
      reason: string;
      value: number;
    }>;
  };
};

declare module "fvtt-types/configuration" {
  interface SettingConfig {
    // Format: "namespace.key": TypeOfValueStored
    "beast.moduleData": ModuleData;
  }
}

export type HistoryItem = {
  op: "add" | "remove" | "replace";
  path: Array<string | number>;
  value: unknown;
  og_value: unknown;
  at: string;
};

export type LIfeTabData = {
  type: "LIFE";
  history: HistoryItem[];
  name: string;
  identity: string;
  occupation: string;
  notes: string;
};

export type LairTraitV1 = {
  __version: 1;
  edit: boolean;
  name: string;
  desc: string;
  effects: {
    normal: string;
  };
};

export type LairTrait =
  | LairTraitV1
  | {
    name: string;
    effect: string;
  };

export type Chamber = {
  __version: 1;
  edit: boolean;
  name: string;
  desc: string;
  effects: {
    normal: string;
  };
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

export type LegendTabData = {
  type: "LEGEND";
  history: TYPES.HistoryItem[];
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
  lairTraits: LairTrait[];
  showLairTraits: boolean;
  chambers: Chamber[];
  showChambers: boolean;
  nightmares: Nightmare[];
  showNightmares: boolean;
  atavisms: Atavism[];
  showAtavisms: boolean;

  /* Hero's */
  team: string;
  gifts: Gift[];
  showGifts: boolean;
};

export type TabMap = {
  LIFE: LIfeTabData;
  LEGEND: LegendTabData;
};
export type TabData<T extends keyof TabMap> = TabMap[T];

export type EffectKey =
  | keyof LairTraitV1["effects"]
  | keyof Atavism["effects"]
  | keyof Nightmare["effects"]
  | keyof Gift["effects"];

export default function config() {
  CONFIG.MTA.characterConfig.character.beast = {};
  CONFIG.MTA.characterConfig.character.beast.beast = {
    locale: "Beast",
    sheet: ["beast"],
    // "gnosis", // Lair dots
    // "wisdom", // Satiety dots
    virtueName: "BEAST.Beast.Virtue", // Life
    viceName: "BEAST.Beast.Vice", // Legend
  };
  CONFIG.MTA.characterConfig.character.beast.hero = {
    locale: "Hero",
    sheet: [],
    virtueName: "BEAST.Hero.Virtue",
    viceName: "BEAST.Hero.Vice",
  };

  const all_traits = CONFIG.MTA.all_traits as Record<
    string,
    {
      name: string;
      list: string[];
    }
  >;
  all_traits.beast = {
    name: "BEAST.Beast.Traits",
    list: ["mummy_traits"],
  };
  all_traits.hero = {
    name: "BEAST.Hero.Traits",
    list: ["mummy_traits"],
  };

  const ItemTypes = ["atavisms"];
  CONFIG.MTA.characterItemTypes.push(...ItemTypes);

  const typeColors = CONFIG.MTA.typeColors as Record<string, string>;
  typeColors.Beast = "#30172d";
  typeColors.Hero = "#325038";

  const EXTRA_BEAT_CONFIG = CONFIG.MTA.EXTRA_BEAT_CONFIG as Record<
    string,
    string
  >;
  EXTRA_BEAT_CONFIG.beast = "BEAST.ExtraBeats";

  const EXTRA_EXP_CONFIG = CONFIG.MTA.EXTRA_BEAT_CONFIG as Record<
    string,
    string
  >;
  EXTRA_EXP_CONFIG.beast = "BEAST.ExtraExp";
}

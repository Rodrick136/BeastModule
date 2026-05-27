import type { MTA } from "../../../foundry/data/Data/systems/mta/module/config.js";

declare global {
  interface CONFIG {
    MTA: typeof MTA & {
      characterConfig: {
        character: {
          [K: string]: {
            [K: string]: {
              locale: string;
              sheet: string[];
              virtueName: string;
              viceName: string;
            };
          };
        };
      };
    };
  }

  interface Window {
    BeastEphemeralData: {
      debug: boolean;
      actors: {
        [id: string]: {
          id: string;
          name: string;
          activeTab: string;
          changedElement: HTMLElement | null;
          scrollY: number | null;
        };
      };
    };
  }
}

declare module "*.vue" {
  import type { DefineComponent } from "vue";
  const component: DefineComponent<object, object, any>;
  export default component;
}

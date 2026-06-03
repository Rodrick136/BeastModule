import type { RollOptions } from "./rolls";
const { ApplicationV2 } = foundry.applications.api;

type ApplicationRenderOptions = foundry.applications.types.ApplicationRenderOptions;

export type DicePoolOptions = {
  cat: string,
  name: string,
  rollOptions?: Partial<RollOptions>,
};

export class DicePoolForm extends ApplicationV2 {
  actor: ActorSheet.Any["actor"];
  dicePoolOptions: DicePoolOptions;
  constructor(
    actor: ActorSheet.Any["actor"],
    options: DicePoolOptions
  ) {
    super();
    this.actor = actor;
    this.dicePoolOptions = options;
  }
  static override DEFAULT_OPTIONS = {
    id: `form-${crypto.randomUUID()}`,
    window: {
      framed: true,
      title: "Dice Pool Options",
      resizable: true,
    },
    position: {
      width: "auto" as const,
      height: "auto" as const,
    },
  };

  override async _renderHTML(context: any, options: ApplicationRenderOptions): Promise<any> {
    //Logger("Form _renderHTML", { context, options });
    const element = document.createElement("beast-dice-pool-options");
    //@ts-ignore
    element.application = this;
    return element;
  }

  override async _replaceHTML(result: Element, content: HTMLElement, options: ApplicationRenderOptions): Promise<void> {
    //Logger("Form _replaceHTML", { result, options });

    content.innerHTML = "";
    content.appendChild(result);

    //Logger("Form Rendered _replaceHTML", { content });
    return;
  }
}
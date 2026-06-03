import { createApp, type App } from "vue";
import CompScreenGM from "@/components/ScreenGM.vue";

const { ApplicationV2 } = foundry.applications.api;
type RenderOptions = foundry.applications.types.ApplicationRenderOptions;
type ClosingOptions = foundry.applications.types.ApplicationClosingOptions;

export class ScreenGM extends ApplicationV2 {
  private _vueApp: App<Element> | null = null;

  static override DEFAULT_OPTIONS = {
    id: "beast-gm-screen",
    window: {
      framed: true,
      title: "Beast GM Screen",
      resizable: true,
    },
    position: {
      width: "auto" as const,
      height: "auto" as const,
    },
  };

  protected override async _renderHTML(
    context: any,
    options: RenderOptions,
  ): Promise<any> {
    // 1. Clean up old instance if it exists
    if (this._vueApp) {
      this._vueApp.unmount();
      this._vueApp = null;
    }

    // 2. Initialize the new Vue application instance
    this._vueApp = createApp(CompScreenGM, {
      application: this,
      context: context, // Pass Foundry context data as props if needed
    });

    // 3. Return the instance so it passes to _replaceHTML
    return this._vueApp;
  }

  protected override async _replaceHTML(
    result: App<Element>,
    content: HTMLElement,
    options: RenderOptions,
  ): Promise<void> {
    // 4. Wipe the container and mount Vue
    content.innerHTML = "";
    result.mount(content);
  }

  override async render(): Promise<this> {
    // Call the base render method to trigger the rendering lifecycle
    await super.render({
      force: true,
    });
    this.bringToFront();
    return this;
  }

  override async close(options?: ClosingOptions): Promise<this> {
    if (this._vueApp) {
      this._vueApp.unmount();
      this._vueApp = null;
    }
    return super.close(options);
  }
}

import { html } from "common-tags";
import { Logger } from "./logging";

export function ConfirmationPrompt(): Promise<boolean> {
  return foundry.applications.api.DialogV2.confirm({
    window: { title: "Confirmation" },
    content: "<p>Are you sure?</p>",
  });
}

type AnyDialogV2 = foundry.applications.api.DialogV2<any, any, any>;
const _contentDescriptionPrompt = html`<label>Number of Beats: </label>
  <input
    name="beats"
    type="number"
    min="1"
    value="1"
  />
  <label>Reason: </label>
  <textarea
    name="reason"
    type="text"
    autofocus
  ></textarea>`;
export async function BeatPrompt() {
  try {
    type Result = {
      event: Event;
      button: HTMLElement;
      dialog: AnyDialogV2;
      reason: string | null;
      beats: number | null;
    };
    const result = (await foundry.applications.api.DialogV2.prompt<any>({
      window: {
        title: "Input Required",
      },
      content: _contentDescriptionPrompt,
      ok: {
        label: "Submit",
        callback: async (event: Event, button: any, dialog: AnyDialogV2) => {
          let reason: string | null = button.form.elements.reason.value;
          if (typeof reason !== "string" || reason.trim() === "") {
            reason = null;
          }
          let beats: number | null = button.form.elements.beats.valueAsNumber;
          if (typeof beats !== "number" || isNaN(beats)) {
            beats = null;
          }
          return { event, button, dialog, reason, beats };
        },
      },
    })) as Result;

    return result;
  } catch (error) {
    Logger("Error in DescriptionPrompt", { error }, "error");
    return null;
  }
}

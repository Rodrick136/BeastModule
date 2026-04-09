const Fields = foundry.data.fields;

export const BeastDataSchema = {
  myNewStat: new Fields.NumberField({ initial: 0, min: 0, max: 10 }),
  customNote: new Fields.StringField({ initial: "" }),
};
export type BeastDataDerived = {
  customNoteLength: number;
};

export class BeastData extends foundry.abstract.TypeDataModel<
  typeof BeastDataSchema,
  Actor,
  BeastDataDerived
> {
  static override defineSchema() {
    return BeastDataSchema;
  }

  override prepareDerivedData() {
    this.customNoteLength = this.customNote.length;
  }
}

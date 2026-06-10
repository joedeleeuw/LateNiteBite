declare module "opening_hours" {
  export default class OpeningHours {
    constructor(value: string, nominatimObject?: unknown, conf?: unknown);
    getState(date?: Date): boolean;
    getNextChange(date?: Date, maxDate?: Date): Date | undefined;
    getUnknown(date?: Date): boolean;
    getComment(date?: Date): string | undefined;
  }
}

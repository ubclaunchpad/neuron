import { type Drizzle } from "@/server/db";

export class ShiftService {
  private readonly db: Drizzle;

  constructor(db: Drizzle) {
    this.db = db;
  }

  async createShift(): Promise<void> {
    throw new Error("Not implemented");
  }

  async deleteShift(): Promise<void> {
    throw new Error("Not implemented");
  }
}

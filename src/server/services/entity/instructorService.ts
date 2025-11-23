import type { ListRequest } from "@/models/api/common";
import { buildInstructor, type Instructor } from "@/models/instructor";
import type { ListResponse } from "@/models/list-response";
import { type Drizzle } from "@/server/db";
import { getViewColumns } from "@/server/db/extensions/get-view-columns";
import { NeuronError, NeuronErrorCodes } from "@/server/errors/neuron-error";
import { inArray, sql } from "drizzle-orm";
import { instructorUserView } from "../../db/schema/user";

export class InstructorService {
  private readonly db: Drizzle;
  constructor(db: Drizzle) {
    this.db = db;
  }

  async getInstructorsForRequest(listRequest: ListRequest): Promise<ListResponse<Instructor>> {
    const page = listRequest.page ?? 0;
    const perPage = listRequest.perPage ?? 10;
    const offset = page * perPage;

    // Get count and ids
    const data = await this.db
      .select({
        count: sql<number>`count(*)`,
        ...getViewColumns(instructorUserView),
      })
      .from(instructorUserView)
      .limit(perPage)
      .offset(offset);

    return {
      data: data.map((d) => buildInstructor(d)),
      total: data[0]?.count ?? 0,
    };
  }

  async getInstructors(ids: string[]): Promise<Instructor[]> {
    const data = await this.db
      .select()
      .from(instructorUserView)
      .where(inArray(instructorUserView.id, ids));

    if (data.length !== ids.length) {
      const firstMissing = ids.find((id) => !data.some((d) => d.id === id));
      throw new NeuronError(`Could not find Instructor with id ${firstMissing}`, NeuronErrorCodes.NOT_FOUND);
    }

    return data.map((d) => buildInstructor(d));
  }

  async getInstructor(id: string): Promise<Instructor> {
    return await this.getInstructors([id]).then(([instructor]) => instructor!);
  }

  async inviteInstructor(): Promise<void> {
    // TODO: invite instructor
    return;
  }
}
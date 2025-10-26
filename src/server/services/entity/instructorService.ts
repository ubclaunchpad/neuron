import type { ListRequest } from "@/models/api/common";
import { buildInstructor, type Instructor } from "@/models/instructor";
import type { ListResponse } from "@/models/list-response";
import { type Drizzle } from "@/server/db";
import { getViewColumns } from "@/server/db/extensions/get-view-columns";
import { NeuronError, NeuronErrorCodes } from "@/server/errors/neuron-error";
import { desc, inArray, sql } from "drizzle-orm";
import { instructorUserView } from "../../db/schema/user";
import { buildSimilarityExpression, buildSearchCondition, getPagination } from "@/utils/searchUtils";

export class InstructorService {
  private readonly db: Drizzle;
  constructor(db: Drizzle) {
    this.db = db;
  }

  async getInstructorsForRequest(listRequest: ListRequest): Promise<ListResponse<Instructor>> {
    const { perPage, offset } = getPagination(listRequest);
    const queryInput = listRequest.queryInput?.trim() ?? "";

    const similarity = queryInput.length > 0
      ? buildSimilarityExpression(instructorUserView.name.toString(), instructorUserView.lastName.toString(), instructorUserView.email.toString(), queryInput)
      : undefined;

    const baseSelect = {
      count: sql<number>`count(*)`,
      ...getViewColumns(instructorUserView),
    } as const;

    const builder = queryInput.length > 0
      ? this.db
          .select({ ...baseSelect, similarity: similarity! })
          .from(instructorUserView)
          .where(buildSearchCondition(instructorUserView.name.toString(), instructorUserView.lastName.toString(), instructorUserView.email.toString(), queryInput))
          .orderBy(desc(similarity!))
      : this.db
          .select(baseSelect)
          .from(instructorUserView);

    const rows = await builder.limit(perPage).offset(offset);

    return {
      data: rows.map((d) => buildInstructor(d)),
      total: rows[0]?.count ?? 0,
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
    
  }

  
}
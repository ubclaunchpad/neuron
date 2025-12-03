import { useCallback } from "react";

import {
  FormInfiniteMultiSelect,
  FormInfiniteMultiSelectField,
} from "@/components/form/FormInfiniteMultiSelect";
import { Field, FieldContent, FieldSet } from "@/components/ui/field";
import { Role } from "@/models/interfaces";
import { clientApi } from "@/trpc/client";
import { type UseInfiniteQueryResult } from "@tanstack/react-query";
import type { ScheduleEditSchemaInput, ScheduleFormControl } from "../schema";
import type { ListUser } from "@/models/user";
import type { SelectEntity } from "@/components/primitives/infinite-multiselect";
import { FormFieldController } from "@/components/form/FormField";
import { FormError, FormLabel } from "@/components/form/FormLayout";
import { FormInput, FormInputField } from "@/components/form/FormInput";
import type { DeepAllUnionFields } from "@/utils/typeUtils";
import { useFormState, type FieldErrors } from "react-hook-form";

type SelectUser = ListUser & SelectEntity;
type UsersInfiniteQueryData = { entities: SelectUser[] };

function createUseUsersInfiniteQuery(
  rolesToInclude: Role[],
): (search: string) => UseInfiniteQueryResult<UsersInfiniteQueryData, unknown> {
  return (search: string) =>
    clientApi.user.list.useInfiniteQuery(
      {
        search,
        rolesToInclude,
      },
      {
        getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
        placeholderData: (prev) => prev,
        select: (data) => ({
          entities: (data.pages?.flatMap((page) => page.data ?? []) ?? []).map(
            (user) => ({
              ...user,
              label: `${user.name} ${user.lastName}`,
            }),
          ),
        }),
      },
    );
}

const useVolunteersInfiniteQuery = createUseUsersInfiniteQuery([
  Role.volunteer,
]);
const useInstructorsInfiniteQuery = createUseUsersInfiniteQuery([
  Role.instructor,
]);

export function ScheduleUsersSection({
  control,
}: {
  control: ScheduleFormControl;
}) {
  // Deep union to get all type combinations for errors
  const { errors } = useFormState({ control });
  const fullErrors: FieldErrors<DeepAllUnionFields<ScheduleEditSchemaInput>> =
    errors;

  const renderUser = useCallback(
    (user: SelectUser) => (
      <div>
        <div className="text-sm font-medium leading-none">{user.label}</div>
        {user.email ? (
          <div className="text-xs text-muted-foreground mt-0.5">
            {user.email}
          </div>
        ) : null}
      </div>
    ),
    [],
  );

  return (
    <FieldSet>
      <FormInfiniteMultiSelectField
        control={control}
        name="instructors"
        label="Instructors"
        placeholder="Add instructor..."
        entityName="instructors"
        renderListItem={renderUser}
        renderTooltip={renderUser}
        useInfiniteQuery={useInstructorsInfiniteQuery}
      />

      <FormFieldController name={"volunteers"} control={control}>
        {({ value, onChange, ...field }) => (
          <Field>
            <FieldContent className="flex flex-row justify-between">
              <FormFieldController
                control={control}
                name="preferredVolunteerCount"
              >
                {(field) => (
                  <>
                    <FormLabel>
                      Volunteers{" "}
                      <span className="text-muted-foreground text-sm">
                        ({value.length} /{" "}
                        {Number.parseInt(field.value) > 0 ? field.value : "*"})
                      </span>
                    </FormLabel>

                    <Field
                      orientation="horizontal"
                      className="w-fit !items-center gap-3"
                    >
                      <FieldContent className="w-fit !items-center">
                        <FormLabel className="text-muted-foreground" required>
                          Preferred:
                        </FormLabel>
                      </FieldContent>
                      <FormInput
                        type="number"
                        className="h-8 p-2 w-14"
                        min={0}
                        {...field}
                      />
                    </Field>
                  </>
                )}
              </FormFieldController>
            </FieldContent>

            <FormInfiniteMultiSelect
              placeholder="Add volunteer..."
              entityName="volunteers"
              renderListItem={renderUser}
              renderTooltip={renderUser}
              useInfiniteQuery={useVolunteersInfiniteQuery}
              {...field}
            />
            <FormError
              errors={[
                fullErrors.preferredVolunteerCount,
                fullErrors.volunteers,
              ]}
            />
          </Field>
        )}
      </FormFieldController>
    </FieldSet>
  );
}

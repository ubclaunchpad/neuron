"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { parseAsString, useQueryState } from "nuqs";
import { Form } from "react-aria-components";
import { FormProvider, useFieldArray, useForm, useFormContext } from "react-hook-form";
import z from "zod";
import "./page.scss";

import { FormContent, FormGroup, Select, TextArea, TextInput } from "@/components/form";
import { PageLayout } from "@/components/PageLayout";
import { PageTitle } from "@/components/PageLayout/PageHeader";
import { Button } from "@/components/primitives/button";
import { Card } from "@/components/primitives/Card";
import { Loader } from "@/components/utils/Loader";
import type { CreateClassInput, UpdateClassInput } from "@/models/api/class";
import { ScheduleRule } from "@/models/api/schedule";
import type { SingleClass } from "@/models/class";
import { clientApi } from "@/trpc/client";
import { diffArray, diffEntityArray as diffArrayById } from "@/utils/formUtils";
import AddIcon from "@public/assets/icons/add.svg";
import DownCaretIcon from "@public/assets/icons/caret-down.svg";
import RightCaretIcon from "@public/assets/icons/caret-right.svg";
import { useState } from "react";
import { classCategories } from "../page";

export const ScheduleEditSchema = z.object({
  id: z.uuid().optional(),
  localStartTime: z.iso.time().nonempty("Please fill out this field."),
  localEndTime: z.iso.time().nonempty("Please fill out this field."),
  tzid: z.string().nonempty(),
  volunteerUserIds: z.array(z.uuid()).default([]),
  instructorUserId: z.uuid().optional(),
  effectiveStart: z.iso.date().optional(),
  effectiveEnd: z.iso.date().optional(),
  rule: ScheduleRule,
});
export type ScheduleEditSchemaType = z.output<typeof ScheduleEditSchema>;

export const ClassEditSchema = z.object({
  name: z.string().nonempty("Please fill out this field."),
  description: z.string().optional(),
  meetingURL: z.url("Please enter a valid meeting url.").optional(),
  category: z.string().nonempty("Please fill out this field."),
  schedules: z.array(ScheduleEditSchema).default([]),
});
type ClassEditSchemaOutput = z.output<typeof ClassEditSchema>; 

export default function ClassesEditView() {
  const [queryClassId, setQueryClassId] = useQueryState("class", parseAsString);
  const [queryTermId, setQueryTermId] = useQueryState("term", parseAsString);
  const apiUtils = clientApi.useUtils();
  const editing = !!queryClassId;

  const { 
    data: editingClassData, 
    isPending: isLoadingEditingClass,
  } = clientApi.class.byId.useQuery(
    { classId: queryClassId ?? "" },
    { enabled: editing }
  );

  const { 
    data: currentTermData, 
    isPending: isLoadingCurrentTerm, 
  } = clientApi.term.current.useQuery(
    undefined,
    { enabled: !queryTermId && !editing }
  );

  const { mutate: createClass, isPending: isCreatingClass } = clientApi.class.create.useMutation({
    onSuccess: (createdId) => {
      setQueryClassId(createdId);
      apiUtils.class.list.invalidate();
    },
  });

  const { mutate: updateClass, isPending: isUpdatingClass } = clientApi.class.update.useMutation({
    onSuccess: (_, { id }) => {
      apiUtils.class.byId.invalidate({ classId: id });
      apiUtils.class.list.invalidate();
    },
  });

  return (
    <PageLayout>
      <PageLayout.Header>
        <PageTitle title={queryClassId ? "Edit Class" : "Create Class"} showBackButton/>
      </PageLayout.Header>

      <Loader isLoading={editing ? isLoadingEditingClass : isLoadingCurrentTerm} fallback={"Loading class data"}>
        <ClassEditForm 
          isEditing={editing}
          editingClassId={queryClassId ?? undefined}
          creatingTermId={queryTermId ?? currentTermData?.id}
          editingClassData={editingClassData!}
          updateClassMutation={updateClass}
          createClassMutation={createClass}
          mutationPending={isCreatingClass || isUpdatingClass}
        />
      </Loader>
    </PageLayout>
  );
}

function ClassEditForm({ 
  isEditing,
  editingClassId,
  creatingTermId,
  editingClassData: defaultClassData,
  updateClassMutation,
  createClassMutation,
  mutationPending,
}: { 
  isEditing: boolean;
  editingClassId?: string;
  editingClassData: SingleClass;
  creatingTermId?: string;
  createClassMutation: (data: CreateClassInput) => void;
  updateClassMutation: (data: UpdateClassInput) => void;
  mutationPending: boolean;
}) {

  const form = useForm({
    resolver: zodResolver(ClassEditSchema),
    mode: "onSubmit",
    reValidateMode: "onChange",
    defaultValues: isEditing ? {
      name: defaultClassData!.name,
      description: defaultClassData!.description,
      meetingURL: defaultClassData!.meetingURL,
      category: defaultClassData!.category,
      schedules: defaultClassData!.schedules.map(schedule => ({
        localStartTime: schedule.localStartTime,
        localEndTime: schedule.localEndTime,
        tzid: schedule.tzid,
        volunteerUserIds: schedule.volunteers.map(volunteer => volunteer.id),
        rule: schedule.rule,
        effectiveStart: schedule.effectiveStart,
        effectiveEnd: schedule.effectiveEnd,
        instructorUserId: schedule.instructor?.id,
      })),
    } : undefined
  });

  const { 
    fields: formSchedules, 
    append: addFormSchedule, 
    remove: removeFormSchedule
  } = useFieldArray({
    control: form.control,
    name: "schedules"
  });

  const onSubmit = async (data: ClassEditSchemaOutput) => {
    if (isEditing) {
      const { schedules, ...dataToSubmit } = data;
      const { schedules: originalSchedules } = form.formState.defaultValues!;
      const originalIdToSchedule = new Map<string, ScheduleEditSchemaType>(originalSchedules!.map(s => [s!.id as string, s as ScheduleEditSchemaType]))
      const { added, edited, deletedIds } = diffArrayById(originalSchedules as ScheduleEditSchemaType[], schedules, "id");

      updateClassMutation({
        id: editingClassId!,
        addedSchedules: added,
        updatedSchedules: edited.map(schedule => {
          const { volunteerUserIds, id, ...rest } = schedule;
          const originalIds = originalIdToSchedule.get(id)?.volunteerUserIds ?? [];
          const { added: addedIds, deleted: deletedIds } = diffArray(originalIds, volunteerUserIds);

          return {
            ...rest,
            id,
            addedVolunteerUserIds: addedIds,
            removedVolunteerUserIds: deletedIds
          }
        }),
        deletedSchedules: deletedIds,
        ...dataToSubmit,
      });
    } else {
      createClassMutation({
        termId: creatingTermId!,
        ...data,
      });
    }
  };
  
  return (
    <FormProvider {...form}>
      <Form
        onSubmit={form.handleSubmit(onSubmit)}
        validationBehavior="aria"
      >
        { JSON.stringify(form.getValues()) }
        <div className="class-edit__content">
          <Card>
            <FormContent>
              <h3>General</h3>

              <TextInput
                control={form.control}
                name="name"
                inlineLabel
                label="Title"
                placeholder="Enter Title"
                errorMessage={form.formState.errors.name?.message}
              />

              <TextInput 
                control={form.control}
                name="meetingURL"
                inlineLabel
                label="Meeting Link"
                placeholder="Enter Meeting Link"
                errorMessage={form.formState.errors.meetingURL?.message}
              />

              <Select
                control={form.control}
                name="category"
                inlineLabel
                label="Category"
                placeholder="Select Category"
                errorMessage={form.formState.errors.category?.message}
              >
                {classCategories.map(category => (
                  <Select.Item 
                    key={category}
                    id={category}
                  >{category}</Select.Item>
                ))}
              </Select>

              <FormGroup columns="2fr 1fr">
                <TextArea
                  control={form.control}
                  name="description"
                  label="Description"
                  placeholder="Enter Description"
                ></TextArea>
              </FormGroup>
            </FormContent>
          </Card>

          {formSchedules.map((schedule, index) => (
            <Card key={schedule.id}>
              <ScheduleEditForm index={index} selfDelete={() => removeFormSchedule(index)}/>
            </Card>
          ))}

          <Button 
            unstyled 
            className="card class-edit__add-schedule"
            onClick={() => addFormSchedule({} as any)}>
            <AddIcon/>
            <h3 className="class-edit__add-schedule-text">Add Class Schedule</h3>
          </Button>
        </div>
      </Form>
    </FormProvider>
  );
}

function ScheduleEditForm({ 
  index,
  selfDelete
}: { 
  index: number,
  selfDelete: () => void
}) {
  const {
    register,
    watch,
  } = useFormContext();
  const [isOpen, setIsOpen] = useState(true);

  return (
    <FormContent>
      <FormGroup columns="min-content minmax(min-content, max-content) 1fr">
        <Button className="small ghost icon-only" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <DownCaretIcon/> : <RightCaretIcon/>}
        </Button>
        <h3>Class Schedule {index + 1}</h3>
        <span>other stuff</span>
      </FormGroup>


    </FormContent>
  );
}

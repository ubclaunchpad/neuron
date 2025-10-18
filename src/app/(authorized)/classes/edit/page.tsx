"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { parseAsString, useQueryState } from "nuqs"
import { Controller, FormProvider, useFieldArray, useForm, useFormContext } from "react-hook-form"
import z from "zod"

import {
  CLASS_CATEGORIES,
} from "@/components/classes/classes-grid-view"
import { PageLayout, PageLayoutHeader, PageLayoutHeaderContent, PageLayoutHeaderRight, PageLayoutHeaderTitle } from "@/components/page-layout"
import { Button } from "@/components/primitives/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/primitives/card"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/primitives/field"
import { Input } from "@/components/primitives/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/primitives/select"
import { Textarea } from "@/components/primitives/textarea"
import { Loader } from "@/components/utils/loader"
import type { CreateClassInput, UpdateClassInput } from "@/models/api/class"
import { ScheduleRule } from "@/models/api/schedule"
import type { SingleClass } from "@/models/class"
import { clientApi } from "@/trpc/client"
import { diffArray, diffEntityArray as diffArrayById } from "@/utils/formUtils"
import AddIcon from "@public/assets/icons/add.svg"
import DownCaretIcon from "@public/assets/icons/caret-down.svg"
import RightCaretIcon from "@public/assets/icons/caret-right.svg"
import { useState } from "react"

export const ScheduleEditSchema = z.object({
  id: z.uuid().optional(),
  localStartTime: z.iso.time().min(1, "Please fill out this field."),
  localEndTime: z.iso.time().min(1, "Please fill out this field."),
  tzid: z.string().min(1, "Please fill out this field."),
  volunteerUserIds: z.array(z.string().uuid()).default([]),
  instructorUserId: z.string().uuid().optional(),
  effectiveStart: z.string().date().optional(),
  effectiveEnd: z.string().date().optional(),
  rule: ScheduleRule,
})
export type ScheduleEditSchemaType = z.output<typeof ScheduleEditSchema>

export const ClassEditSchema = z.object({
  name: z.string().min(1, "Please fill out this field."),
  description: z.string().optional(),
  meetingURL: z.url("Please enter a valid meeting url.").optional(),
  category: z.string().min(1, "Please fill out this field."),
  schedules: z.array(ScheduleEditSchema).default([]),
})
type ClassEditSchemaOutput = z.output<typeof ClassEditSchema>

export default function ClassesEditView() {
  const [queryClassId, setQueryClassId] = useQueryState("class", parseAsString)
  const [queryTermId] = useQueryState("term", parseAsString)
  const apiUtils = clientApi.useUtils()
  const editing = !!queryClassId

  const {
    data: editingClassData,
    isPending: isLoadingEditingClass,
  } = clientApi.class.byId.useQuery({ classId: queryClassId ?? "" }, { enabled: editing })

  const {
    data: currentTermData,
    isPending: isLoadingCurrentTerm,
  } = clientApi.term.current.useQuery(undefined, { enabled: !queryTermId && !editing })

  const { mutate: createClass, isPending: isCreatingClass } = clientApi.class.create.useMutation({
    onSuccess: (createdId) => {
      setQueryClassId(createdId)
      apiUtils.class.list.invalidate()
    },
  })

  const { mutate: updateClass, isPending: isUpdatingClass } = clientApi.class.update.useMutation({
    onSuccess: (_, { id }) => {
      apiUtils.class.byId.invalidate({ classId: id })
      apiUtils.class.list.invalidate()
    },
  })

  return (
    <PageLayout>
      <PageLayoutHeader>
        <PageLayoutHeaderContent>
          <PageLayoutHeaderRight showBackButton>
            <PageLayoutHeaderTitle>{editing ? "Edit Class" : "Create Class"}</PageLayoutHeaderTitle>
          </PageLayoutHeaderRight>
        </PageLayoutHeaderContent>
      </PageLayoutHeader>

      <Loader
        isLoading={editing ? isLoadingEditingClass : isLoadingCurrentTerm}
        fallback={"Loading class data"}
      >
        <ClassEditForm
          isEditing={editing}
          editingClassId={queryClassId ?? undefined}
          creatingTermId={queryTermId ?? currentTermData?.id}
          editingClassData={editingClassData as SingleClass}
          updateClassMutation={updateClass}
          createClassMutation={createClass}
          mutationPending={isCreatingClass || isUpdatingClass}
        />
      </Loader>
    </PageLayout>
  )
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
  isEditing: boolean
  editingClassId?: string
  editingClassData: SingleClass
  creatingTermId?: string
  createClassMutation: (data: CreateClassInput) => void
  updateClassMutation: (data: UpdateClassInput) => void
  mutationPending: boolean
}) {
  const form = useForm({
    resolver: zodResolver(ClassEditSchema),
    mode: "onSubmit",
    reValidateMode: "onChange",
    defaultValues: isEditing
      ? {
          name: defaultClassData!.name,
          description: defaultClassData!.description ?? "",
          meetingURL: defaultClassData!.meetingURL ?? "",
          category: defaultClassData!.category,
          schedules: defaultClassData!.schedules.map((schedule) => ({
            id: schedule.id,
            localStartTime: schedule.localStartTime,
            localEndTime: schedule.localEndTime,
            tzid: schedule.tzid,
            volunteerUserIds: schedule.volunteers.map((v) => v.id),
            rule: schedule.rule,
            effectiveStart: schedule.effectiveStart,
            effectiveEnd: schedule.effectiveEnd,
            instructorUserId: schedule.instructor?.id,
          })),
        }
      : undefined,
  })

  const {
    fields: formSchedules,
    append: addFormSchedule,
    remove: removeFormSchedule,
  } = useFieldArray({
    control: form.control,
    name: "schedules",
  })

  const onSubmit = (data: ClassEditSchemaOutput) => {
    if (isEditing) {
      const { schedules, ...dataToSubmit } = data
      const originalSchedules = (form.formState.defaultValues?.schedules ??
        []) as ScheduleEditSchemaType[]
      const originalIdToSchedule = new Map<string, ScheduleEditSchemaType>(
        originalSchedules.map((s) => [s.id as string, s]),
      )
      const { added, edited, deletedIds } = diffArrayById(
        originalSchedules,
        schedules,
        "id",
      )

      updateClassMutation({
        id: editingClassId!,
        addedSchedules: added,
        updatedSchedules: edited.map((schedule) => {
          const { volunteerUserIds, id, ...rest } = schedule
          const originalIds = originalIdToSchedule.get(id!)?.volunteerUserIds ?? []
          const { added: addedIds, deleted: deletedIds } = diffArray(originalIds, volunteerUserIds)
          return {
            ...rest,
            id: id!,
            addedVolunteerUserIds: addedIds,
            removedVolunteerUserIds: deletedIds,
          }
        }),
        deletedSchedules: deletedIds,
        ...dataToSubmit,
      })
    } else {
      createClassMutation({
        termId: creatingTermId!,
        ...data,
      })
    }
  }

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-8 p-9 pt-0">
        <Card className="w-full">
          <CardHeader>
            <CardTitle>General</CardTitle>
            <CardDescription>Basic details about the class.</CardDescription>
          </CardHeader>
          <CardContent>
            <FieldGroup>
              <Controller
                name="name"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="class-name">Title</FieldLabel>
                    <Input
                      id="class-name"
                      placeholder="Enter Title"
                      aria-invalid={fieldState.invalid}
                      autoComplete="off"
                      {...field}
                    />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />

              <Controller
                name="meetingURL"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="class-meeting-url">Meeting Link</FieldLabel>
                    <Input
                      id="class-meeting-url"
                      type="url"
                      placeholder="Enter Meeting Link"
                      aria-invalid={fieldState.invalid}
                      autoComplete="off"
                      {...field}
                    />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />

              <Controller
                name="category"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="class-category">Category</FieldLabel>
                    <Select
                      value={field.value ?? undefined}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger id="class-category" aria-invalid={fieldState.invalid}>
                        <SelectValue placeholder="Select Category" />
                      </SelectTrigger>
                      <SelectContent>
                        {CLASS_CATEGORIES.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />

              <Controller
                name="description"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="class-description">Description</FieldLabel>
                    <Textarea
                      id="class-description"
                      placeholder="Enter Description"
                      className="min-h-24 resize-y"
                      aria-invalid={fieldState.invalid}
                      {...field}
                    />
                    <FieldDescription>Optional. Add context for instructors and volunteers.</FieldDescription>
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
            </FieldGroup>
          </CardContent>
        </Card>

        {formSchedules.map((schedule, index) => (
          <Card key={schedule.id} className="w-full">
            <ScheduleEditForm index={index} selfDelete={() => removeFormSchedule(index)} />
          </Card>
        ))}

        <Button
          type="button"
          variant="ghost"
          className="inline-flex items-center gap-5 text-muted-foreground"
          onClick={() => addFormSchedule({} as any)}
        >
          <AddIcon />
          <h3 className="text-base font-semibold">Add Class Schedule</h3>
        </Button>

        <CardFooter className="p-0">
          <Field orientation="horizontal">
            <Button
              type="button"
              variant="outline"
              onClick={() => form.reset()}
              disabled={mutationPending}
            >
              Reset
            </Button>
            <Button type="submit" disabled={mutationPending}>
              {mutationPending ? "Saving..." : "Submit"}
            </Button>
          </Field>
        </CardFooter>
      </form>
    </FormProvider>
  )
}

function ScheduleEditForm({
  index,
  selfDelete,
}: {
  index: number
  selfDelete: () => void
}) {
  const { register } = useFormContext()
  const [isOpen, setIsOpen] = useState(true)

  return (
    <CardContent>
      <FieldGroup>
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setIsOpen((v) => !v)}
          >
            {isOpen ? <DownCaretIcon /> : <RightCaretIcon />}
          </Button>
          <h3 className="text-base font-semibold">Class Schedule {index + 1}</h3>
          <div className="ml-auto">
            <Button type="button" variant="ghost" onClick={selfDelete}>
              Remove
            </Button>
          </div>
        </div>

        {isOpen && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Field>
              <FieldLabel htmlFor={`schedules.${index}.localStartTime`}>Start Time</FieldLabel>
              <Input
                id={`schedules.${index}.localStartTime`}
                type="time"
                {...register(`schedules.${index}.localStartTime` as const)}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor={`schedules.${index}.localEndTime`}>End Time</FieldLabel>
              <Input
                id={`schedules.${index}.localEndTime`}
                type="time"
                {...register(`schedules.${index}.localEndTime` as const)}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor={`schedules.${index}.tzid`}>Time Zone</FieldLabel>
              <Input
                id={`schedules.${index}.tzid`}
                placeholder="e.g. America/Vancouver"
                {...register(`schedules.${index}.tzid` as const)}
              />
            </Field>
          </div>
        )}
      </FieldGroup>
    </CardContent>
  )
}

"use client";

import { Button } from "@/components/primitives/button";
import { DialogClose, DialogFooter } from "@/components/ui/dialog";
import { useTermForm } from "../term-form-provider";

export function TermFormFooter() {
  const { submitting, form, editing } = useTermForm();

  return (
    <DialogFooter>
      <DialogClose asChild>
        <Button variant="outline" size="sm" disabled={submitting}>
          Cancel
        </Button>
      </DialogClose>
      <Button
        type="submit"
        size="sm"
        pending={submitting}
        disabled={editing && !form.formState.isDirty}
      >
        Save
      </Button>
    </DialogFooter>
  );
}

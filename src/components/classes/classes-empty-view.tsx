import NiceModal from "@ebay/nice-modal-react";
import ClassIcon from "@public/assets/icons/nav/classes.svg";
import { CalendarOffIcon, Plus } from "lucide-react";
import Link from "next/link";
import { Button } from "../primitives/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "../primitives/empty";
import { useClassesPage } from "./classes-view";
import { TermForm } from "./forms/term-form";

export function ClassesEmptyView() {
  const { selectedTermId, hasTerms } = useClassesPage();

  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          {hasTerms ? <ClassIcon /> : <CalendarOffIcon />}
        </EmptyMedia>
        <EmptyTitle>No {hasTerms ? "Classes" : "Terms"} Yet</EmptyTitle>
        <EmptyDescription>
          You haven&apos;t created any {hasTerms ? "classes" : "terms"} yet. Get
          started by creating your first {hasTerms ? "class" : "term"}.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        {hasTerms ? (
          <Button asChild variant="outline">
            <Link
              href={{
                pathname: "classes/edit",
                query: { termId: selectedTermId },
              }}
            >
              <Plus />
              <span>Create Class</span>
            </Link>
          </Button>
        ) : (
          <Button
            onClick={() =>
              NiceModal.show(TermForm, {
                editingId: null,
              })
            }
            variant="outline"
          >
            <Plus />
            <span>Create Term</span>
          </Button>
        )}
      </EmptyContent>
    </Empty>
  );
}

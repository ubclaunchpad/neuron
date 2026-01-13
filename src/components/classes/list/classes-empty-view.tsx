import NiceModal from "@ebay/nice-modal-react";
import ClassIcon from "@public/assets/icons/nav/classes.svg";
import { CalendarOffIcon, Plus } from "lucide-react";
import Link from "next/link";
import { Button } from "../../ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "../../ui/empty";
import { useClassesPage } from "./class-list-view";
import { TermForm } from "./content/term-form";
import { usePermission } from "@/hooks/use-permission";

export function ClassesEmptyView() {
  const canCreateClasses = usePermission({
    permission: { classes: ["create"] },
  });
  const { selectedTermId, hasTerms, setSelectedTermId } = useClassesPage();

  if (!canCreateClasses) {
    return "No classes found.";
  }

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
                onCreated: setSelectedTermId,
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

"use client";

import { WithPermission } from "@/components/utils/with-permission";
import { clientApi } from "@/trpc/client";

import { TermForm } from "@/components/classes/list/content/term-form";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import NiceModal from "@ebay/nice-modal-react";
import { Edit, Plus } from "lucide-react";
import { useClassesPage } from "../class-list-view";

export function TermSelect({
  disableIfSingle,
  className,
}: {
  disableIfSingle?: boolean;
  className?: string;
}) {
  const { selectedTermId, setSelectedTermId } = useClassesPage();
  const { data: terms, isPending: isLoadingTerms } =
    clientApi.term.all.useQuery();

  // Show loading skeleton while terms are loading
  if (isLoadingTerms || !selectedTermId) {
    return <Skeleton className={cn("h-10 w-60", className)} />;
  }

  // Don't render if no terms
  if (!terms?.length) {
    return null;
  }

  const isDisabled = disableIfSingle && terms.length <= 1;

  return (
    <ButtonGroup className={className}>
      <Select
        value={selectedTermId ?? undefined}
        onValueChange={setSelectedTermId}
        disabled={isDisabled}
      >
        <SelectTrigger className={"min-w-[180px] w-auto"}>
          <SelectValue placeholder="Select term" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {terms.map((t) => (
              <SelectItem key={t.id} value={t.id}>
                {t.name}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>

      <WithPermission permissions={{ permission: { terms: ["create"] } }}>
        <Button
          onClick={() =>
            NiceModal.show(TermForm, {
              editingId: selectedTermId,
              onCreated: setSelectedTermId,
            })
          }
          variant="outline"
        >
          <Edit />
        </Button>
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
        </Button>
      </WithPermission>
    </ButtonGroup>
  );
}

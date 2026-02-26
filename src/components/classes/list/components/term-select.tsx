"use client";

import { WithPermission } from "@/components/utils/with-permission";
import { clientApi } from "@/trpc/client";

import { TermFormDialog } from "@/components/classes/list/content/term-form/term-form-dialog";
import { Button } from "@/components/primitives/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import NiceModal from "@ebay/nice-modal-react";
import { ChevronDown, Edit, Plus } from "lucide-react";
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
  const selectedTerm = terms.find((t) => t.id === selectedTermId);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          disabled={isDisabled}
          endIcon=<ChevronDown />
          className={cn(
            "min-w-45 max-w-80 shrink justify-between gap-2",
            className,
          )}
        >
          <span className="truncate">
            {selectedTerm?.name ?? "Select term"}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        {terms.map((t) => {
          const isSelected = t.id === selectedTermId;
          return (
            <div key={t.id} className="flex gap-1 items-center-safe">
              <DropdownMenuItem
                className="min-w-0 flex-1 pr-1"
                onSelect={() => setSelectedTermId(t.id)}
              >
                <span className="truncate">{t.name}</span>
              </DropdownMenuItem>
              {isSelected && (
                <span className="size-2.5 rounded-full bg-primary shrink-0" />
              )}
              <WithPermission
                permissions={{ permission: { terms: ["create"] } }}
              >
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="shrink-0"
                  startIcon={<Edit />}
                  onClick={(e) => {
                    e.stopPropagation();
                    NiceModal.show(TermFormDialog, {
                      editingId: t.id,
                      onCreated: setSelectedTermId,
                    });
                  }}
                ></Button>
              </WithPermission>
            </div>
          );
        })}
        <WithPermission permissions={{ permission: { terms: ["create"] } }}>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onSelect={() =>
              NiceModal.show(TermFormDialog, {
                editingId: null,
                onCreated: setSelectedTermId,
              })
            }
          >
            <Plus />
            <span>New Term</span>
          </DropdownMenuItem>
        </WithPermission>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

"use client";

import { WithPermission } from "@/components/utils/with-permission";
import { clientApi } from "@/trpc/client";

import { TermForm } from "@/components/classes/forms/term-form";
import { Button } from "@/components/primitives/button";
import { ButtonGroup } from "@/components/primitives/button-group";
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/primitives/select";
import { Skeleton } from "@/components/primitives/skeleton";
import type { Term } from "@/models/term";
import NiceModal from "@ebay/nice-modal-react";
import { Edit, Plus } from "lucide-react";
import React from "react";

export function TermSelect({
  terms,
  selectedKey,
  onChange,
  isLoading,
  disableIfSingle,
  className,
}: {
  terms: Term[] | undefined;
  selectedKey?: string;
  onChange: (id: string) => void;
  isLoading?: boolean;
  disableIfSingle?: boolean;
  className?: string;
}) {
  const apiUtils = clientApi.useUtils();

  const handleValueChange = React.useCallback(
    (id: string) => {
      // Prefetch classes for the selected term to speed up nav
      apiUtils.class.list.prefetch({ term: id }).catch();
      onChange(id);
    },
    [apiUtils.class.list, onChange],
  );

  // Load via skeleton
  if (isLoading) return <Skeleton className="h-10 w-30" />;

  const isDisabled =
    (disableIfSingle && (terms?.length ?? 0) <= 1) ?? isLoading;

  return (
    <ButtonGroup className={className}>
      <Select
        value={selectedKey}
        onValueChange={handleValueChange}
        disabled={isDisabled}
      >
        <SelectTrigger className={"min-w-[180px] w-auto"}>
          <SelectValue
            placeholder={terms?.length ? "Select term" : "No terms"}
          />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {(terms ?? []).map((t) => (
              <SelectItem key={t.id} value={t.id}>
                {t.name}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>

      <WithPermission permissions={{ permission: { terms: ["create"] } }}>
        <Button
          onClick={() => NiceModal.show(TermForm, { editingId: selectedKey })}
          variant="outline"
        >
          <Edit />
        </Button>
        <Button
          onClick={() => NiceModal.show(TermForm, { editingId: null })}
          variant="outline"
        >
          <Plus />
        </Button>
      </WithPermission>
    </ButtonGroup>
  );
}
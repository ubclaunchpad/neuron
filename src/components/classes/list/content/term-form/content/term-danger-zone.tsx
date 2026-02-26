"use client";

import { AlertDialog } from "@/components/primitives/alert-dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/primitives/button";
import { WithPermission } from "@/components/utils/with-permission";
import { clientApi } from "@/trpc/client";
import { useTermForm } from "../term-form-provider";
import { useModal } from "@ebay/nice-modal-react";
import { Trash2 } from "lucide-react";
import type { Term } from "@/models/term";

export function TermDangerZone({
  termId,
  termData,
}: {
  termId: string;
  termData: Term;
}) {
  const modal = useModal();
  const apiUtils = clientApi.useUtils();

  const { mutate: deleteTerm, isPending: isDeleting } =
    clientApi.term.delete.useMutation({
      onSuccess: async () => {
        await apiUtils.term.all.invalidate();
        await modal.hide();
      },
    });

  return (
    <WithPermission permissions={{ permission: { terms: ["delete"] } }}>
      <Accordion type="single" collapsible className="-mt-4">
        <AccordionItem value="danger-zone">
          <AccordionTrigger className="text-muted-foreground hover:no-underline">
            Danger Zone
          </AccordionTrigger>
          <AccordionContent>
            <Alert
              variant="destructive"
              className="flex items-center justify-between"
            >
              <div>
                <AlertTitle>Delete this term</AlertTitle>
                <AlertDescription className="text-xs text-muted-foreground">
                  This action cannot be undone.
                </AlertDescription>
              </div>
              <AlertDialog
                alertTitle="Delete this term?"
                alertDescription={`This will permanently delete "${termData.name}" and all associated classes, schedules, and shifts. This action cannot be undone.`}
                alertActionContent="Delete"
                alertActionProps={{ variant: "destructive" }}
                alertActionAsOverride={false}
                onAccept={() => deleteTerm({ termId })}
              >
                <Button
                  variant="destructive"
                  size="sm"
                  pending={isDeleting}
                  startIcon={<Trash2 />}
                >
                  Delete
                </Button>
              </AlertDialog>
            </Alert>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </WithPermission>
  );
}

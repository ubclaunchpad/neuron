"use client";

import { authClient } from "@/lib/auth/client";

import { Button } from "@/components/ui/button";
import InactiveGraphic from "@public/assets/graphics/inactive-graphic.svg";
import LogOutIcon from "@public/assets/icons/log-out.svg";

export default function RejectedPage() {
  return (
    <main className="grid min-h-dvh w-full place-items-center overflow-hidden bg-background p-6">
      <div className="flex max-w-3xl flex-col items-center gap-6">
        <InactiveGraphic
          className="h-auto w-56 sm:w-64 md:w-72"
          aria-hidden="true"
        />

        <div className="flex flex-col items-center gap-2 text-center">
          <h3 className="text-2xl font-display font-bold leading-none text-primary">
            Your account request was not approved
          </h3>

          <p className="text-foreground/90">
            Your volunteer verification request has been declined.
            <br />
            Please reach out to{" "}
            <Button asChild variant="link" className="p-0">
              <a href="mailto:bwp@gmail.com">
                <strong>bwp@gmail.com</strong>
              </a>
            </Button>{" "}
            if you believe this is a mistake or have any questions.
          </p>
        </div>

        <Button onClick={() => authClient.signOut()}>
          <LogOutIcon className="h-4 w-4" />
          <span>Log Out</span>
        </Button>
      </div>
    </main>
  );
}

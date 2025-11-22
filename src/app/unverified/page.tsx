"use client";

import { authClient } from "@/lib/auth/client";

import { Button } from "@/components/primitives/button";
import UnverifiedGraphic from "@public/assets/graphics/unverified-graphic.svg";
import LogOutIcon from "@public/assets/icons/log-out.svg";

export default function UnverifiedPage() {
  return (
    <main className="grid min-h-dvh w-full place-items-center overflow-hidden bg-background p-6">
      <div className="flex max-w-3xl flex-col items-center gap-6">
        <UnverifiedGraphic
          className="h-auto w-56 sm:w-64 md:w-72"
          aria-hidden="true"
        />

        <div className="flex flex-col items-center gap-2 text-center">
          <h3 className="text-lg font-display font-bold text-primary">
            Your account is waiting for admin verification
          </h3>

          <p className="text-foreground/90">
            We’ll email you once your account is approved.
            <br />
            Please reach out to{" "}
            <Button asChild variant="link" className="p-0">
              <a href="mailto:bwp@gmail.com">
                <strong>bwp@gmail.com</strong>
              </a>
            </Button>{" "}
            if you have any questions.
          </p>
        </div>

        <Button onClick={() => authClient.signOut()}>
          <LogOutIcon className="h-4 w-4"/>
          <span>Log Out</span>
        </Button>
      </div>
    </main>
  );
}

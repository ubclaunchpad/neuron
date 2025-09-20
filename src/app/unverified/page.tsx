"use client";

import { authClient } from "@/lib/auth/client";
import "./page.scss";

import { Button } from "@/components/primitives/Button";
import UnverifiedGraphic from "@public/assets/graphics/unverified-graphic.svg";
import LogOutIcon from "@public/assets/icons/log-out.svg";

export default function UnverifiedPage() {
  return (
    <main className="unverified-main">
      <div className="unverified-inner">
        <UnverifiedGraphic className="unverified-graphic" />

        <div className="unverified-content">
          <h3>Your account is waiting for admin verification</h3>

          <p>
            We’ll email you once your account is approved.
            <br />
            Please reach out to{" "}
            <Button variant="link" href="mailto:bwp@gmail.com">
              <strong>bwp@gmail.com</strong>
            </Button>{" "}
            if you have any questions.
          </p>
        </div>

        <Button onPress={() => authClient.signOut()}>
          <LogOutIcon />
          <span>Log Out</span>
        </Button>
      </div>
    </main>
  );
}

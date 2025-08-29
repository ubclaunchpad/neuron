'use client';

import { authClient } from "@/lib/auth/client";
import "./page.scss";

import { Button } from "@/app/_components/primitives/Button";
import InactiveGraphic from '@public/assets/inactive-graphic.svg';
import LogOutIcon from "@public/assets/log-out-icon.svg";

export default function InactivePage() {
  return (
    <main className="inactive-main">
      <div className="inactive-inner">
        <InactiveGraphic className="inactive-graphic"/>

        <div className="inactive-content">
          <h3>Your account has been deactivated</h3>

          <p>
            This may be because you are not an active volunteer for this term or for other administrative reasons.<br />
            Please reach out to <Button variant="link" href="mailto:bwp@gmail.com"><strong>bwp@gmail.com</strong></Button> to reactivate your account.
          </p>
        </div>

        <Button onPress={() => authClient.signOut()}>
          <LogOutIcon/>
          <span>Log Out</span>
        </Button>
      </div>
    </main>
  );
}
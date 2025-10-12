"use client";

import clsx from "clsx";

import { Button } from "@/components/primitives/button";
import { FallbackImage } from "@/components/utils/FallbackImage";
import { WithPermission } from "@/components/utils/WithPermission";
import { useAuth } from "@/providers/client-auth-provider";
import CaretRightIcon from "@public/assets/icons/caret-right.svg";
import "./index.scss";

export function NavProfileCard({ collapsed }: { collapsed: boolean }) {
  const { user } = useAuth();

  return (
    <WithPermission permissions={{ permission: { profile: ["view"] } }}>
    <Button
      unstyled
      className={clsx("nav-profile-card", collapsed && "collapsed")}
    >
      <div className="nav-profile-card__main">
        <div className="nav-profile-card__avatar">
          <FallbackImage src={user?.image} name={user?.name} />
        </div>
        <div className="nav-profile-card__info">
          <span className="nav-profile-card__name">{user?.name}</span>
          <span className="nav-profile-card__email">{user?.email}</span>
        </div>
      </div>
      <CaretRightIcon className="nav-profile-card__caret" aria-hidden="true" />
    </Button>
    </WithPermission>
  );
}

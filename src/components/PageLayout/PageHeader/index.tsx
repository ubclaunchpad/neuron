import { createHost, createSlot } from "@/lib/slots";
import * as React from "react";
import { NavbarToggleButton } from "../../NavbarLayout/NavbarToggle";
import "./index.scss";

type PageTitleProps = {
  children?: React.ReactNode;
  title: string;
};

const SlotDefs = {
  LeftContent: createSlot(),
  RightContent: createSlot(),
};

type PageTitleCompound = React.FC<PageTitleProps> & {
  LeftContent: typeof SlotDefs.LeftContent;
  RightContent: typeof SlotDefs.RightContent;
};

export const PageTitle: PageTitleCompound = ({
  children,
  title
}) => {
  return (
    <div className="page-header">
      {createHost(children, (Slots) => {
        const leftContent = Slots.get(SlotDefs.LeftContent);
        const rightContent = Slots.get(SlotDefs.RightContent);

        return (<>
          <div className="header-left">
            <NavbarToggleButton />
            <h2>{title}</h2>
            {leftContent}
          </div>
          <div className="header-right">
            {rightContent}
          </div>
        </>)
      })}
    </div>
  );
};

PageTitle.LeftContent = SlotDefs.LeftContent;
PageTitle.RightContent = SlotDefs.RightContent;

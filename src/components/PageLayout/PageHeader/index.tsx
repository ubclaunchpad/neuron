import { Button } from "@/components/primitives/button";
import { createHost, createSlot } from "@/lib/slots";
import CaretLeftIcon from "@public/assets/icons/caret-left.svg";
import { useRouter } from "next/navigation";
import * as React from "react";
import { NavbarToggleButton } from "../../NavbarLayout/NavbarToggle";
import "./index.scss";

type PageTitleProps = {
  children?: React.ReactNode;
  title: string;
  showBackButton?: boolean;
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
  title,
  showBackButton = false
}) => {
  const router = useRouter();
  
  return (
    <div className="page-header">
      {createHost(children, (Slots) => {
        const leftContent = Slots.get(SlotDefs.LeftContent);
        const rightContent = Slots.get(SlotDefs.RightContent);

        return (<>
          <div className="header-left">
            <NavbarToggleButton className="header-button" />
            {showBackButton && <Button 
              className="header-button ghost small icon-only"
              onPress={() => router.back()}
            >
              <CaretLeftIcon />
            </Button>}
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

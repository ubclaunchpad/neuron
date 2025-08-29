"use client"

import { useBreakpoint } from "@/hooks/use-breakpoint";
import LOGO from "@public/assets/logo-icon.svg";
import "./layout.scss";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
    const isLargeScreen = useBreakpoint("md");

    return (<>
        <div className="public-layout">
            <aside className="public-sidebar">
                <div className="public-sidebar__inner">
                    <div className="public-sidebar__logo">
                        <LOGO />
                    </div>
                    <div className="public-sidebar__title">
                        BC Brain Wellness <br /> Program
                    </div>
                </div>
            </aside>
            <div className="public-content">
                <main className="form-main">
                    { !isLargeScreen && <>
                        <div className="public-sidebar__inner">
                            <div className="public-sidebar__logo">
                                <LOGO />
                            </div>
                            <div className="public-sidebar__title">
                                BC Brain Wellness <br /> Program
                            </div>
                        </div>
                    </>}
                    {children}
                </main>
            </div>
        </div>
    </>);
}
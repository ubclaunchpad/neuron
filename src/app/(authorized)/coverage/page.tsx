"use client";

import { CoverageListView } from "@/components/coverage/coverage-list-view";
import { PageLayout, PageLayoutAside, PageLayoutContent, PageLayoutHeader, PageLayoutHeaderContent, PageLayoutHeaderTitle } from "@/components/page-layout";
import { WithPermission } from "@/components/utils/with-permission";
import { TypographyTitle } from "@/components/ui/typography";
import { Button } from "@/components/ui/button";
import { Bell, ChevronDown } from "lucide-react";
import { Suspense } from "react";
import { CoveragePageProvider } from "@/components/coverage/coverage-page-context";
import { CoverageAside } from "@/components/coverage/coverage-aside";
import { MonthInput } from "@/components/ui/date-input.tsx";
import { useState } from "react";

export default function CoveragePage() {
  // Changed from month selector, pass in 1st of selected month to children
  const [selectedDate, setSelectedDate] = useState(new Date());

  return (
    <WithPermission 
      permissions={{ permission: { coverage: ["view"] } }} 
      fallback={
        <div className="flex items-center justify-center h-full">
            <TypographyTitle>Access Denied</TypographyTitle>
        </div>
      }
    >
        <PageLayout>
            <CoveragePageProvider>
                <PageLayoutHeader hideShadow border="always" className="pb-0 block h-auto">
                    <div className="flex items-center justify-between py-4 pr-6">
                        <PageLayoutHeaderContent className="items-center">
                            <PageLayoutHeaderTitle>Coverage Requests</PageLayoutHeaderTitle>
                        </PageLayoutHeaderContent>

                        <div className="flex items-center gap-4">
                            {/* Mock Notifications Button */}
                            <Button variant="outline" size="sm" className="gap-2">
                                <Bell className="size-4" />
                                Notifications
                            </Button>
                        </div>
                    </div>
                    
                    <div className="flex items-center justify-between mt-4">
                        {/* Tabs */}
                        <div className="flex items-center border-b w-full">
                            <button className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground border-b-2 border-transparent hover:border-border transition-colors">
                                Absence Request
                            </button>
                            <button className="px-4 py-2 text-sm font-medium text-primary border-b-2 border-primary transition-colors">
                                Coverage Request
                            </button>
                            <div className="flex-1"></div>
                            <div className="pb-2 pr-6">
                                <Button variant="ghost" size="sm" className="h-8 gap-2 text-muted-foreground hover:text-foreground">
                                    Filters
                                </Button>
                            </div>
                        </div>
                    </div>
                </PageLayoutHeader>

                <PageLayoutAside>
                    <Suspense fallback={<>Loading coverage...</>}>
                        <CoverageAside></CoverageAside>
                    </Suspense>
                </PageLayoutAside>

                <PageLayoutContent className="px-6"> 
                    <div className="flex items-center gap-2 py-4">
                        <MonthInput 
                            onChange={(d?: Date) => d ? setSelectedDate(d) : null}
                            value={selectedDate}
                        ></MonthInput>
                    </div>
                    <CoverageListView date={selectedDate}/>
                </PageLayoutContent>
            </CoveragePageProvider>
        </PageLayout>
    </WithPermission>
  );
}
"use client";

import { VerifyUsersView } from "@/components/members/pages/verifiy-users-view";
import { ViewUsersView } from "@/components/members/pages/view-all-users-view";
import { ViewVolunteersView } from "@/components/members/pages/view-volunteers-view";
import {
  PageLayout,
  PageLayoutContent,
  PageLayoutHeader,
  PageLayoutHeaderContent,
  PageLayoutHeaderTitle,
} from "@/components/page-layout";
import { Badge } from "@/components/primitives/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/primitives/tabs";
import { cn } from "@/lib/utils";
import { clientApi } from "@/trpc/client";
import { parseAsStringEnum, useQueryState } from "nuqs";

enum MembersTabs {
  volunteers = "volunteers",
  users = "users",
  verification = "verification",
}

export default function MembersPage() {
  const [activeTab, setActiveTab] = useQueryState(
    "active",
    parseAsStringEnum<MembersTabs>(Object.values(MembersTabs))
      .withDefault(MembersTabs.volunteers)
      .withOptions({ clearOnDefault: false }),
  );

  const { data: verificationCount } =
    clientApi.user.verificationCount.useQuery();
  const verificationLoaded = verificationCount != undefined;

  return (
    <>
      <PageLayout className="overflow-hidden">
        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as MembersTabs)}
        >
          <PageLayoutHeader border="never">
            <PageLayoutHeaderContent>
              <PageLayoutHeaderTitle>Member Management</PageLayoutHeaderTitle>
            </PageLayoutHeaderContent>
          </PageLayoutHeader>
          <PageLayoutContent
            className={cn(
              "w-fill px-9 grid grid-rows-[auto_1fr] overflow-hidden",
              "max-h-[calc(100dvh-var(--page-header-h))] h-[calc(100dvh-var(--page-header-h))]",
            )}
          >
            <TabsList className="grid grid-cols-3 sm: w-[50%] mb-7 min-w-fit">
            <TabsTrigger value={MembersTabs.volunteers}>Volunteers</TabsTrigger>
              <TabsTrigger value={MembersTabs.users}>All Users</TabsTrigger>
              <TabsTrigger value={MembersTabs.verification} className="gap-1.5">
                <span className="not-sm:hidden">Pending Verification</span>
                <span className="sm:hidden">Pending</span>
                <Badge
                  variant="notification"
                  style={{
                    display:
                      verificationLoaded && verificationCount > 0
                        ? "block"
                        : "none",
                  }}
                >
                  {verificationCount}
                </Badge>
              </TabsTrigger>
            </TabsList>
            <TabsContent 
              forceMount 
              asChild 
              value={MembersTabs.volunteers} 
              className={cn(activeTab !== MembersTabs.volunteers && "hidden")}
            >
              <ViewVolunteersView />
            </TabsContent>
            <TabsContent 
              forceMount 
              asChild 
              value={MembersTabs.users} 
              className={cn(activeTab !== MembersTabs.users && "hidden")}
            >
              <ViewUsersView />
            </TabsContent>
            <TabsContent 
              forceMount 
              asChild 
              value={MembersTabs.verification} 
              className={cn(activeTab !== MembersTabs.verification && "hidden")}
            >
              <VerifyUsersView />
            </TabsContent>
          </PageLayoutContent>
        </Tabs>
      </PageLayout>
    </>
  );
}

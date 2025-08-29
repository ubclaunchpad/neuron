import type { auth } from "@/lib/auth";
import { adminPluginConfig } from "@/lib/auth/permissions";
import { adminClient, inferAdditionalFields } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
    baseURL: "http://localhost:3000",
    plugins: [
        inferAdditionalFields<typeof auth>(),
        adminClient(adminPluginConfig)
    ],
});


"use client"

import { Provider } from "@ebay/nice-modal-react";

export function ModalProvider({ children }: { children: React.ReactNode }) {
    return <Provider>{children}</Provider>;
}
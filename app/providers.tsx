"use client";

import { Refine } from "@refinedev/core";
import { RefineKbar, RefineKbarProvider } from "@refinedev/kbar";
import { Suspense } from "react";
import routerProvider from "@refinedev/nextjs-router";
import { authProvider } from "@/lib/auth/auth-provider";
import { getDataProvider } from "@/lib/data-provider";

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <RefineKbarProvider>
      <Refine
        routerProvider={routerProvider}
        dataProvider={getDataProvider()}
        authProvider={authProvider}
        resources={[
          {
            name: "customers",
            list: "/customers",
            show: "/customers/:id",
            create: "/customers/create",
            edit: "/customers/:id/edit",
            meta: { label: "Customers" },
          },
          {
            name: "jobs",
            list: "/jobs",
            show: "/jobs/:id",
            create: "/jobs/create",
            edit: "/jobs/:id/edit",
            meta: { label: "Jobs" },
          },
          {
            name: "invoices",
            list: "/invoices",
            show: "/invoices/:id",
            create: "/invoices/create",
            edit: "/invoices/:id/edit",
            meta: { label: "Invoices" },
          },
          {
            name: "payments",
            list: "/payments",
            meta: { label: "Payments" },
          },
        ]}
        options={{
          syncWithLocation: true,
          warnWhenUnsavedChanges: true,
        }}
      >
        {children}
        <Suspense>
          <RefineKbar />
        </Suspense>
      </Refine>
    </RefineKbarProvider>
  );
}

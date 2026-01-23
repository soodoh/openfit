"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Database, KeyRound, Users } from "lucide-react";
import { AuthProvidersTable } from "./AuthProvidersTable";
import { SharedEntitiesView } from "./SharedEntitiesView";
import { UserTable } from "./UserTable";

export function AdminPage() {
  return (
    <div className="mx-auto w-full px-4 sm:px-6 lg:px-8 max-w-(--breakpoint-xl) mt-8 pb-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Admin Panel</h1>
        <p className="text-muted-foreground">
          Manage global lookup data and users
        </p>
      </div>

      <Tabs defaultValue="entities" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="entities" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            <span>Shared Entities</span>
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span>Users</span>
          </TabsTrigger>
          <TabsTrigger value="auth" className="flex items-center gap-2">
            <KeyRound className="h-4 w-4" />
            <span>Auth</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="entities">
          <SharedEntitiesView />
        </TabsContent>

        <TabsContent value="users">
          <UserTable />
        </TabsContent>

        <TabsContent value="auth">
          <AuthProvidersTable />
        </TabsContent>
      </Tabs>
    </div>
  );
}

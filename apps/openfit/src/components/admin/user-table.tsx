import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/ui/pagination";
import { useAdminUsersPaginated } from "@/hooks";
import type { UserWithProfile } from "@/hooks";
import { Edit2, Search, Shield, User } from "lucide-react";
import { useCallback, useState } from "react";
import { UserRoleModal } from "./user-role-modal";
const DEFAULT_PAGE_SIZE = 10;
function UserTableSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div className="h-6 w-24 rounded bg-linear-to-br from-muted/50 to-muted/30 animate-pulse" />
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <div className="h-10 w-full rounded-md bg-linear-to-br from-muted/50 to-muted/30 animate-pulse" />
        </div>
        <div className="space-y-2">
          {Array.from({ length: 5 }, (_, i) => (
            <div
              key={i}
              className="flex items-center justify-between p-3 rounded-lg border"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-linear-to-br from-muted/50 to-muted/30 animate-pulse" />
                <div className="space-y-2">
                  <div className="h-4 w-48 rounded bg-linear-to-br from-muted/50 to-muted/30 animate-pulse" />
                  <div className="h-3 w-16 rounded bg-linear-to-br from-muted/50 to-muted/30 animate-pulse" />
                </div>
              </div>
              <div className="h-8 w-8 rounded bg-linear-to-br from-muted/50 to-muted/30 animate-pulse" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
export function UserTable(): any {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [editUser, setEditUser] = useState<UserWithProfile | undefined>(null);
  const { data, isLoading } = useAdminUsersPaginated({
    page: currentPage,
    pageSize,
    search: searchQuery || undefined,
  });
  const total = data?.total ?? 0;
  const items = data?.items ?? [];
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const startIndex = total === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endIndex = Math.min(currentPage * pageSize, total);
  const goToPage = useCallback(
    (page: number) => setCurrentPage(Math.max(1, Math.min(page, totalPages))),
    [totalPages],
  );
  const nextPage = useCallback(
    () => goToPage(currentPage + 1),
    [currentPage, goToPage],
  );
  const prevPage = useCallback(
    () => goToPage(currentPage - 1),
    [currentPage, goToPage],
  );
  const handlePageSizeChange = useCallback((size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  }, []);
  if (isLoading && !data) {
    return <UserTableSkeleton />;
  }
  const paginationProps = {
    currentPage,
    totalPages,
    startIndex,
    endIndex,
    totalItems: total,
    pageSize,
    onPageChange: goToPage,
    onPrevPage: prevPage,
    onNextPage: nextPage,
    onPageSizeChange: handlePageSizeChange,
  };
  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle>Users ({total})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-9"
              />
            </div>
          </div>

          <Pagination {...paginationProps} />

          {items.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchQuery
                ? `No users found matching "${searchQuery}"`
                : "No users yet"}
            </div>
          ) : (
            <div className="space-y-2">
              {items.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                      {user.role === "ADMIN" ? (
                        <Shield className="h-5 w-5 text-primary" />
                      ) : (
                        <User className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                    <div>
                      <span className="font-medium">{user.email}</span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge
                          variant={
                            user.role === "ADMIN" ? "default" : "secondary"
                          }
                          className="text-xs"
                        >
                          {user.role}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setEditUser(user)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          <Pagination {...paginationProps} />
        </CardContent>
      </Card>

      <UserRoleModal user={editUser} onClose={() => setEditUser(null)} />
    </>
  );
}

export default UserTable;

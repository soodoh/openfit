import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/ui/pagination";
import { useAdminLookupPaginated, useCreateLookup, useDeleteLookup, useUpdateLookup } from '@/hooks';
import type { LookupItem } from '@/hooks';
import { Edit2, Plus, Search, Trash2 } from "lucide-react";
import { useCallback, useState } from "react";
import { DeleteLookupModal } from "./delete-lookup-modal";
import { LookupFormModal } from "./lookup-form-modal";
const DEFAULT_PAGE_SIZE = 10;
type LookupType = "equipment" | "categories" | "muscleGroups" | "weightUnits" | "repetitionUnits";
type LookupTableProps = {
    title: string;
    singularTitle: string;
    lookupType: LookupType;
};
// Local type for items with id
type LookupItemWithId = {
    id: string;
} & LookupItem;
function LookupTableSkeleton({ title }: {
    title: string;
}) {
    return (<Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle>{title}</CardTitle>
        <div className="h-9 w-24 rounded-md bg-linear-to-br from-muted/50 to-muted/30 animate-pulse"/>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <div className="h-10 w-full rounded-md bg-linear-to-br from-muted/50 to-muted/30 animate-pulse"/>
        </div>
        <div className="space-y-2">
          {Array.from({ length: 5 }, (_, i) => (<div key={i} className="flex items-center justify-between p-3 rounded-lg border">
              <div className="h-4 w-32 rounded bg-linear-to-br from-muted/50 to-muted/30 animate-pulse"/>
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded bg-linear-to-br from-muted/50 to-muted/30 animate-pulse"/>
                <div className="h-8 w-8 rounded bg-linear-to-br from-muted/50 to-muted/30 animate-pulse"/>
              </div>
            </div>))}
        </div>
      </CardContent>
    </Card>);
}
export function LookupTable({ title, singularTitle, lookupType, }: LookupTableProps): any {
    const [searchQuery, setSearchQuery] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
    const [formModalOpen, setFormModalOpen] = useState(false);
    const [editItem, setEditItem] = useState<LookupItemWithId | undefined>(null);
    const [deleteItem, setDeleteItem] = useState<LookupItemWithId | undefined>(null);
    const { data, isLoading } = useAdminLookupPaginated(lookupType, {
        page: currentPage,
        pageSize,
        search: searchQuery || undefined,
    });
    const createLookupMutation = useCreateLookup();
    const updateLookupMutation = useUpdateLookup();
    const deleteLookupMutation = useDeleteLookup();
    const total = data?.total ?? 0;
    const items = data?.items ?? [];
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const startIndex = total === 0 ? 0 : (currentPage - 1) * pageSize + 1;
    const endIndex = Math.min(currentPage * pageSize, total);
    const goToPage = useCallback((page: number) => setCurrentPage(Math.max(1, Math.min(page, totalPages))), [totalPages]);
    const nextPage = useCallback(() => goToPage(currentPage + 1), [currentPage, goToPage]);
    const prevPage = useCallback(() => goToPage(currentPage - 1), [currentPage, goToPage]);
    const handlePageSizeChange = useCallback((size: number) => {
        setPageSize(size);
        setCurrentPage(1);
    }, []);
    const handleCreate = () => {
        setEditItem(null);
        setFormModalOpen(true);
    };
    const handleEdit = (item: LookupItemWithId) => {
        setEditItem(item);
        setFormModalOpen(true);
    };
    const handleCloseForm = () => {
        setFormModalOpen(false);
        setEditItem(null);
    };
    const handleFormSubmit = async (name: string) => {
        if (editItem) {
            await updateLookupMutation.mutateAsync({
                id: editItem.id,
                type: lookupType,
                name,
            });
        }
        else {
            await createLookupMutation.mutateAsync({
                type: lookupType,
                name,
            });
        }
        handleCloseForm();
    };
    const handleDelete = async (item: LookupItemWithId) => {
        await deleteLookupMutation.mutateAsync({
            id: item.id,
            type: lookupType,
        });
        setDeleteItem(null);
    };
    if (isLoading && !data) {
        return <LookupTableSkeleton title={title}/>;
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
    return (<>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle>{title}</CardTitle>
          <Button onClick={handleCreate} size="sm">
            <Plus className="h-4 w-4 mr-2"/>
            Add {singularTitle}
          </Button>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"/>
              <Input placeholder={`Search ${title.toLowerCase()}...`} value={searchQuery} onChange={(e) => {
            setSearchQuery(e.target.value);
            setCurrentPage(1);
        }} className="pl-9"/>
            </div>
          </div>

          <Pagination {...paginationProps}/>

          {items.length === 0 ? (<div className="text-center py-8 text-muted-foreground">
              {searchQuery
                ? `No ${title.toLowerCase()} found matching "${searchQuery}"`
                : `No ${title.toLowerCase()} yet`}
            </div>) : (<div className="space-y-2">
              {items.map((item) => (<div key={item.id} className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                  <span className="font-medium">{item.name}</span>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(item)}>
                      <Edit2 className="h-4 w-4"/>
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setDeleteItem(item)} className="text-destructive hover:text-destructive">
                      <Trash2 className="h-4 w-4"/>
                    </Button>
                  </div>
                </div>))}
            </div>)}

          <Pagination {...paginationProps}/>
        </CardContent>
      </Card>

      <LookupFormModal open={formModalOpen} onClose={handleCloseForm} title={singularTitle} item={editItem} onSubmit={handleFormSubmit} isPending={createLookupMutation.isPending || updateLookupMutation.isPending}/>

      <DeleteLookupModal item={deleteItem} title={singularTitle} onClose={() => setDeleteItem(null)} onDelete={handleDelete} isPending={deleteLookupMutation.isPending}/>
    </>);
}

export default LookupTable;

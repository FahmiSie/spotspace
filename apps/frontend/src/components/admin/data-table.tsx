"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Pencil, Trash2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export interface Column<T> {
  key: string;
  label: string;
  render?: (row: T) => React.ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[] | undefined;
  isLoading: boolean;
  onEdit?: (row: T) => void;
  onDelete?: (row: T) => void;
  searchPlaceholder?: string;
  onSearch?: (query: string) => void;
  pageSize?: number;
  emptyMessage?: string;
  actions?: (row: T) => React.ReactNode;
}

export function DataTable<T extends { id: number }>({
  columns,
  data,
  isLoading,
  onEdit,
  onDelete,
  searchPlaceholder = "Cari...",
  onSearch,
  pageSize = 10,
  emptyMessage = "Tidak ada data.",
  actions,
}: DataTableProps<T>) {
  const [page, setPage] = useState(0);
  const [searchValue, setSearchValue] = useState("");

  const totalItems = data?.length ?? 0;
  const totalPages = Math.ceil(totalItems / pageSize);
  const paginatedData = data?.slice(page * pageSize, (page + 1) * pageSize) ?? [];

  const handleSearch = (val: string) => {
    setSearchValue(val);
    setPage(0);
    onSearch?.(val);
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {onSearch && <Skeleton className="h-10 w-64 rounded-lg" />}
        <div className="bg-white rounded-xl border border-stone/50 overflow-hidden">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex gap-4 px-6 py-4 border-b border-stone/30">
              {columns.map((_, j) => (
                <Skeleton key={j} className="h-4 flex-1 rounded" />
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {onSearch && (
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink" />
          <input
            type="text"
            value={searchValue}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-stone/50 bg-white text-sm text-ink placeholder:text-ink outline-none focus:border-[#EF6905] transition-colors"
          />
        </div>
      )}

      <div className="bg-white rounded-xl border border-stone/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stone/50 bg-stone/10">
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className="text-left px-6 py-3 font-bold text-ink text-xs uppercase tracking-wider whitespace-nowrap"
                  >
                    {col.label}
                  </th>
                ))}
                {(onEdit || onDelete || actions) && (
                  <th className="text-right px-6 py-3 font-bold text-ink text-xs uppercase tracking-wider">
                    ACTION
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {paginatedData.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length + (onEdit || onDelete || actions ? 1 : 0)}
                    className="px-6 py-16 text-center text-ink"
                  >
                    {emptyMessage}
                  </td>
                </tr>
              ) : (
                paginatedData.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-stone/30 last:border-b-0 hover:bg-stone/5 transition-colors"
                  >
                    {columns.map((col) => (
                      <td key={col.key} className="px-6 py-4 text-ink whitespace-nowrap">
                        {col.render
                          ? col.render(row)
                          : (row as any)[col.key] ?? "-"}
                      </td>
                    ))}
                    {(onEdit || onDelete || actions) && (
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {actions ? (
                            actions(row)
                          ) : (
                            <>
                              {onEdit && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => onEdit(row)}
                                  className="text-ink hover:text-ink"
                                >
                                  <Pencil className="w-4 h-4" />
                                </Button>
                              )}
                              {onDelete && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => onDelete(row)}
                                  className="text-[#B0523A] hover:text-[#B0523A]/80"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-3 border-t border-stone/50 bg-stone/5">
            <span className="text-xs text-ink">
              {page * pageSize + 1}–{Math.min((page + 1) * pageSize, totalItems)} dari {totalItems}
            </span>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                disabled={page === 0}
                onClick={() => setPage((p) => p - 1)}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-xs text-ink px-2">
                {page + 1} / {totalPages}
              </span>
              <Button
                variant="ghost"
                size="sm"
                disabled={page >= totalPages - 1}
                onClick={() => setPage((p) => p + 1)}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

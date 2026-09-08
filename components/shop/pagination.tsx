"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function Pagination({ currentPage, totalPages }: { currentPage: number; totalPages: number }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  if (totalPages <= 1) return null;

  function goTo(page: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(page));
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="mt-10 flex items-center justify-center gap-2">
      <Button variant="outline" size="icon" disabled={currentPage <= 1} onClick={() => goTo(currentPage - 1)}>
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <span className="px-4 text-sm text-muted-foreground">
        Page {currentPage} of {totalPages}
      </span>
      <Button variant="outline" size="icon" disabled={currentPage >= totalPages} onClick={() => goTo(currentPage + 1)}>
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}

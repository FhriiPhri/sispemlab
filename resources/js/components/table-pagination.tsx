import { router } from '@inertiajs/react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Matches Laravel LengthAwarePaginator JSON structure exactly
export type PaginatedData<T> = {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
    next_page_url: string | null;
    prev_page_url: string | null;
    first_page_url: string | null;
    last_page_url: string | null;
    path: string;
    links: Array<{ url: string | null; label: string; active: boolean }>;
};

type TablePaginationProps = Pick<
    PaginatedData<unknown>,
    | 'current_page'
    | 'last_page'
    | 'from'
    | 'to'
    | 'total'
    | 'next_page_url'
    | 'prev_page_url'
    | 'first_page_url'
    | 'last_page_url'
    | 'links'
>;

export default function TablePagination({
    current_page,
    last_page,
    from,
    to,
    total,
    next_page_url,
    prev_page_url,
    first_page_url,
    last_page_url,
    links,
}: TablePaginationProps) {
    const navigate = (url: string | null) => {
        if (url) router.visit(url, { preserveScroll: true });
    };

    if (last_page <= 1) return null;

    // Filter links to only numeric pages (exclude prev/next labels)
    const pageLinks = links.filter(
        (l) => l.label !== '&laquo; Previous' && l.label !== 'Next &raquo;',
    );

    return (
        <div className="flex items-center justify-between px-4 py-3 border-t border-border/50">
            <p className="text-xs text-muted-foreground">
                Menampilkan{' '}
                <span className="font-medium">{from ?? 0}</span>
                {' – '}
                <span className="font-medium">{to ?? 0}</span>
                {' dari '}
                <span className="font-medium">{total}</span> data
            </p>

            <div className="flex items-center gap-1">
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => navigate(first_page_url)}
                    disabled={current_page === 1}
                    title="Halaman pertama"
                >
                    <ChevronsLeft className="h-4 w-4" />
                </Button>
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => navigate(prev_page_url)}
                    disabled={!prev_page_url}
                    title="Halaman sebelumnya"
                >
                    <ChevronLeft className="h-4 w-4" />
                </Button>

                {pageLinks.map((link, idx) =>
                    link.label === '...' ? (
                        <span key={`ellipsis-${idx}`} className="px-1 text-muted-foreground text-sm select-none">
                            …
                        </span>
                    ) : (
                        <Button
                            key={link.label}
                            variant={link.active ? 'default' : 'ghost'}
                            size="sm"
                            className="h-8 w-8 p-0 text-xs"
                            onClick={() => navigate(link.url)}
                            disabled={!link.url || link.active}
                        >
                            {link.label}
                        </Button>
                    ),
                )}

                <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => navigate(next_page_url)}
                    disabled={!next_page_url}
                    title="Halaman berikutnya"
                >
                    <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => navigate(last_page_url)}
                    disabled={current_page === last_page}
                    title="Halaman terakhir"
                >
                    <ChevronsRight className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}

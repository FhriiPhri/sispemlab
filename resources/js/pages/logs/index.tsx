import { Activity, Clock } from 'lucide-react';
import Heading from '@/components/heading';
import TablePagination, { type PaginatedData } from '@/components/table-pagination';
import { Badge } from '@/components/ui/badge';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';

type LogRecord = {
    id: number;
    created_at: string;
    action: string;
    description: string;
    user: {
        name: string;
        role: string;
    } | null;
};

type Props = {
    logs: PaginatedData<LogRecord>;
};

export default function LogsIndex({ logs }: Props) {
    const logsList = logs.data;
    return (
        <div className="space-y-6 p-4 md:p-6 w-full max-w-full overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <Heading
                    title="Log Aktifitas"
                    description="Pantau seluruh perubahan sistem, autentikasi, dan riwayat aktivitas pengguna."
                />
            </div>

            <Card className="overflow-hidden border-border bg-card shadow-sm">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader className="bg-muted/50">
                            <TableRow>
                                <TableHead className="w-[180px]">Waktu</TableHead>
                                <TableHead className="min-w-[150px]">Aktor / Pengguna</TableHead>
                                <TableHead className="min-w-[150px]">Jenis Aksi</TableHead>
                                <TableHead className="min-w-[300px]">Deskripsi Detail</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {logsList?.map((log) => (
                                <TableRow key={log.id} className="group transition-colors">
                                    <TableCell className="align-top whitespace-nowrap">
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <Clock className="h-3 w-3" />
                                            {new Date(log.created_at).toLocaleString('id-ID', {
                                                year: 'numeric',
                                                month: 'short',
                                                day: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit',
                                                second: '2-digit',
                                            })}
                                        </div>
                                    </TableCell>
                                    <TableCell className="align-top">
                                        <div className="flex flex-col gap-1">
                                            <span className="font-medium">
                                                {log.user?.name ?? 'Sistem'}
                                            </span>
                                            {log.user?.role && (
                                                <span className="text-xs text-muted-foreground capitalize">
                                                    {log.user.role}
                                                </span>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="align-top">
                                        <Badge variant="outline" className="font-mono text-xs uppercase bg-slate-100 dark:bg-slate-800 border-transparent">
                                            {log.action}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="align-top text-sm">
                                        {log.description}
                                    </TableCell>
                                </TableRow>
                            ))}
                            {(!logsList || logsList.length === 0) && (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <Activity className="h-8 w-8 text-muted-foreground/50" />
                                            Belum ada log aktifitas yang tercatat.
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
                <TablePagination
                    current_page={logs.current_page}
                    last_page={logs.last_page}
                    from={logs.from}
                    to={logs.to}
                    total={logs.total}
                    next_page_url={logs.next_page_url}
                    prev_page_url={logs.prev_page_url}
                    first_page_url={logs.first_page_url}
                    last_page_url={logs.last_page_url}
                    links={logs.links}
                />
            </Card>
        </div>
    );
}

LogsIndex.layout = {
    breadcrumbs: [{ title: 'Log Aktifitas', href: '/logs' }],
};

import { Head, usePage } from '@inertiajs/react';
import { useEffect } from 'react';
import { Badge } from '@/components/ui/badge';

type Props = {
    start_date: string;
    end_date: string;
    type: string;
    loans: any[];
    returns: any[];
    users?: any[];
    categories?: any[];
    toolsData?: any[];
    activityLogs?: any[];
};

export default function ReportsPrint({
    start_date,
    end_date,
    type,
    loans,
    returns,
    users,
    categories,
    toolsData,
    activityLogs,
}: Props) {
    const { auth } = usePage<any>().props;

    useEffect(() => {
        // Automatically open the print dialog when the component mounts
        setTimeout(() => {
            window.print();
        }, 500);
    }, []);

    const renderLoanTable = () => {
        if (loans.length === 0)
            return (
                <p className="my-4 text-gray-500 italic">
                    Tidak ada data peminjaman di rentang tanggal ini.
                </p>
            );

        return (
            <div className="mb-8">
                <h3 className="mb-2 border-b-2 border-black pb-1 text-lg font-bold uppercase">
                    Data Peminjaman
                </h3>
                <table className="w-full border-collapse border border-gray-800 text-sm">
                    <thead>
                        <tr className="bg-gray-100 print:bg-gray-100">
                            <th className="border border-gray-800 px-3 py-2 text-left">
                                No
                            </th>
                            <th className="border border-gray-800 px-3 py-2 text-left">
                                Tanggal
                            </th>
                            <th className="border border-gray-800 px-3 py-2 text-left">
                                Peminjam
                            </th>
                            <th className="border border-gray-800 px-3 py-2 text-left">
                                Nama Alat
                            </th>
                            <th className="border border-gray-800 px-3 py-2 text-center">
                                Jumlah
                            </th>
                            <th className="border border-gray-800 px-3 py-2 text-left">
                                Status
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {loans.map((loan, index) => (
                            <tr key={loan.id}>
                                <td className="border border-gray-800 px-3 py-2 text-center">
                                    {index + 1}
                                </td>
                                <td className="border border-gray-800 px-3 py-2">
                                    {new Date(
                                        loan.loan_date,
                                    ).toLocaleDateString('id-ID')}
                                </td>
                                <td className="border border-gray-800 px-3 py-2">
                                    {loan.borrower_name}
                                </td>
                                <td className="border border-gray-800 px-3 py-2">
                                    {loan.items
                                        ?.map(
                                            (i: any) =>
                                                `${i.tool?.name} (x${i.quantity})`,
                                        )
                                        .join(', ')}
                                </td>
                                <td className="border border-gray-800 px-3 py-2 text-center">
                                    {loan.items?.reduce(
                                        (sum: number, i: any) =>
                                            sum + i.quantity,
                                        0,
                                    ) || 0}
                                </td>
                                <td className="border border-gray-800 px-3 py-2 capitalize">
                                    {loan.status}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    };

    const renderReturnTable = () => {
        if (returns.length === 0)
            return (
                <p className="my-4 text-gray-500 italic">
                    Tidak ada data pengembalian di rentang tanggal ini.
                </p>
            );

        return (
            <div className="mb-8">
                <h3 className="mb-2 border-b-2 border-black pb-1 text-lg font-bold uppercase">
                    Data Pengembalian
                </h3>
                <table className="w-full border-collapse border border-gray-800 text-sm">
                    <thead>
                        <tr className="bg-gray-100 print:bg-gray-100">
                            <th className="border border-gray-800 px-3 py-2 text-left">
                                No
                            </th>
                            <th className="border border-gray-800 px-3 py-2 text-left">
                                Tanggal Balik
                            </th>
                            <th className="border border-gray-800 px-3 py-2 text-left">
                                Peminjam
                            </th>
                            <th className="border border-gray-800 px-3 py-2 text-left">
                                Alat
                            </th>
                            <th className="border border-gray-800 px-3 py-2 text-left">
                                Kondisi
                            </th>
                            <th className="border border-gray-800 px-3 py-2 text-right">
                                Denda
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {returns.map((ret, index) => (
                            <tr key={ret.id}>
                                <td className="border border-gray-800 px-3 py-2 text-center">
                                    {index + 1}
                                </td>
                                <td className="border border-gray-800 px-3 py-2">
                                    {new Date(
                                        ret.return_date,
                                    ).toLocaleDateString('id-ID')}
                                </td>
                                <td className="border border-gray-800 px-3 py-2">
                                    {ret.loan?.borrower_name}
                                </td>
                                <td className="border border-gray-800 px-3 py-2">
                                    {ret.loan?.items
                                        ?.map(
                                            (i: any) =>
                                                `${i.tool?.name} (x${i.quantity})`,
                                        )
                                        .join(', ') || '-'}
                                </td>
                                <td className="border border-gray-800 px-3 py-2">
                                    {ret.condition_note || 'Baik'}
                                </td>
                                <td className="border border-gray-800 px-3 py-2 text-right">
                                    Rp {ret.fine.toLocaleString('id-ID')}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    };

    const renderUserTable = () => {
        if (!users || users.length === 0)
            return (
                <p className="my-4 text-gray-500 italic">
                    Tidak ada data user.
                </p>
            );

        return (
            <div className="mb-8">
                <h3 className="mb-2 border-b-2 border-black pb-1 text-lg font-bold uppercase">
                    Data User
                </h3>
                <table className="w-full border-collapse border border-gray-800 text-sm">
                    <thead>
                        <tr className="bg-gray-100 print:bg-gray-100">
                            <th className="border border-gray-800 px-3 py-2 text-left">
                                No
                            </th>
                            <th className="border border-gray-800 px-3 py-2 text-left">
                                Nama Lengkap
                            </th>
                            <th className="border border-gray-800 px-3 py-2 text-left">
                                Email
                            </th>
                            <th className="border border-gray-800 px-3 py-2 text-left">
                                Peran
                            </th>
                            <th className="border border-gray-800 px-3 py-2 text-left">
                                Identitas (NIS/NIP)
                            </th>
                            <th className="border border-gray-800 px-3 py-2 text-left">
                                No. HP
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map((u, index) => (
                            <tr key={u.id}>
                                <td className="border border-gray-800 px-3 py-2 text-center">
                                    {index + 1}
                                </td>
                                <td className="border border-gray-800 px-3 py-2">
                                    {u.name}
                                </td>
                                <td className="border border-gray-800 px-3 py-2">
                                    {u.email}
                                </td>
                                <td className="border border-gray-800 px-3 py-2 capitalize">
                                    {u.role}
                                </td>
                                <td className="border border-gray-800 px-3 py-2">
                                    {u.identifier || '-'}
                                </td>
                                <td className="border border-gray-800 px-3 py-2">
                                    {u.phone || '-'}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    };

    const renderCategoryTable = () => {
        if (!categories || categories.length === 0)
            return (
                <p className="my-4 text-gray-500 italic">
                    Tidak ada data kategori.
                </p>
            );

        return (
            <div className="mb-8">
                <h3 className="mb-2 border-b-2 border-black pb-1 text-lg font-bold uppercase">
                    Data Kategori
                </h3>
                <table className="w-full border-collapse border border-gray-800 text-sm">
                    <thead>
                        <tr className="bg-gray-100 print:bg-gray-100">
                            <th className="border border-gray-800 px-3 py-2 text-left">
                                No
                            </th>
                            <th className="border border-gray-800 px-3 py-2 text-left">
                                Nama Kategori
                            </th>
                            <th className="border border-gray-800 px-3 py-2 text-left">
                                Deskripsi
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {categories.map((c, index) => (
                            <tr key={c.id}>
                                <td className="border border-gray-800 px-3 py-2 text-center">
                                    {index + 1}
                                </td>
                                <td className="border border-gray-800 px-3 py-2">
                                    {c.name}
                                </td>
                                <td className="border border-gray-800 px-3 py-2">
                                    {c.description || '-'}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    };

    const renderToolTable = () => {
        if (!toolsData || toolsData.length === 0)
            return (
                <p className="my-4 text-gray-500 italic">
                    Tidak ada data alat.
                </p>
            );

        return (
            <div className="mb-8">
                <h3 className="mb-2 border-b-2 border-black pb-1 text-lg font-bold uppercase">
                    Data Alat
                </h3>
                <table className="w-full border-collapse border border-gray-800 text-sm">
                    <thead>
                        <tr className="bg-gray-100 print:bg-gray-100">
                            <th className="border border-gray-800 px-3 py-2 text-left">
                                No
                            </th>
                            <th className="border border-gray-800 px-3 py-2 text-left">
                                Kode
                            </th>
                            <th className="border border-gray-800 px-3 py-2 text-left">
                                Nama Alat
                            </th>
                            <th className="border border-gray-800 px-3 py-2 text-left">
                                Kategori
                            </th>
                            <th className="border border-gray-800 px-3 py-2 text-left">
                                Merk
                            </th>
                            <th className="border border-gray-800 px-3 py-2 text-center">
                                Stok
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {toolsData.map((t, index) => (
                            <tr key={t.id}>
                                <td className="border border-gray-800 px-3 py-2 text-center">
                                    {index + 1}
                                </td>
                                <td className="border border-gray-800 px-3 py-2">
                                    {t.code}
                                </td>
                                <td className="border border-gray-800 px-3 py-2">
                                    {t.name}
                                </td>
                                <td className="border border-gray-800 px-3 py-2">
                                    {t.category?.name || '-'}
                                </td>
                                <td className="border border-gray-800 px-3 py-2">
                                    {t.brand || '-'}
                                </td>
                                <td className="border border-gray-800 px-3 py-2 text-center">
                                    {t.stock_available} / {t.stock_total}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    };

    const renderLogTable = () => {
        const logs = activityLogs ?? [];
        if (logs.length === 0)
            return (
                <p className="my-4 text-gray-500 italic">
                    Tidak ada data log aktivitas.
                </p>
            );

        return (
            <div className="mb-8">
                <h3 className="mb-2 border-b-2 border-black pb-1 text-lg font-bold uppercase">
                    Log Aktivitas
                </h3>
                <table className="w-full border-collapse border border-gray-800 text-sm">
                    <thead>
                        <tr className="bg-gray-100 print:bg-gray-100">
                            <th className="border border-gray-800 px-3 py-2 text-left">
                                No
                            </th>
                            <th className="border border-gray-800 px-3 py-2 text-left">
                                Waktu
                            </th>
                            <th className="border border-gray-800 px-3 py-2 text-left">
                                Pengguna
                            </th>
                            <th className="border border-gray-800 px-3 py-2 text-left">
                                Peran
                            </th>
                            <th className="border border-gray-800 px-3 py-2 text-left">
                                Aksi
                            </th>
                            <th className="border border-gray-800 px-3 py-2 text-left">
                                Deskripsi
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {logs.map((log: any, index: number) => (
                            <tr
                                key={log.id}
                                className={index % 2 === 0 ? '' : 'bg-gray-50'}
                            >
                                <td className="border border-gray-800 px-3 py-2 text-center">
                                    {index + 1}
                                </td>
                                <td className="border border-gray-800 px-3 py-2 text-xs whitespace-nowrap">
                                    {log.created_at
                                        ? new Date(
                                              log.created_at,
                                          ).toLocaleString('id-ID')
                                        : '-'}
                                </td>
                                <td className="border border-gray-800 px-3 py-2">
                                    {log.user?.name ?? 'Sistem'}
                                </td>
                                <td className="border border-gray-800 px-3 py-2 capitalize">
                                    {log.user?.role ?? '-'}
                                </td>
                                <td className="border border-gray-800 px-3 py-2 font-mono text-xs">
                                    {log.action}
                                </td>
                                <td className="border border-gray-800 px-3 py-2">
                                    {log.description}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-white text-black">
            <Head title="Cetak Laporan - SispemTB" />

            {/* Print Container that mimics A4 width mostly */}
            <div className="mx-auto max-w-[21cm] px-4 py-8 sm:px-8 print:mx-0 print:max-w-none print:px-[1.5cm] print:py-[1.5cm]">
                {/* Header Kop Surat */}
                <div className="mb-6 border-b-4 border-double border-black pb-4 text-center">
                    <h1 className="text-2xl font-bold tracking-wider uppercase">
                        SispemTB
                    </h1>
                    <p className="mt-1 text-sm">
                        Jl. Pekapuran No.37, Kec. Cimanggis, Kota Depok
                    </p>
                    <p className="text-sm">
                        Email: admin@smktarunabhakti.sch.id | Telepon: 021
                        7401919
                    </p>
                </div>

                {/* Judul Laporan */}
                <div className="mb-8 text-center">
                    <h2 className="text-xl font-bold uppercase underline">
                        {type === 'semua' && 'Laporan Semua Data'}
                        {type === 'peminjaman' && 'Laporan Data Peminjaman'}
                        {type === 'pengembalian' && 'Laporan Data Pengembalian'}
                        {type === 'user' && 'Laporan Data User'}
                        {type === 'kategori' && 'Laporan Data Kategori'}
                        {type === 'alat' && 'Laporan Data Alat'}
                        {type === 'log' && 'Laporan Log Aktivitas'}
                    </h2>
                    {(type === 'peminjaman' ||
                        type === 'pengembalian' ||
                        type === 'semua') && (
                        <p className="mt-2 text-sm">
                            Periode:{' '}
                            {new Date(start_date).toLocaleDateString('id-ID')}{' '}
                            s/d {new Date(end_date).toLocaleDateString('id-ID')}
                        </p>
                    )}
                </div>

                {/* Konten Tabel */}
                {(type === 'peminjaman' || type === 'semua') &&
                    renderLoanTable()}
                {(type === 'pengembalian' || type === 'semua') &&
                    renderReturnTable()}
                {(type === 'user' || type === 'semua') && renderUserTable()}
                {(type === 'kategori' || type === 'semua') &&
                    renderCategoryTable()}
                {(type === 'alat' || type === 'semua') && renderToolTable()}
                {(type === 'log' || type === 'semua') && renderLogTable()}

                {/* Tanda Tangan */}
                <div className="mt-16 flex justify-end">
                    <div className="w-64 text-center">
                        <p className="mb-20">Mengetahui,</p>
                        <p className="font-bold underline">{auth.user.name}</p>
                        <p className="text-sm capitalize">{auth.user.role}</p>
                    </div>
                </div>
            </div>

            {/* Print styles using Tailwind's print modifier + global CSS injection for margins */}
            <style
                dangerouslySetInnerHTML={{
                    __html: `
                @media print {
                    @page { margin: 0mm; size: auto; }
                    body { background-color: white !important; -webkit-print-color-adjust: exact; color-adjust: exact; margin: 0; padding: 0; }
                }
            `,
                }}
            />
        </div>
    );
}

// We intentionally skip the global AppLayout which has sidebar.
ReportsPrint.layout = (page: any) => page;
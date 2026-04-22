import { Head, usePage } from '@inertiajs/react';
import { useEffect } from 'react';
import { Badge } from '@/components/ui/badge';

type Props = {
    start_date: string;
    end_date: string;
    type: string;
    loans: any[];
    returns: any[];
};

export default function ReportsPrint({ start_date, end_date, type, loans, returns }: Props) {
    const { auth } = usePage<any>().props;

    useEffect(() => {
        // Automatically open the print dialog when the component mounts
        setTimeout(() => {
            window.print();
        }, 500);
    }, []);

    const renderLoanTable = () => {
        if (loans.length === 0) return <p className="text-gray-500 italic my-4">Tidak ada data peminjaman di rentang tanggal ini.</p>;

        return (
            <div className="mb-8">
                <h3 className="text-lg font-bold mb-2 uppercase border-b-2 border-black pb-1">Data Peminjaman</h3>
                <table className="w-full text-sm border-collapse border border-gray-800">
                    <thead>
                        <tr className="bg-gray-100 print:bg-gray-100">
                            <th className="border border-gray-800 px-3 py-2 text-left">No</th>
                            <th className="border border-gray-800 px-3 py-2 text-left">Tanggal</th>
                            <th className="border border-gray-800 px-3 py-2 text-left">Peminjam</th>
                            <th className="border border-gray-800 px-3 py-2 text-left">Nama Alat</th>
                            <th className="border border-gray-800 px-3 py-2 text-center">Jumlah</th>
                            <th className="border border-gray-800 px-3 py-2 text-left">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loans.map((loan, index) => (
                            <tr key={loan.id}>
                                <td className="border border-gray-800 px-3 py-2 text-center">{index + 1}</td>
                                <td className="border border-gray-800 px-3 py-2">{new Date(loan.loan_date).toLocaleDateString('id-ID')}</td>
                                <td className="border border-gray-800 px-3 py-2">{loan.borrower_name}</td>
                                <td className="border border-gray-800 px-3 py-2">
                                    {loan.items?.map((i: any) => `${i.tool?.name} (x${i.quantity})`).join(', ')}
                                </td>
                                <td className="border border-gray-800 px-3 py-2 text-center">
                                    {loan.items?.reduce((sum: number, i: any) => sum + i.quantity, 0) || 0}
                                </td>
                                <td className="border border-gray-800 px-3 py-2 capitalize">{loan.status}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    };

    const renderReturnTable = () => {
        if (returns.length === 0) return <p className="text-gray-500 italic my-4">Tidak ada data pengembalian di rentang tanggal ini.</p>;

        return (
            <div className="mb-8">
                <h3 className="text-lg font-bold mb-2 uppercase border-b-2 border-black pb-1">Data Pengembalian</h3>
                <table className="w-full text-sm border-collapse border border-gray-800">
                    <thead>
                        <tr className="bg-gray-100 print:bg-gray-100">
                            <th className="border border-gray-800 px-3 py-2 text-left">No</th>
                            <th className="border border-gray-800 px-3 py-2 text-left">Tanggal Balik</th>
                            <th className="border border-gray-800 px-3 py-2 text-left">Peminjam</th>
                            <th className="border border-gray-800 px-3 py-2 text-left">Alat</th>
                            <th className="border border-gray-800 px-3 py-2 text-left">Kondisi</th>
                            <th className="border border-gray-800 px-3 py-2 text-right">Denda</th>
                        </tr>
                    </thead>
                    <tbody>
                        {returns.map((ret, index) => (
                            <tr key={ret.id}>
                                <td className="border border-gray-800 px-3 py-2 text-center">{index + 1}</td>
                                <td className="border border-gray-800 px-3 py-2">{new Date(ret.return_date).toLocaleDateString('id-ID')}</td>
                                <td className="border border-gray-800 px-3 py-2">{ret.loan?.borrower_name}</td>
                                <td className="border border-gray-800 px-3 py-2">
                                    {ret.loan?.items?.map((i: any) => `${i.tool?.name} (x${i.quantity})`).join(', ') || '-'}
                                </td>
                                <td className="border border-gray-800 px-3 py-2">{ret.condition_note || 'Baik'}</td>
                                <td className="border border-gray-800 px-3 py-2 text-right">Rp {ret.fine.toLocaleString('id-ID')}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    };

    return (
        <div className="bg-white text-black min-h-screen">
            <Head title="Cetak Laporan - SispemTB" />
            
            {/* Print Container that mimics A4 width mostly */}
            <div className="max-w-[21cm] mx-auto py-8 px-4 sm:px-8 print:py-[1.5cm] print:px-[1.5cm] print:mx-0 print:max-w-none">
                {/* Header Kop Surat */}
                <div className="text-center border-b-4 border-double border-black pb-4 mb-6">
                    <h1 className="text-2xl font-bold uppercase tracking-wider">SispemTB</h1>
                    <p className="text-sm mt-1">Jl. Pekapuran No.37, Kec. Cimanggis, Kota Depok</p>
                    <p className="text-sm">Email: admin@smktarunabhakti.sch.id | Telepon: 021 7401919</p>
                </div>

                {/* Judul Laporan */}
                <div className="text-center mb-8">
                    <h2 className="text-xl font-bold underline uppercase">
                        Laporan Registrasi 
                        {type === 'peminjaman' && " Peminjaman"}
                        {type === 'pengembalian' && " Pengembalian"}
                    </h2>
                    <p className="mt-2 text-sm">
                        Periode: {new Date(start_date).toLocaleDateString('id-ID')} s/d {new Date(end_date).toLocaleDateString('id-ID')}
                    </p>
                </div>

                {/* Konten Tabel */}
                {(type === 'peminjaman' || type === 'semua') && renderLoanTable()}
                {(type === 'pengembalian' || type === 'semua') && renderReturnTable()}

                {/* Tanda Tangan */}
                <div className="mt-16 flex justify-end">
                    <div className="text-center w-64">
                        <p className="mb-20">Mengetahui,</p>
                        <p className="font-bold underline">{auth.user.name}</p>
                        <p className="text-sm capitalize">{auth.user.role}</p>
                    </div>
                </div>
            </div>

            {/* Print styles using Tailwind's print modifier + global CSS injection for margins */}
            <style dangerouslySetInnerHTML={{__html: `
                @media print {
                    @page { margin: 0mm; size: auto; }
                    body { background-color: white !important; -webkit-print-color-adjust: exact; color-adjust: exact; margin: 0; padding: 0; }
                }
            `}} />
        </div>
    );
}

// We intentionally skip the global AppLayout which has sidebar.
ReportsPrint.layout = (page: any) => page;

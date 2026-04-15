import { Link, usePage } from '@inertiajs/react';
import { Boxes, ClipboardList, LayoutGrid, Package, ScrollText, Users, Activity, Undo2, Printer } from 'lucide-react';
import AppLogo from '@/components/app-logo';
import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    useSidebar,
} from '@/components/ui/sidebar';
import { dashboard } from '@/routes';
import type { NavItem, SharedData } from '@/types';

const footerNavItems: NavItem[] = [
    {
        title: 'Laravel 13',
        href: 'https://laravel.com/docs/13.x',
        icon: ScrollText,
    },
    {
        title: 'Inertia React',
        href: 'https://inertiajs.com/',
        icon: ScrollText,
    },
];

export function AppSidebar() {
    const { auth } = usePage<SharedData>().props;
    const { setOpenMobile } = useSidebar();
    const role = auth.user.role;

    const mainNavItems: NavItem[] = [];

    mainNavItems.push({
        title: 'Dashboard',
        href: dashboard(),
        icon: LayoutGrid,
    });

    if (role === 'admin') {
        mainNavItems.push(
            { title: 'Data Alat', href: '/tools', icon: Package },
            { title: 'Kategori', href: '/categories', icon: Boxes },
            { title: 'Pengguna', href: '/users', icon: Users },
            { title: 'Peminjaman', href: '/loans', icon: ClipboardList },
            { title: 'Pengembalian', href: '/returns', icon: Undo2 },
            { title: 'Cetak Laporan', href: '/reports', icon: Printer },
            { title: 'Log Aktifitas', href: '/logs', icon: Activity },
        );
    } else if (role === 'petugas') {
        mainNavItems.push(
            { title: 'Persetujuan Peminjaman', href: '/loans', icon: ClipboardList },
            { title: 'Pantau Pengembalian', href: '/returns', icon: Undo2 },
            { title: 'Cetak Laporan', href: '/reports', icon: Printer },
        );
    } else if (role === 'peminjam') {
        mainNavItems.push(
            { title: 'Daftar Alat', href: '/tools/catalog', icon: Package },
            { title: 'Peminjaman Saya', href: '/loans', icon: ClipboardList },
        );
    }

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboard()} prefetch onClick={() => window.innerWidth < 768 && setOpenMobile(false)}>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}

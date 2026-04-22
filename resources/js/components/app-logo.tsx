import AppLogoIcon from '@/components/app-logo-icon';

export default function AppLogo() {
    return (
        <>
            <div className="flex aspect-square size-9 items-center justify-center overflow-hidden rounded-xl">
                <AppLogoIcon className="size-9" />
            </div>
            <div className="ml-2 grid flex-1 text-left text-sm">
                <span className="truncate leading-tight font-semibold">
                    SispemTB
                </span>
                <span className="truncate text-xs text-sidebar-foreground/70">
                    SMK Taruna Bhakti
                </span>
            </div>
        </>
    );
}

import AppLogoIcon from '@/components/app-logo-icon';

export default function AppLogo() {
    return (
        <>
            <div className="flex aspect-square size-9 items-center justify-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground shadow-sm">
                <AppLogoIcon className="size-5 text-sidebar-primary-foreground" />
            </div>
            <div className="ml-2 grid flex-1 text-left text-sm">
                <span className="truncate leading-tight font-semibold">
                    SispemLab
                </span>
                <span className="truncate text-xs text-sidebar-foreground/70">
                    Laboratorium Kampus
                </span>
            </div>
        </>
    );
}

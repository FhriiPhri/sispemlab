import type { ImgHTMLAttributes } from 'react';

export default function AppLogoIcon(props: ImgHTMLAttributes<HTMLImageElement>) {
    return (
        <img
            src="/assets/image.png"
            {...props}
            alt="Logo"
            className={`object-contain ${props.className || ''}`}
        />
    );
}

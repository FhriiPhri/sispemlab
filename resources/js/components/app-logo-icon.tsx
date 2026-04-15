import { Wrench } from 'lucide-react';
import type { SVGAttributes } from 'react';

export default function AppLogoIcon(props: SVGAttributes<SVGElement>) {
    return <Wrench {...(props as any)} />;
}

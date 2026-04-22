export type * from './auth';
export type * from './navigation';
export type * from './ui';

import { Auth } from './auth';

export interface SharedData {
    name: string;
    auth: Auth;
    sidebarOpen: boolean;
    [key: string]: unknown;
}

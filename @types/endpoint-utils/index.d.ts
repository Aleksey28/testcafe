declare module 'endpoint-utils' {
    export function getFreePort(): Promise<number>;
    export function isMyHostname(hostname: string): Promise<boolean>;
    export function getIPAddress(): string;
    export function isFreePort(hostname: number): Promise<number>;
}

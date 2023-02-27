export declare class ServerUtils {
    static checkServer(check?: boolean): Promise<boolean>;
    static stopServer(): Promise<void>;
    static startServer(): Promise<void>;
    static somethingChanged(applicationName: string): Promise<void>;
}

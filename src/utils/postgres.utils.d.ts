import { UiUtils } from './ui.utils';
export declare class PostgresUtils {
    db: any;
    pgp: any;
    private connectionString;
    connections: {
        [connectionString: string]: any;
    };
    constructor();
    setConnectionString(connectionString: string, uiUtils: UiUtils): this;
    execute(sql: string, data?: any): Promise<any>;
    executeFunction(sql: string, data?: any[]): Promise<any>;
    endConnection(): void;
    endAllConnections(): void;
}

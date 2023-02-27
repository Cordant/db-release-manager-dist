import { UiUtils } from '../../utils/ui.utils';
export declare class DatabaseChecker {
    private static _origin;
    static checkCode(params: {
        applicationName: string;
        fix?: boolean;
    }, uiUtils: UiUtils): Promise<void>;
    private static checkVersionFilesAreInVersionFolder;
    private static checkFilesMovesOverVersions;
    private static checkFilesInSchemaFolder;
    private static checkFilesInPostgresNotVersion;
    private static checkFilesInVersionNotPostgres;
    private static checkForeignKeys;
    private static checkReplicatedTableUniqueIndex;
    private static fixNotIndexOnLocalReplicatedTableIssue;
    private static fixNotFkIssue;
    private static fixForeignKeyNameIssue;
    private static checkFileName;
    private static fixFileNameIssue;
}

import { UiUtils } from "../../utils/ui.utils";
export declare class ServerlessRepositoryReader {
    private static _origin;
    private static _tempFolderPath;
    private static _serverlessDbPath;
    static readRepo(startPath: string, repoName: string, uiUtils: UiUtils): Promise<void>;
    private static _ymlToJson;
    private static _readFiles;
    static listFunctions(filter: string, uiUtils: UiUtils): Promise<void>;
    static checkPostgresCalls(params: {
        applicationName: string;
        databaseName?: string;
        filter: string;
    }, uiUtils: UiUtils): Promise<void>;
    private static formatServerlessFile;
}

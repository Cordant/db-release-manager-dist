import { UiUtils } from "../../utils/ui.utils";
export declare class DatabaseRepositoryReader {
    private static _origin;
    static readRepo(startPath: string, applicationName: string, uiUtils: UiUtils, silent?: boolean): Promise<void>;
    static initDatabase(params: {
        applicationName: string;
    }, uiUtils: UiUtils): Promise<void>;
    private static _isDatabaseNameValid;
    private static _createDBFolderStructure;
    static updateVersionFile(params: {
        applicationName: string;
        version: string;
    }, uiUtils: UiUtils): Promise<void>;
    private static _readFiles;
    private static _processVersionFile;
    private static _extractObjectInformation;
    static checkParams(params: {
        filter: string;
        environment: string;
    }, uiUtils: UiUtils): Promise<void>;
    static analyzeDataFile(params: {
        path: String;
    }, uiUtils: UiUtils): void;
}

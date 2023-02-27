import { DatabaseObject, DatabaseVersionFile, DatabaseTableForSave } from "../../models/database-file.model";
import { UiUtils } from "../../utils/ui.utils";
export declare const intentationSpaceNumber = 4;
export declare const indentationSpaces: string;
export declare const fieldSettingsRegex = "+([^(),]+\\([^,]\\)|[^(),]+)(\\([^()]+\\))?[^(),\\/*]*(\\/\\*[^\\/*]+\\*\\/)?)[,)]";
export declare class DatabaseFileHelper {
    private static _origin;
    static getVersionToChange(params: {
        version?: string;
    }, databaseVersionFiles: DatabaseVersionFile[], uiUtils: UiUtils): Promise<string>;
    static getObjectName(objectName: string | undefined, objectType: string, databaseObject: DatabaseObject, uiUtils: UiUtils): Promise<string>;
    static _getDatabaseObject(dbName: string, uiUtils: UiUtils): Promise<DatabaseObject>;
    static createFunctions(params: {
        applicationName: string;
        version?: string;
        filter?: string;
    }, uiUtils: UiUtils): Promise<boolean>;
    static updateVersionFile(filePath: string, version: string, filePaths: string[], applicationName: string, uiUtils: UiUtils): Promise<void>;
    static createTable(params: {
        applicationName: string;
        version?: string;
        tableDetails?: DatabaseTableForSave;
    }, uiUtils: UiUtils): Promise<void>;
    private static _checkNewNameHasUnderscoresAndAlphanumerics;
    private static _checkNewTableName;
    static createVersion(params: {
        applicationName: string;
        version?: string;
    }, uiUtils: UiUtils): Promise<boolean>;
    static editObject(params: {
        applicationName: string;
        objectName: string;
        objectType: string;
    }, uiUtils: UiUtils): Promise<void>;
    static renameTableField(params: {
        applicationName: string;
        objectName: string;
        fieldName: string;
        newName: string;
    }, uiUtils: UiUtils): Promise<void>;
}

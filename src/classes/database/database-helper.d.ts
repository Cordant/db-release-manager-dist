import { DatabaseVersionFile, DatabaseObject, DatabaseSubObject } from "../../models/database-file.model";
import { UiUtils } from '../../utils/ui.utils';
export declare class DatabaseHelper {
    static dbTemplatesFolder: string;
    static dbFolderStructureFolder: string;
    static tempFolderPath: string;
    static postgresDbFilesPath: string;
    static postgresDbParamsPath: string;
    static postgresDbDataPath: string;
    static releasesPath: string;
    static getApplicationDatabaseObject(applicationName: string): Promise<DatabaseObject>;
    static getDatabaseSubObject(params: {
        objectName: string;
        objectType?: string;
    }, databaseObject: DatabaseObject, origin: string, uiUtils: UiUtils): Promise<DatabaseSubObject>;
    static getApplicationDatabaseObjects(): Promise<{
        [dbName: string]: DatabaseObject;
    }>;
    static getApplicationDatabaseParameters(applicationName: string): Promise<{
        [env: string]: {
            [param: string]: string;
        };
    }>;
    static getApplicationDatabaseFiles(applicationName: string): Promise<DatabaseVersionFile[]>;
    static getApplicationDatabaseFile(applicationName: string, version: string): Promise<DatabaseVersionFile | undefined>;
    static updateApplicationDatabaseObject(applicationName: string, data: DatabaseObject): Promise<void>;
    static updateApplicationDatabaseFiles(applicationName: string, data: DatabaseVersionFile[]): Promise<void>;
    static updateApplicationDatabaseParameters(applicationName: string, data: {
        [env: string]: {
            [param: string]: string;
        };
    }): Promise<void>;
}

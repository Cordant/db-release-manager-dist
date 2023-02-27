import { Application } from '../../models/application.model';
import { DatabaseObject } from '../../models/database-file.model';
export declare class ApplicationHelper {
    static getApplications(): Promise<string[]>;
    static getApplication(name: string): Promise<Application>;
    static getDatabase(name: string): Promise<DatabaseObject>;
}

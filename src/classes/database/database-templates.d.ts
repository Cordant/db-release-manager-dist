import { UiUtils } from "../../utils/ui.utils";
export declare class DatabaseTemplates {
    private static _origin;
    /**
     * Function to copy a file to the database location
     */
    private static _templateFileToWrite;
    static addTemplate(params: {
        applicationName: string;
        version?: string;
        template?: string;
    }, uiUtils: UiUtils): Promise<boolean>;
    static setUpReplications(params: {
        applicationName: string;
        version?: string;
        tableName?: string;
        sourceDatabase?: string;
        fromOrTo: string;
    }, uiUtils: UiUtils): Promise<boolean>;
}

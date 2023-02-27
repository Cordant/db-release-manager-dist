import { UiUtils } from "../../utils/ui.utils";
export declare const fieldSettingsRegex = "+([^(),]+\\([^,]\\)|[^(),]+)(\\([^()]+\\))?[^(),\\/*]*(\\/\\*[^\\/*]+\\*\\/)?)[,)]";
export declare class DatabaseTagger {
    private static _origin;
    static addTagOnTable(params: {
        applicationName: string;
        objectName: string;
        tagName: string;
        tagValue: string;
    }, uiUtils: UiUtils): Promise<void>;
    static removeTagFromTable(params: {
        applicationName: string;
        objectName: string;
        tagName: string;
    }, uiUtils: UiUtils): Promise<void>;
    static addTagOnField(params: {
        applicationName: string;
        objectName: string;
        fieldName: string;
        tagName: string;
        tagValue: string;
    }, uiUtils: UiUtils): Promise<void>;
    static removeTagFromField(params: {
        applicationName: string;
        objectName: string;
        fieldName: string;
        tagName: string;
    }, uiUtils: UiUtils): Promise<void>;
}

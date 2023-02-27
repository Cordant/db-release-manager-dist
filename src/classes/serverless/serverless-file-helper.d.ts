import { UiUtils } from '../../utils/ui.utils';
export declare class ServerlessFileHelper {
    private static _origin;
    static serverlessTemplatesFolder: string;
    static generateFunctions(params: {
        applicationName: string;
        filter: string;
    }, uiUtils: UiUtils): Promise<boolean>;
    static ymlToJson(yml: string): any;
    static jsonToYml(json: any): string;
}

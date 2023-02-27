import { UiUtils } from '../../utils/ui.utils';
export declare class FrontendFileHelper {
    private static _origin;
    static frontendTemplatesFolder: string;
    private static _checkInstalledPackages;
    static generateCode(params: {
        applicationName: string;
        filter: string;
    }, uiUtils: UiUtils): Promise<void>;
    private static _createFrontendServiceFunction;
    private static _createModelFile;
    private static _databaseTypeToFrontendType;
}

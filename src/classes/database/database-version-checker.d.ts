import { UiUtils } from "../../utils/ui.utils";
export declare class DatabaseVersionChecker {
    private static _origin;
    static checkVersion(params: {
        applicationName: string;
        version?: string;
    }, uiUtils: UiUtils): Promise<void>;
}

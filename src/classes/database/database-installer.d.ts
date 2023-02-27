import { UiUtils } from "../../utils/ui.utils";
export declare class DatabaseInstaller {
    private static _origin;
    static installDatabase(params: {
        applicationName: string;
        environment: string;
        version: string | null;
    }, uiUtils: UiUtils): Promise<void>;
}

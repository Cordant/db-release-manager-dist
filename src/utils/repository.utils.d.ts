import { UiUtils } from "./ui.utils";
export declare type RepositoryType = 'postgres' | 'serverless' | 'frontend';
export declare class RepositoryUtils {
    private static origin;
    static checkOrGetApplicationName(params: {
        applicationName: string;
    }, type: string, uiUtils: UiUtils): Promise<void>;
    static getRepoName(uiUtils: UiUtils, startPath?: string): Promise<string>;
    static readRepository(params: {
        startPath?: string;
        type: RepositoryType;
        subRepo?: boolean;
    }, uiUtils: UiUtils): Promise<void>;
    static checkDbParams(params: {
        filter: string;
        environment: string;
    }, uiUtils: UiUtils): Promise<void>;
    static listFunctions(filter: string, uiUtils: UiUtils): Promise<void>;
}

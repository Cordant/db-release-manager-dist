import { UiUtils } from '../../utils/ui.utils';
export declare class FrontendRepositoryReader {
    private static _origin;
    static readRepo(startPath: string, repoName: string, uiUtils: UiUtils, silent?: boolean): Promise<void>;
}

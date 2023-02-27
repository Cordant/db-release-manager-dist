export interface FileAndContent {
    path: string;
    fileContent: string;
}
export declare class FileUtils {
    static getFileList(params: {
        startPath: string;
        foldersToIgnore?: string[];
        maxLevels?: number;
        currentLevel?: number;
        filter: RegExp;
    }): Promise<string[]>;
    static deleteEmptyFolders(params: {
        startPath: string;
        maxLevels?: number;
        currentLevel?: number;
    }): boolean;
    static replaceSlashes(path: string): string;
    static getFolderList(params: {
        startPath: string;
        foldersToIgnore?: string[];
    }): Promise<string[]>;
    static readFile(fileName: string): Promise<string>;
    static readFileSync(fileName: string): string;
    static writeFileSync(fileName: string, content: string): void;
    static readJsonFile(fileName: string): Promise<any>;
    static createFolderIfNotExistsSync(folderName: string): void;
    static checkIfFolderExists(folderName: string): boolean;
    static createFolderStructureIfNeeded(path: string, depth?: number): void;
    static renameFolder(from: string, to: string): Promise<void>;
    static copyFileSync(from: string, to: string): void;
    static deleteFileSync(fileName: string): void;
    /**
     * Deletes folders recursively
     * @param path folder path
     * @param sub (used for logging purpose only)
     */
    static deleteFolderRecursiveSync(path: string, sub?: boolean): void;
    static openFileInFileEditor(fileName: string): Promise<void>;
    static openFolderInExplorer(): Promise<void>;
}

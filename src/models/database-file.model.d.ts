import { UiUtils } from "../utils/ui.utils";
export declare type DatabaseFileType = 'setup' | 'table' | 'function' | 'index' | 'type' | 'data' | 'sequence' | 'trigger' | 'view' | 'foreign-servers' | 'user-mappings' | 'local-tables' | 'foreign-tables' | 'source-specific-app-setup' | 'data-transfers' | 'external-system-integrations' | 'data-exchange' | 'users-roles-permissions' | 'full-text-catalogues' | 'script' | 'unknown';
export declare class Tag {
    name: any;
    value: any;
    constructor(tag: string);
}
export interface DatabaseTableForSave {
    name: string;
    tags?: Tag[];
    fields: {
        name: string;
        type: string;
        default?: string;
        unique?: boolean;
        notNull?: boolean;
        isForeignKey?: boolean;
        isPrimaryKey?: boolean;
        foreignKey?: {
            table: String;
            key: String;
        };
        tags?: {
            [name: string]: Tag;
        };
    }[];
}
export declare class DatabaseSubObject {
    name: string;
    type: DatabaseFileType;
    latestVersion: string;
    latestFile: string;
    camelCasedName?: string;
    versions: {
        version: string;
        file: string;
    }[];
    constructor(params?: any);
    analyzeFile(uiUtils: UiUtils): Promise<void>;
}
export declare class DatabaseTableField {
    name: string;
    camelCasedName: string;
    type: string;
    notNull: boolean;
    toUpdate: boolean;
    tags: {
        [name: string]: Tag;
    };
    isForeignKey: boolean;
    foreignKey?: {
        table: string;
        key: string;
    };
    isPrimaryKey: boolean;
    retrieveInList: boolean;
    isListFilter: boolean;
    listFilterName: string;
    sort: boolean;
    default: boolean;
    unique: boolean;
    defaultValue: string;
    constructor(field: {
        fullText: string;
        split: string[];
    }, tableSuffix: string);
}
export declare class DatabaseFunction extends DatabaseSubObject {
    dbPrefix: string;
    mode: string;
    arguments: {
        mode: string;
        name: string;
        type: string;
        defaultValue: string;
    }[];
    returnType: string;
    returnTable?: {
        name: string;
        type: string;
    }[];
    hasOrReplace: boolean;
    constructor(params?: any);
    analyzeFile(uiUtils: UiUtils): Promise<void>;
}
export declare class DatabaseTable extends DatabaseSubObject {
    fields: {
        [name: string]: DatabaseTableField;
    };
    tableSuffix: string;
    dbPrefix: string;
    camelCasedName: string;
    tags: {
        [name: string]: Tag;
    };
    primaryKey?: DatabaseTableField;
    constructor(params?: any);
    analyzeFile(uiUtils: UiUtils): Promise<void>;
}
export declare class DatabaseLocalReplicatedTable extends DatabaseSubObject {
    fields: {
        [name: string]: DatabaseTableField;
    };
    tableSuffix: string;
    dbPrefix: string;
    camelCasedName: string;
    tags: {
        [name: string]: Tag;
    };
    primaryKey?: DatabaseTableField;
    constructor(params?: any);
    analyzeFile(uiUtils: UiUtils): Promise<void>;
}
export declare type DatabaseDataScriptInsertTypes = 'select' | 'values' | null;
export declare class DatabaseDataScript extends DatabaseSubObject {
    tableChanges: {
        [name: string]: {
            fields: string[];
            records: string[];
            type: DatabaseDataScriptInsertTypes;
        }[];
    };
    constructor(params?: any);
    analyzeFile(uiUtils: UiUtils): Promise<void>;
}
export declare class DatabaseObject {
    [name: string]: any;
    table: {
        [name: string]: DatabaseTable;
    };
    setup: {
        [name: string]: DatabaseSubObject;
    };
    function: {
        [name: string]: DatabaseFunction;
    };
    index: {
        [name: string]: DatabaseSubObject;
    };
    type: {
        [name: string]: DatabaseSubObject;
    };
    data: {
        [name: string]: DatabaseDataScript;
    };
    sequence: {
        [name: string]: DatabaseSubObject;
    };
    trigger: {
        [name: string]: DatabaseSubObject;
    };
    view: {
        [name: string]: DatabaseSubObject;
    };
    'foreign-servers': {
        [name: string]: DatabaseSubObject;
    };
    'user-mappings': {
        [name: string]: DatabaseSubObject;
    };
    'local-tables': {
        [name: string]: DatabaseSubObject;
    };
    'foreign-tables': {
        [name: string]: DatabaseSubObject;
    };
    'source-specific-app-setup': {
        [name: string]: DatabaseSubObject;
    };
    'data-transfers': {
        [name: string]: DatabaseSubObject;
    };
    'external-system-integrations': {
        [name: string]: DatabaseSubObject;
    };
    'data-exchange': {
        [name: string]: DatabaseSubObject;
    };
    'users-roles-permissions': {
        [name: string]: DatabaseSubObject;
    };
    'full-text-catalogues': {
        [name: string]: DatabaseSubObject;
    };
    'script': {
        [name: string]: DatabaseSubObject;
    };
    _properties: {
        dbName: string;
        hasCurrent: boolean;
        path: string;
        lastVersion: string;
    };
    _parameters: {
        [name: string]: string[];
    };
    _versions: string[];
    constructor(params?: any);
}
export declare class DatabaseFile {
    type: DatabaseFileType;
    fileName: string;
    objectName: string;
    constructor(repoName: string, fileName: string);
}
export declare class DatabaseVersion {
    userToUse: string;
    databaseToUse: string;
    dependencies?: {
        application: string;
        version: string;
    };
    fileList: string[];
    files: DatabaseFile[];
    unmappedFileList?: string[];
    unmappedFiles?: DatabaseFile[];
    constructor(params: any, fileName: string, unmappedFiles?: string[]);
}
export declare class DatabaseVersionFile {
    fileName: string;
    versionName: string;
    versions: DatabaseVersion[];
    constructor(fileName: string, params?: any, allFiles?: string[]);
}

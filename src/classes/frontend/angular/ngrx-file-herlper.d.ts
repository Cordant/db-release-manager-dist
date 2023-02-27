import { FileAndContent } from '../../../utils/file.utils';
export declare class NgrxFileHelper {
    actionsFile: FileAndContent;
    reducersFile: FileAndContent;
    effectsFile: FileAndContent;
    actions: {
        names: string;
        classes: string;
        types: string;
    }[];
    reducers: {
        stateTypes: string;
        stateInitialState: string;
        stateCase: string;
    }[];
    effects: string[];
    params: {
        frontendPath: string;
        nameWithDashes: string;
        upperCaseObjectName: string;
        capitalizedCamelCasedName: string;
        camelCasedName: string;
        nameWithoutPrefixAndSuffix: string;
    };
    constructor();
    init(params: {
        frontendPath: string;
        nameWithDashes: string;
        upperCaseObjectName: string;
        capitalizedCamelCasedName: string;
        camelCasedName: string;
        nameWithoutPrefixAndSuffix: string;
    }): Promise<void>;
    addAction(params: {
        action: string;
        upperCaseActionName: string;
        capitalizedActionName: string;
    }): void;
    getFiles(): FileAndContent[];
    static _createReducers(params: {
        action: string;
        camelCaseName: string;
        capitalizedCamelCaseName: string;
        upperCaseActionName: string;
    }): {
        stateTypes: string;
        stateInitialState: string;
        stateCase: string;
    };
    static _createEffect(params: {
        action: string;
        camelCaseName: string;
        capitalizedCamelCaseName: string;
        upperCaseActionName: string;
        nameWithDashes: string;
        route: string;
    }): string;
    static _createActions(params: {
        action: string;
        upperCaseObjectName: string;
        upperCaseActionName: string;
        capitalizedActionName: string;
        capitalizedCamelCasedName: string;
    }): {
        names: string;
        classes: string;
        types: string;
    };
}

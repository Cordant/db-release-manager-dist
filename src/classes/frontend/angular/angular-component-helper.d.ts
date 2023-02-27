import { FileAndContent } from '../../../utils/file.utils';
import { DatabaseTableField } from '../../../models/database-file.model';
export declare type ComponentTypes = 'default' | 'view' | 'list' | 'details' | 'edit';
interface AngularComponentParameters {
    type: ComponentTypes;
    path: string;
    nameWithDashes: string;
    camelCasedName: string;
    capitalizedCamelCasedName: string;
    hasList: boolean;
    hasGet: boolean;
    hasSave: boolean;
    hasDelete: boolean;
    fields: DatabaseTableField[];
}
export declare class AngularComponentHelper {
    static getComponentFiles(params: AngularComponentParameters): Promise<FileAndContent[]>;
    private static _getDefaultComponent;
    private static _geViewComponent;
    private static _getDetailsComponent;
    private static _getEditComponent;
}
export {};

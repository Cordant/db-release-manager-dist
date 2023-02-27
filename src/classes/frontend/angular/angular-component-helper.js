"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AngularComponentHelper = void 0;
const file_utils_1 = require("../../../utils/file.utils");
const frontend_file_helper_1 = require("../frontend-file-helper");
const path_1 = __importDefault(require("path"));
const syntax_utils_1 = require("../../../utils/syntax.utils");
class AngularComponentHelper {
    static getComponentFiles(params) {
        return __awaiter(this, void 0, void 0, function* () {
            switch (params.type) {
                case 'default':
                    return yield AngularComponentHelper._getDefaultComponent(params);
                case 'details':
                    return yield AngularComponentHelper._getDetailsComponent(params);
                case 'edit':
                    return yield AngularComponentHelper._getEditComponent(params);
                case 'view':
                    return yield AngularComponentHelper._geViewComponent(params);
                default:
                    break;
            }
            return [];
        });
    }
    static _getDefaultComponent(params) {
        return __awaiter(this, void 0, void 0, function* () {
            let listAction = '';
            let actionImport = '';
            if (params.hasList) {
                actionImport = `import * as ${params.capitalizedCamelCasedName}Actions from '@app/store/actions/${params.nameWithDashes}.actions';`;
                actionImport = `import {DatabasePaginationInput} from '@app/models/pagination.model';`;
                listAction = `${syntax_utils_1.indentation}onList(event: DatabasePaginationInput) {\n;`;
                listAction += `${syntax_utils_1.indentation.repeat(2)}this.store.dispatch(new AdminActions.PageGetContractPersonsAction(event));\n`;
                listAction += `${syntax_utils_1.indentation}}`;
            }
            const defaultComponentTs = yield file_utils_1.FileUtils.readFile(path_1.default.resolve(frontend_file_helper_1.FrontendFileHelper.frontendTemplatesFolder, 'angular', 'components', 'default', `default${params.hasList ? '-list' : ''}.component.ts`));
            const defaultComponentHtml = yield file_utils_1.FileUtils.readFile(path_1.default.resolve(frontend_file_helper_1.FrontendFileHelper.frontendTemplatesFolder, 'angular', 'components', 'default', `default${params.hasGet ? '-get' : ''}${params.hasList ? '-list' : ''}.component.html`));
            return [{
                    fileContent: defaultComponentTs
                        .replace(/<capitalized_camel_cased_name>/g, params.capitalizedCamelCasedName)
                        .replace(/<name_with_dashes>/g, params.nameWithDashes)
                        .replace(/<camel_cased_name>/g, params.camelCasedName)
                        .replace(/<list_action>/g, listAction)
                        .replace(/<action_import>/g, actionImport),
                    path: `${params.path}.ts`,
                }, {
                    fileContent: defaultComponentHtml
                        .replace(/<capitalized_camel_cased_name>/g, params.capitalizedCamelCasedName)
                        .replace(/<camel_cased_name>/g, params.camelCasedName)
                        .replace(/<can_save_true_false>/g, params.hasSave ? 'true' : 'false')
                        .replace(/<show_new_true_false>/g, params.hasSave ? 'true' : 'false')
                        .replace(/<title_case_name>/g, syntax_utils_1.SyntaxUtils.camelCaseToTitleCase(params.capitalizedCamelCasedName)),
                    path: `${params.path}.html`,
                }];
        });
    }
    static _geViewComponent(params) {
        return __awaiter(this, void 0, void 0, function* () {
            const viewComponentTs = yield file_utils_1.FileUtils.readFile(path_1.default.resolve(frontend_file_helper_1.FrontendFileHelper.frontendTemplatesFolder, 'angular', 'components', 'view', `view.component.ts`));
            const viewComponentHtml = yield file_utils_1.FileUtils.readFile(path_1.default.resolve(frontend_file_helper_1.FrontendFileHelper.frontendTemplatesFolder, 'angular', 'components', 'view', `view.component.html`));
            return [{
                    fileContent: viewComponentTs
                        .replace(/<capitalized_camel_cased_name>/g, params.capitalizedCamelCasedName)
                        .replace(/<name_with_dashes>/g, params.nameWithDashes)
                        .replace(/<camel_cased_name>/g, params.camelCasedName),
                    path: `${params.path}.ts`,
                }, {
                    fileContent: viewComponentHtml.replace(/<camel_cased_name>/g, params.camelCasedName),
                    path: `${params.path}.html`,
                }];
        });
    }
    static _getDetailsComponent(params) {
        return __awaiter(this, void 0, void 0, function* () {
            const detailsComponentTs = yield file_utils_1.FileUtils.readFile(path_1.default.resolve(frontend_file_helper_1.FrontendFileHelper.frontendTemplatesFolder, 'angular', 'components', 'details', `details.component.ts`));
            const detailsComponentHtml = yield file_utils_1.FileUtils.readFile(path_1.default.resolve(frontend_file_helper_1.FrontendFileHelper.frontendTemplatesFolder, 'angular', 'components', 'details', `details.component.html`));
            const detailsFields = params.fields
                .filter(field => !field.tags['not-for-details'] &&
                (['modifiedAt', 'modifiedBy', 'createdAt', 'createdBy'].indexOf(field.camelCasedName) === -1 || field.tags['for-details']))
                .map(field => {
                let toReturn = `${syntax_utils_1.indentation.repeat(4)}{\n`;
                toReturn += `${syntax_utils_1.indentation.repeat(5)}name: '${syntax_utils_1.SyntaxUtils.camelCaseToTitleCase(field.camelCasedName)}',\n`;
                toReturn += `${syntax_utils_1.indentation.repeat(5)}key: '${field.camelCasedName}',\n`;
                switch (field.type.toLowerCase()) {
                    case 'boolean':
                        toReturn += `${syntax_utils_1.indentation.repeat(5)}booleanFalseValue: 'False',\n`;
                        toReturn += `${syntax_utils_1.indentation.repeat(5)}booleanTrueValue: 'False',\n`;
                        toReturn += `${syntax_utils_1.indentation.repeat(5)}type: 'boolean',\n`;
                        break;
                    case 'date':
                        toReturn += `${syntax_utils_1.indentation.repeat(5)}type: 'date',\n`;
                        break;
                    default:
                        break;
                }
                toReturn += `${syntax_utils_1.indentation.repeat(4)}}`;
                return toReturn;
            }).join(',\n');
            return [{
                    fileContent: detailsComponentTs
                        .replace(/<capitalized_camel_cased_name>/g, params.capitalizedCamelCasedName)
                        .replace(/<name_with_dashes>/g, params.nameWithDashes)
                        .replace(/<camel_cased_name>/g, params.camelCasedName)
                        .replace(/<fields_details>/g, detailsFields),
                    path: `${params.path}.ts`,
                }, {
                    fileContent: detailsComponentHtml.replace(/<camel_cased_name>/g, params.camelCasedName),
                    path: `${params.path}.html`,
                }];
        });
    }
    static _getEditComponent(params) {
        return __awaiter(this, void 0, void 0, function* () {
            const editComponentTs = yield file_utils_1.FileUtils.readFile(path_1.default.resolve(frontend_file_helper_1.FrontendFileHelper.frontendTemplatesFolder, 'angular', 'components', 'edit', `edit.component.ts`));
            const editComponentHtml = yield file_utils_1.FileUtils.readFile(path_1.default.resolve(frontend_file_helper_1.FrontendFileHelper.frontendTemplatesFolder, 'angular', 'components', 'edit', `edit.component.html`));
            const editFormFields = params.fields
                .filter(field => (field.toUpdate ||
                field.camelCasedName === 'id') &&
                ['modifiedAt', 'modifiedBy', 'createdAt', 'createdBy'].indexOf(field.camelCasedName) === -1)
                .map(field => {
                if (field.camelCasedName === 'id') {
                    return `${syntax_utils_1.indentation.repeat(3)}id: new FormControl(this.${params.camelCasedName}.id)`;
                }
                else {
                    let toReturn = `${syntax_utils_1.indentation.repeat(3)}${field.camelCasedName}: new FormControl(this.${params.camelCasedName}.${field.camelCasedName}`;
                    if (field.notNull) {
                        toReturn += ', Validators.required';
                    }
                    toReturn += ')';
                    return toReturn;
                }
            }).join(',\n');
            const htmlFormFields = params.fields
                .filter(field => (field.toUpdate ||
                field.camelCasedName === 'id') &&
                ['modifiedAt', 'modifiedBy', 'createdAt', 'createdBy'].indexOf(field.camelCasedName) === -1)
                .map(field => {
                if (field.camelCasedName === 'id') {
                    return `${syntax_utils_1.indentation}<input type="hidden" formControlName="id">`;
                }
                else {
                    return `${syntax_utils_1.indentation}<mat-form-field>\n` +
                        `${syntax_utils_1.indentation.repeat(2)}<input matInput placeholder="${syntax_utils_1.SyntaxUtils.camelCaseToTitleCase(field.camelCasedName)}" formControlName="${field.camelCasedName}">\n` +
                        `${syntax_utils_1.indentation}</mat-form-field>\n`;
                }
            }).join('\n<br>\n');
            return [{
                    fileContent: editComponentTs
                        .replace(/<capitalized_camel_cased_name>/g, params.capitalizedCamelCasedName)
                        .replace(/<name_with_dashes>/g, params.nameWithDashes)
                        .replace(/<camel_cased_name>/g, params.camelCasedName)
                        .replace(/<form_controls>/g, editFormFields),
                    path: `${params.path}.ts`,
                }, {
                    fileContent: editComponentHtml
                        .replace(/<capitalized_camel_cased_name>/g, params.capitalizedCamelCasedName)
                        .replace(/<camel_cased_name>/g, params.camelCasedName)
                        .replace(/<html_form_fields>/g, htmlFormFields),
                    path: `${params.path}.html`,
                }];
        });
    }
}
exports.AngularComponentHelper = AngularComponentHelper;

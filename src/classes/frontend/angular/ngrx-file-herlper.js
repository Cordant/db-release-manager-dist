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
exports.NgrxFileHelper = void 0;
const syntax_utils_1 = require("../../../utils/syntax.utils");
const file_utils_1 = require("../../../utils/file.utils");
const path_1 = __importDefault(require("path"));
const frontend_file_helper_1 = require("../frontend-file-helper");
const ngrxParts = [{
        source: 'page',
        state: '',
        for: {
            get: true,
            list: true,
            save: true,
            delete: true,
        }
    }, {
        source: 'effect',
        state: '',
        for: {
            get: true,
            list: true,
            save: false,
            delete: false,
        }
    }, {
        source: 'router',
        state: '',
        for: {
            get: true,
            list: true,
            save: false,
            delete: false,
        }
    }, {
        source: 'service',
        state: 'complete',
        for: {
            get: true,
            list: true,
            save: true,
            delete: true,
        }
    }, {
        source: 'service',
        state: 'failed',
        for: {
            get: true,
            list: true,
            save: true,
            delete: true,
        }
    }];
class NgrxFileHelper {
    constructor() {
        this.actionsFile = {
            path: '',
            fileContent: ''
        };
        this.reducersFile = {
            path: '',
            fileContent: ''
        };
        this.effectsFile = {
            path: '',
            fileContent: ''
        };
        this.actions = [];
        this.reducers = [];
        this.effects = [];
        this.params = {
            frontendPath: '',
            nameWithDashes: '',
            upperCaseObjectName: '',
            capitalizedCamelCasedName: '',
            camelCasedName: '',
            nameWithoutPrefixAndSuffix: '',
        };
    }
    init(params) {
        return __awaiter(this, void 0, void 0, function* () {
            this.params = params;
            const ngrxActionsFileTemplate = yield file_utils_1.FileUtils.readFile(path_1.default.resolve(frontend_file_helper_1.FrontendFileHelper.frontendTemplatesFolder, 'angular', 'ngrx', 'ngrx-actions.ts'));
            const ngrxReducersFileTemplate = yield file_utils_1.FileUtils.readFile(path_1.default.resolve(frontend_file_helper_1.FrontendFileHelper.frontendTemplatesFolder, 'angular', 'ngrx', 'ngrx-reducers.ts'));
            const ngrxEffectsFileTemplate = yield file_utils_1.FileUtils.readFile(path_1.default.resolve(frontend_file_helper_1.FrontendFileHelper.frontendTemplatesFolder, 'angular', 'ngrx', 'ngrx-effects.ts'));
            this.actionsFile = {
                path: path_1.default.resolve(params.frontendPath, 'src', 'app', 'store', 'actions', `${params.nameWithDashes}.actions.ts`),
                fileContent: ngrxActionsFileTemplate
            };
            this.reducersFile = {
                path: path_1.default.resolve(params.frontendPath, 'src', 'app', 'store', 'reducers', `${params.nameWithDashes}.reducers.ts`),
                fileContent: ngrxReducersFileTemplate
            };
            this.effectsFile = {
                path: path_1.default.resolve(params.frontendPath, 'src', 'app', 'store', 'effects', `${params.nameWithDashes}.effects.ts`),
                fileContent: ngrxEffectsFileTemplate
            };
            this.actions = [];
            this.reducers = [];
            this.effects = [];
        });
    }
    addAction(params) {
        this.actions.push(NgrxFileHelper._createActions({
            action: params.action,
            upperCaseObjectName: this.params.upperCaseObjectName,
            upperCaseActionName: params.upperCaseActionName,
            capitalizedActionName: params.capitalizedActionName,
            capitalizedCamelCasedName: this.params.capitalizedCamelCasedName,
        }));
        this.reducers.push(NgrxFileHelper._createReducers({
            action: params.action,
            camelCaseName: this.params.camelCasedName,
            capitalizedCamelCaseName: this.params.capitalizedCamelCasedName,
            upperCaseActionName: params.upperCaseActionName,
        }));
        this.effects.push(NgrxFileHelper._createEffect({
            action: params.action,
            camelCaseName: this.params.camelCasedName,
            capitalizedCamelCaseName: this.params.capitalizedCamelCasedName,
            upperCaseActionName: params.upperCaseActionName,
            nameWithDashes: this.params.nameWithDashes,
            route: ''
        }));
    }
    getFiles() {
        const toReturn = [];
        if (this.actions.length) {
            this.actionsFile.fileContent = this.actionsFile.fileContent
                .replace(/<snake_case_actions_upper_case>/g, this.params.nameWithoutPrefixAndSuffix.toUpperCase())
                .replace(/<snake_case_actions_lower_case>/g, this.params.nameWithoutPrefixAndSuffix.toLowerCase())
                .replace(/<capitalized_camel_cased_name>/g, this.params.capitalizedCamelCasedName)
                .replace(/<action_names>/, this.actions.map(x => x.names).join('\n\n'))
                .replace(/<action_classes>/, this.actions.map(x => x.classes).join('\n\n'))
                .replace(/<action_types>/, this.actions.map(x => x.types).join('\n\n'));
            toReturn.push(this.actionsFile);
        }
        if (this.reducers.length) {
            this.reducersFile.fileContent = this.reducersFile.fileContent
                .replace(/<capitalized_camel_cased_name>/g, this.params.capitalizedCamelCasedName)
                .replace(/<name_with_dashes>/g, this.params.nameWithDashes)
                .replace(/<camel_cased_name>/g, this.params.camelCasedName)
                .replace(/<types>/, this.reducers.map(x => x.stateTypes).filter(Boolean).join('\n'))
                .replace(/<initial_state>/, this.reducers.map(x => x.stateInitialState).filter(Boolean).join('\n'))
                .replace(/<cases>/, this.reducers.map(x => x.stateCase).filter(Boolean).join('\n'));
            toReturn.push(this.reducersFile);
        }
        if (this.effects.length) {
            this.effectsFile.fileContent = this.effectsFile.fileContent
                .replace(/<name_with_dashes>/g, this.params.nameWithDashes)
                .replace(/<camel_cased_name>/g, this.params.camelCasedName)
                .replace(/<capitalized_camel_cased_name>/g, this.params.capitalizedCamelCasedName)
                .replace(/<effects>/, this.effects.join('\n'));
            toReturn.push(this.effectsFile);
        }
        return toReturn;
    }
    static _createReducers(params) {
        let types = [];
        let initialState = [];
        let cases = [];
        let actionBooleanPrefix = '';
        let actionvariablesSuffix = '';
        switch (params.action) {
            case 'get':
                actionBooleanPrefix = 'getting';
                break;
            case 'list':
                actionBooleanPrefix = 'getting';
                actionvariablesSuffix = 'List';
                break;
            case 'delete':
                actionBooleanPrefix = 'deleting';
                break;
            case 'save':
                actionBooleanPrefix = 'saving';
                break;
            default:
                break;
        }
        types = [
            `${syntax_utils_1.indentation}${actionBooleanPrefix}${params.capitalizedCamelCaseName}${actionvariablesSuffix}: boolean;`,
        ];
        initialState = [
            `${syntax_utils_1.indentation}${actionBooleanPrefix}${params.capitalizedCamelCaseName}${actionvariablesSuffix}: true,`,
        ];
        if (params.action === 'get' || params.action === 'list') {
            types.push(`${syntax_utils_1.indentation}${params.camelCaseName}${actionvariablesSuffix}: ${params.capitalizedCamelCaseName}${params.action === 'list' ? '[]' : ''};`);
            initialState.push(`${syntax_utils_1.indentation}${params.camelCaseName}${actionvariablesSuffix}: null,`);
        }
        cases = ngrxParts
            .filter(x => x.for[params.action])
            .map(part => {
            let actionLine = `${syntax_utils_1.indentation.repeat(2)}case ${params.capitalizedCamelCaseName}Actions.${part.source.toUpperCase()}_${params.upperCaseActionName}${part.state ? `_${part.state.toUpperCase()}` : ``}:\n`;
            let toReturn = `${syntax_utils_1.indentation.repeat(3)}return {\n`;
            toReturn += `${syntax_utils_1.indentation.repeat(4)}...state,\n`;
            if (part.source !== 'service') {
                toReturn += `${syntax_utils_1.indentation.repeat(4)}${actionBooleanPrefix}${params.capitalizedCamelCaseName}${actionvariablesSuffix}: true,\n`;
            }
            else {
                toReturn += `${syntax_utils_1.indentation.repeat(4)}${actionBooleanPrefix}${params.capitalizedCamelCaseName}${actionvariablesSuffix}: false,\n`;
                if (part.state !== 'failed' && (params.action === 'get' || params.action === 'list')) {
                    toReturn += `${syntax_utils_1.indentation.repeat(4)}${params.camelCaseName}${actionvariablesSuffix}: action.payload,\n`;
                }
            }
            toReturn += `${syntax_utils_1.indentation.repeat(3)}};`;
            return { actionLine, actionText: toReturn };
        })
            .reduce((agg, current) => {
            // we add the similar actions to the same case
            if (agg.length > 0 && current.actionText === agg[agg.length - 1].actionText) {
                agg[agg.length - 1].actionLine += current.actionLine;
            }
            else {
                agg.push(current);
            }
            return agg;
        }, []).map(({ actionLine, actionText }) => actionLine + actionText);
        return {
            stateTypes: types.length > 0 ? types.join('\n') : '',
            stateInitialState: initialState.length > 0 ? initialState.join('\n') : '',
            stateCase: cases.length > 0 ? cases.join('\n') : ''
        };
    }
    static _createEffect(params) {
        let effectToReturn = '';
        switch (params.action) {
            case 'get':
                // listen to the router
                effectToReturn += `${syntax_utils_1.indentation}@Effect()\n`;
                effectToReturn += `${syntax_utils_1.indentation}navigateTo${params.capitalizedCamelCaseName}: Observable<Action> = RouterUtilsService.handleNavigationWithParams(\n`;
                effectToReturn += `${syntax_utils_1.indentation.repeat(2)}['${params.route ? params.route + '/' : ''}${params.nameWithDashes}/:id'], this.actions$).pipe(\n`;
                effectToReturn += `${syntax_utils_1.indentation.repeat(3)}map((result: RouteNavigationParams) => {\n`;
                effectToReturn += `${syntax_utils_1.indentation.repeat(4)}return {\n`;
                effectToReturn += `${syntax_utils_1.indentation.repeat(5)}type: ${params.capitalizedCamelCaseName}Actions.ROUTER_${params.upperCaseActionName},\n`;
                effectToReturn += `${syntax_utils_1.indentation.repeat(5)}payload: +result.params.id\n`;
                effectToReturn += `${syntax_utils_1.indentation.repeat(4)}};\n`;
                effectToReturn += `${syntax_utils_1.indentation.repeat(3)}})\n`;
                effectToReturn += `${syntax_utils_1.indentation.repeat(2)});\n`;
                // listen to the actions
                effectToReturn += `${syntax_utils_1.indentation}@Effect()\n`;
                effectToReturn += `${syntax_utils_1.indentation}${params.action}${params.capitalizedCamelCaseName}: Observable<Action> = NgrxUtilsService.actionToServiceToAction({\n`;
                effectToReturn += `${syntax_utils_1.indentation.repeat(2)}actionsObs: this.actions$,\n`;
                effectToReturn += `${syntax_utils_1.indentation.repeat(2)}actionsToListenTo: [\n`;
                effectToReturn += `${syntax_utils_1.indentation.repeat(3)}${params.capitalizedCamelCaseName}Actions.ROUTER_${params.upperCaseActionName},\n`;
                effectToReturn += `${syntax_utils_1.indentation.repeat(3)}${params.capitalizedCamelCaseName}Actions.EFFECT_${params.upperCaseActionName},\n`;
                effectToReturn += `${syntax_utils_1.indentation.repeat(2)}],\n`;
                effectToReturn += `${syntax_utils_1.indentation.repeat(2)}serviceMethod: this.${params.camelCaseName}Service.${params.action}${params.capitalizedCamelCaseName}.bind(this.${params.camelCaseName}Service),\n`;
                effectToReturn += `${syntax_utils_1.indentation}});\n`;
                break;
            case 'list':
                // listen to the router
                effectToReturn += `${syntax_utils_1.indentation}@Effect()\n`;
                effectToReturn += `${syntax_utils_1.indentation}navigateTo${params.capitalizedCamelCaseName}List: Observable<Action> = RouterUtilsService.handleNavigationWithParams(\n`;
                effectToReturn += `${syntax_utils_1.indentation.repeat(2)}['${params.route ? params.route + '/' : ''}${params.nameWithDashes}'], this.actions$).pipe(\n`;
                effectToReturn += `${syntax_utils_1.indentation.repeat(3)}map(() => {\n`;
                effectToReturn += `${syntax_utils_1.indentation.repeat(4)}return {\n`;
                effectToReturn += `${syntax_utils_1.indentation.repeat(5)}type: ${params.capitalizedCamelCaseName}Actions.ROUTER_${params.upperCaseActionName},\n`;
                effectToReturn += `${syntax_utils_1.indentation.repeat(4)}};\n`;
                effectToReturn += `${syntax_utils_1.indentation.repeat(3)}})\n`;
                effectToReturn += `${syntax_utils_1.indentation.repeat(2)});\n`;
                // listen to the actions
                effectToReturn += `${syntax_utils_1.indentation}@Effect()\n`;
                effectToReturn += `${syntax_utils_1.indentation}${params.action}${params.capitalizedCamelCaseName}: Observable<Action> = NgrxUtilsService.actionToServiceToAction({\n`;
                effectToReturn += `${syntax_utils_1.indentation.repeat(2)}actionsObs: this.actions$,\n`;
                effectToReturn += `${syntax_utils_1.indentation.repeat(2)}actionsToListenTo: [\n`;
                effectToReturn += `${syntax_utils_1.indentation.repeat(3)}${params.capitalizedCamelCaseName}Actions.PAGE_${params.upperCaseActionName},\n`;
                effectToReturn += `${syntax_utils_1.indentation.repeat(3)}${params.capitalizedCamelCaseName}Actions.ROUTER_${params.upperCaseActionName},\n`;
                effectToReturn += `${syntax_utils_1.indentation.repeat(3)}${params.capitalizedCamelCaseName}Actions.EFFECT_${params.upperCaseActionName},\n`;
                effectToReturn += `${syntax_utils_1.indentation.repeat(2)}],\n`;
                effectToReturn += `${syntax_utils_1.indentation.repeat(2)}serviceMethod: this.${params.camelCaseName}Service.${params.action}${params.capitalizedCamelCaseName}.bind(this.${params.camelCaseName}Service),\n`;
                effectToReturn += `${syntax_utils_1.indentation}});\n`;
                break;
            case 'delete':
                // listen to the actions
                effectToReturn += `${syntax_utils_1.indentation}@Effect()\n`;
                effectToReturn += `${syntax_utils_1.indentation}${params.action}${params.capitalizedCamelCaseName}: Observable<Action> = NgrxUtilsService.actionToServiceToAction({\n`;
                effectToReturn += `${syntax_utils_1.indentation.repeat(2)}actionsObs: this.actions$,\n`;
                effectToReturn += `${syntax_utils_1.indentation.repeat(2)}store: this.store.pipe(select('${params.camelCaseName}Store')),\n`;
                effectToReturn += `${syntax_utils_1.indentation.repeat(2)}actionsToListenTo: [\n`;
                effectToReturn += `${syntax_utils_1.indentation.repeat(3)}${params.capitalizedCamelCaseName}Actions.PAGE_${params.upperCaseActionName},\n`;
                effectToReturn += `${syntax_utils_1.indentation.repeat(2)}],\n`;
                effectToReturn += `${syntax_utils_1.indentation.repeat(2)}serviceMethod: this.${params.camelCaseName}Service.${params.action}${params.capitalizedCamelCaseName}.bind(this.${params.camelCaseName}Service),\n`;
                effectToReturn += `${syntax_utils_1.indentation.repeat(2)}outputTransform: (id: number) =>\n`;
                effectToReturn += `${syntax_utils_1.indentation.repeat(3)}this.router.navigate(['/${params.route ? params.route + '/' : ''}${params.nameWithDashes}'])\n`;
                effectToReturn += `${syntax_utils_1.indentation}});\n`;
                // reload and navigate back
                break;
            case 'save':
                // listen to the actions
                effectToReturn += `${syntax_utils_1.indentation}@Effect()\n`;
                effectToReturn += `${syntax_utils_1.indentation}${params.action}${params.capitalizedCamelCaseName}: Observable<Action> = NgrxUtilsService.actionToServiceToAction({\n`;
                effectToReturn += `${syntax_utils_1.indentation.repeat(2)}actionsObs: this.actions$,\n`;
                effectToReturn += `${syntax_utils_1.indentation.repeat(2)}actionsToListenTo: [\n`;
                effectToReturn += `${syntax_utils_1.indentation.repeat(3)}${params.capitalizedCamelCaseName}Actions.PAGE_${params.upperCaseActionName},\n`;
                effectToReturn += `${syntax_utils_1.indentation.repeat(2)}],\n`;
                effectToReturn += `${syntax_utils_1.indentation.repeat(2)}serviceMethod: this.${params.camelCaseName}Service.${params.action}${params.capitalizedCamelCaseName}.bind(this.${params.camelCaseName}Service),\n`;
                effectToReturn += `${syntax_utils_1.indentation.repeat(2)}outputTransform: (id: number) =>\n`;
                effectToReturn += `${syntax_utils_1.indentation.repeat(3)}this.router.navigate(['/${params.route ? params.route + '/' : ''}${params.nameWithDashes}', id])\n`;
                effectToReturn += `${syntax_utils_1.indentation}});\n`;
                break;
            default:
                break;
        }
        return effectToReturn;
    }
    static _createActions(params) {
        let functionParameterType = '';
        // todo get the proper types
        switch (params.action) {
            case 'get':
                functionParameterType = 'any';
                break;
            case 'delete':
                functionParameterType = 'any';
                break;
            case 'list':
                functionParameterType = 'any';
                break;
            case 'save':
                functionParameterType = `any`;
                break;
            default:
                break;
        }
        return {
            names: ngrxParts
                .filter(x => x.for[params.action])
                .map(part => {
                let toReturn = `export const ${part.source.toUpperCase()}_${params.upperCaseActionName}${part.state ? `_${part.state.toUpperCase()}` : ``}`;
                toReturn += ` = \`[\$\{${params.upperCaseObjectName}\} ${syntax_utils_1.SyntaxUtils.capitalize(part.source)}] ${params.action} ${params.upperCaseObjectName.toLocaleLowerCase().replace(/ /g, ' ')}\`;`;
                return toReturn;
            }).join('\n'),
            classes: ngrxParts
                .filter(x => x.for[params.action])
                .map(part => {
                let toReturn = `export class ${syntax_utils_1.SyntaxUtils.capitalize(part.source)}${params.capitalizedActionName}${syntax_utils_1.SyntaxUtils.capitalize(part.state)}Action implements Action {\n`;
                toReturn += `${syntax_utils_1.indentation}readonly type = ${part.source.toUpperCase()}_${params.upperCaseActionName}${part.state ? `_${part.state.toUpperCase()}` : ``};\n`;
                toReturn += `${syntax_utils_1.indentation}constructor(public payload?: ${functionParameterType}) {}\n`;
                toReturn += '}';
                return toReturn;
            }).join('\n'),
            types: ngrxParts
                .filter(x => x.for[params.action])
                .map(part => {
                return `${syntax_utils_1.indentation}| ${syntax_utils_1.SyntaxUtils.capitalize(part.source)}${params.capitalizedActionName}${syntax_utils_1.SyntaxUtils.capitalize(part.state)}Action`;
            }).join('\n'),
        };
    }
}
exports.NgrxFileHelper = NgrxFileHelper;

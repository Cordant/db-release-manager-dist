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
exports.FrontendFileHelper = void 0;
const path_1 = __importDefault(require("path"));
const database_helper_1 = require("../database/database-helper");
const file_utils_1 = require("../../utils/file.utils");
const syntax_utils_1 = require("../../utils/syntax.utils");
const ngrx_file_herlper_1 = require("./angular/ngrx-file-herlper");
const repository_utils_1 = require("../../utils/repository.utils");
const angular_component_helper_1 = require("./angular/angular-component-helper");
const child_process_1 = require("child_process");
const indentation = '  ';
const packagesToInstall = [
    '@ngrx/effects',
    '@ngrx/router-store',
    '@ngrx/store',
    '@ngrx/store-devtools',
    '@sweetalert2/ngx-sweetalert2',
    'angular-split',
    'core-js',
    'hammerjs',
    'ngx-analytics',
    'ngx-cookie-service',
    'rxjs',
    'sweetalert2',
    '@angular/router',
    '@angular/animations',
    '@angular/cdk',
];
class FrontendFileHelper {
    static _checkInstalledPackages(frontendPath, uiUtils) {
        return __awaiter(this, void 0, void 0, function* () {
            const packagePointJson = yield file_utils_1.FileUtils.readJsonFile(path_1.default.resolve(frontendPath, 'package.json'));
            const missingDependencies = [];
            for (let i = 0; i < packagesToInstall.length; i++) {
                const pkg = packagesToInstall[i];
                if (!packagePointJson.dependencies[pkg]) {
                    missingDependencies.push(pkg);
                }
            }
            if (missingDependencies.length > 0) {
                const response = yield uiUtils.question({
                    origin: this._origin,
                    text: `The following packages are missing : ${missingDependencies.join(', ')}. Please enter "y" to install them.`
                });
                if (response !== 'y') {
                    uiUtils.warning({ origin: this._origin, message: 'The dependencies won\'t be installed, the application is not expected to be working correctly' });
                }
                else {
                    // install missing packages
                    const args = [
                        '/c',
                        'npm',
                        'install',
                        ...missingDependencies
                    ];
                    const child = (0, child_process_1.spawn)('cmd', args, {
                        detached: true,
                        stdio: 'ignore',
                        cwd: frontendPath
                    });
                    child.unref();
                    uiUtils.info({ origin: this._origin, message: 'installing dependencies in a separate process' });
                }
            }
        });
    }
    static generateCode(params, uiUtils) {
        return __awaiter(this, void 0, void 0, function* () {
            yield repository_utils_1.RepositoryUtils.checkOrGetApplicationName(params, 'frontend', uiUtils);
            const applicationDatabaseName = params.applicationName.replace(/\-frontend$/, '-database');
            // read the db File, to get the list of functions
            const databaseObject = yield database_helper_1.DatabaseHelper.getApplicationDatabaseObject(applicationDatabaseName);
            if (!databaseObject) {
                throw 'This application does not exist';
            }
            // check package.json
            const frontendPath = path_1.default.resolve(databaseObject._properties.path.replace('database', 'frontend'), 'frontend');
            yield FrontendFileHelper._checkInstalledPackages(frontendPath, uiUtils);
            const filesToCreate = [];
            const modulesToAdd = [];
            const actions = [
                'get',
                'list',
                'delete',
                'save',
            ];
            let filesCreated = 0;
            let filesIgnored = 0;
            let filesOverwritten = 0;
            const tables = Object.keys(databaseObject.table);
            const defaultFilesPath = path_1.default.resolve(FrontendFileHelper.frontendTemplatesFolder, '..', 'default-files').replace(/\\/g, '/');
            const defaultFiles = yield file_utils_1.FileUtils.getFileList({
                startPath: defaultFilesPath,
                filter: /\.ts$|\.html$|\.scss$/,
                maxLevels: 10
            });
            for (let i = 0; i < defaultFiles.length; i++) {
                const fileContent = yield file_utils_1.FileUtils.readFile(defaultFiles[i]);
                filesToCreate.push({
                    fileContent: fileContent,
                    path: path_1.default.resolve(frontendPath, 'src', 'app', defaultFiles[i].replace(defaultFilesPath + '/', ''))
                });
            }
            const serviceFileTemplate = yield file_utils_1.FileUtils.readFile(path_1.default.resolve(FrontendFileHelper.frontendTemplatesFolder, 'angular', 'service.ts'));
            const modelFileTemplate = yield file_utils_1.FileUtils.readFile(path_1.default.resolve(FrontendFileHelper.frontendTemplatesFolder, 'angular', 'model.ts'));
            const moduleFileTemplate = yield file_utils_1.FileUtils.readFile(path_1.default.resolve(FrontendFileHelper.frontendTemplatesFolder, 'angular', 'module.ts'));
            const routingFileTemplate = yield file_utils_1.FileUtils.readFile(path_1.default.resolve(FrontendFileHelper.frontendTemplatesFolder, 'angular', 'routing.ts'));
            const materialFileTemplate = yield file_utils_1.FileUtils.readFile(path_1.default.resolve(FrontendFileHelper.frontendTemplatesFolder, 'angular', 'material.module.ts'));
            const appRoutingFileTemplate = yield file_utils_1.FileUtils.readFile(path_1.default.resolve(FrontendFileHelper.frontendTemplatesFolder, 'angular', 'app.routing.ts'));
            const ngrxFileHelper = new ngrx_file_herlper_1.NgrxFileHelper();
            uiUtils.startProgress({ length: tables.length * 4, start: 0, title: 'Functions' });
            for (let t = 0; t < tables.length; t++) {
                const tableName = tables[t];
                const nameWithoutPrefixAndSuffix = tableName
                    .replace(new RegExp(`\_${databaseObject.table[tableName].tableSuffix}$`), '')
                    .replace(new RegExp(`^${databaseObject._properties.dbName}t\_`), '');
                const nameWithDashes = nameWithoutPrefixAndSuffix.replace(/_/g, '-');
                const nameWithoutUnderscore = nameWithoutPrefixAndSuffix.replace(/_/g, '');
                const camelCasedName = databaseObject.table[tableName].camelCasedName;
                const upperCaseObjectName = nameWithoutPrefixAndSuffix.toUpperCase();
                const capitalizedCamelCasedName = camelCasedName.substr(0, 1).toUpperCase() +
                    camelCasedName.substr(1);
                // model
                yield ngrxFileHelper.init({
                    frontendPath: frontendPath,
                    nameWithDashes: nameWithDashes,
                    upperCaseObjectName: upperCaseObjectName,
                    capitalizedCamelCasedName: capitalizedCamelCasedName,
                    camelCasedName: camelCasedName,
                    nameWithoutPrefixAndSuffix: nameWithoutPrefixAndSuffix
                });
                filesToCreate.push({
                    path: path_1.default.resolve(frontendPath, 'src', 'app', 'models', `${nameWithDashes}.model.ts`),
                    fileContent: modelFileTemplate
                        .replace(/<capitalized_camel_cased_name>/g, capitalizedCamelCasedName)
                        .replace(/<fields>/g, FrontendFileHelper._createModelFile(Object.keys(databaseObject.table[tableName].fields).map(key => databaseObject.table[tableName].fields[key]), uiUtils))
                });
                // service
                const serviceFile = {
                    path: path_1.default.resolve(frontendPath, 'src', 'app', 'services', `${nameWithDashes}.service.ts`),
                    fileContent: serviceFileTemplate
                        .replace(/<camel_cased_name>/g, camelCasedName)
                        .replace(/<capitalized_camel_cased_name>/g, capitalizedCamelCasedName)
                        .replace(/<name_with_dashes>/g, nameWithDashes)
                };
                const serviceFunctions = [];
                let components = [];
                const hasAction = {
                    hasList: false,
                    hasGet: false,
                    hasSave: false,
                    hasDelete: false,
                };
                if (!databaseObject.table[tableName].tags.ignore) {
                    // create service file
                    for (let i = 0; i < actions.length; i++) {
                        const action = actions[i];
                        if (!databaseObject.table[tableName].tags[`no-${action}`]) {
                            switch (action) {
                                case 'list':
                                    hasAction.hasList = true;
                                    break;
                                case 'get':
                                    hasAction.hasGet = true;
                                    break;
                                case 'delete':
                                    hasAction.hasDelete = true;
                                    break;
                                case 'save':
                                    hasAction.hasSave = true;
                                    break;
                            }
                        }
                        uiUtils.progress(4 * t + i + 1);
                        const upperCaseActionName = `${action.toUpperCase()}_${upperCaseObjectName}`;
                        const capitalizedActionName = `${syntax_utils_1.SyntaxUtils.capitalize(action)}${syntax_utils_1.SyntaxUtils.capitalize(syntax_utils_1.SyntaxUtils.snakeCaseToCamelCase(nameWithoutPrefixAndSuffix))}`;
                        const functionName = action + nameWithoutUnderscore;
                        serviceFunctions.push(FrontendFileHelper._createFrontendServiceFunction({
                            action: action,
                            capitalizedCamelCasedName: capitalizedCamelCasedName,
                            serviceFunctionName: functionName,
                            serviceName: databaseObject._properties.dbName + '-s'
                        }));
                        ngrxFileHelper.addAction({
                            action: action,
                            upperCaseActionName: upperCaseActionName,
                            capitalizedActionName: capitalizedActionName,
                        });
                    }
                    components = [{
                            name: `${capitalizedCamelCasedName}Component`,
                            path: `${nameWithDashes}.component`,
                            type: 'default'
                        }, {
                            name: `${capitalizedCamelCasedName}ViewComponent`,
                            path: `${nameWithDashes}-view/${nameWithDashes}-view.component`,
                            type: 'view'
                        },
                        {
                            name: `${capitalizedCamelCasedName}DetailsComponent`,
                            path: `${nameWithDashes}-details/${nameWithDashes}-details.component`,
                            type: 'details'
                        }, {
                            name: `${capitalizedCamelCasedName}EditComponent`,
                            path: `${nameWithDashes}-edit/${nameWithDashes}-edit.component`,
                            type: 'edit'
                        }];
                }
                if (serviceFunctions.length) {
                    serviceFile.fileContent = serviceFile.fileContent.replace(/<functions>/, serviceFunctions.join('\n\n'));
                    filesToCreate.push(serviceFile);
                }
                const ngrxFiles = ngrxFileHelper.getFiles();
                for (let i = 0; i < ngrxFiles.length; i++) {
                    filesToCreate.push(ngrxFiles[i]);
                }
                for (let i = 0; i < components.length; i++) {
                    const component = components[i];
                    const componentFiles = yield angular_component_helper_1.AngularComponentHelper.getComponentFiles(Object.assign(Object.assign({}, hasAction), { type: component.type, path: component.path, nameWithDashes: nameWithDashes, camelCasedName: camelCasedName, capitalizedCamelCasedName: capitalizedCamelCasedName, fields: Object.keys(databaseObject.table[tableName].fields).map(key => databaseObject.table[tableName].fields[key]) }));
                    for (let j = 0; j < componentFiles.length; j++) {
                        const componentFile = componentFiles[j];
                        filesToCreate.push({
                            fileContent: componentFile.fileContent,
                            path: path_1.default.resolve(frontendPath, 'src', 'app', 'modules', nameWithDashes, componentFile.path)
                        });
                    }
                }
                // module
                const moduleFile = {
                    path: path_1.default.resolve(frontendPath, 'src', 'app', 'modules', nameWithDashes, `${nameWithDashes}.module.ts`),
                    fileContent: moduleFileTemplate
                        .replace(/<camel_cased_name>/g, camelCasedName)
                        .replace(/<capitalized_camel_cased_name>/g, capitalizedCamelCasedName)
                        .replace(/<name_with_dashes>/g, nameWithDashes)
                        .replace(/<components_imports>/g, components.map(component => {
                        return `import {${component.name}} from './${component.path}';`;
                    }).join('\n'))
                        .replace(/<components_class_names>/g, components.map(component => {
                        return `${indentation.repeat(2)}${component.name},`;
                    }).join('\n'))
                };
                // material module
                const materialModuleFile = {
                    path: path_1.default.resolve(frontendPath, 'src', 'app', 'modules', nameWithDashes, 'material', `${nameWithDashes}-material.module.ts`),
                    fileContent: materialFileTemplate
                        .replace(/<capitalized_camel_cased_name>/g, capitalizedCamelCasedName)
                };
                // routing
                const routingFile = {
                    path: path_1.default.resolve(frontendPath, 'src', 'app', 'modules', nameWithDashes, `${nameWithDashes}.routing.ts`),
                    fileContent: routingFileTemplate
                        .replace(/<camel_cased_name>/g, camelCasedName)
                        .replace(/<capitalized_camel_cased_name>/g, capitalizedCamelCasedName)
                        .replace(/<name_with_dashes>/g, nameWithDashes)
                        .replace(/<components_imports>/g, components.map(component => {
                        return `import {${component.name}} from './${component.path}';`;
                    }).join('\n'))
                        .replace(/<components_routes>/g, `${indentation}{\n` +
                        `${indentation.repeat(2)}path: '',\n` +
                        `${indentation.repeat(2)}component: ${capitalizedCamelCasedName}Component,\n` +
                        `${indentation.repeat(2)}children: [{\n` +
                        `${indentation.repeat(3)}path: ':id',\n` +
                        `${indentation.repeat(3)}component: ${capitalizedCamelCasedName}ViewComponent,\n` +
                        `${indentation.repeat(3)}children: [{\n` +
                        `${indentation.repeat(4)}path: 'details',\n` +
                        `${indentation.repeat(4)}component: ${capitalizedCamelCasedName}DetailsComponent\n` +
                        `${indentation.repeat(3)}}, {\n` +
                        `${indentation.repeat(4)}path: 'edit',\n` +
                        `${indentation.repeat(4)}component: ${capitalizedCamelCasedName}EditComponent\n` +
                        `${indentation.repeat(3)}}]\n` +
                        `${indentation.repeat(2)}}]\n` +
                        `${indentation}}\n`)
                };
                modulesToAdd.push({
                    modulePath: moduleFile.path
                        .replace(frontendPath, '')
                        .replace(/\\/g, '/')
                        .replace(/\/\//g, '/')
                        .replace(/\/src\/app/, ''),
                    nameWithDashes: nameWithDashes,
                    moduleCapitalizedCamelCasedName: capitalizedCamelCasedName
                });
                filesToCreate.push(moduleFile);
                filesToCreate.push(materialModuleFile);
                filesToCreate.push(routingFile);
            }
            if (modulesToAdd.length) {
                const routingFileList = yield file_utils_1.FileUtils.getFileList({
                    startPath: path_1.default.resolve(frontendPath, 'src', 'app'),
                    filter: /app[^a-z].*routing\.module\.ts/
                });
                let appRoutingFileContent = '';
                let routingFilePath = path_1.default.resolve(frontendPath, 'src', 'app', 'app-routing.module.ts');
                if (routingFileList.length === 1) {
                    routingFilePath = routingFileList[0];
                    appRoutingFileContent = yield file_utils_1.FileUtils.readFile(routingFileList[0]);
                }
                else {
                    appRoutingFileContent = appRoutingFileTemplate;
                }
                for (let i = 0; i < modulesToAdd.length; i++) {
                    const moduleToAdd = modulesToAdd[i];
                    const expectedPath = `.${moduleToAdd.modulePath.replace(/\.ts$/, ``)}`;
                    const moduleRegexp = new RegExp(expectedPath
                        .replace(/\./g, '\\.')
                        .replace(/\\/g, '\\\\'), 'i');
                    if (!moduleRegexp.test(appRoutingFileContent)) {
                        // the module is not in, we will add it
                        const firstBlock = /(\[([^=;]+)\])/.exec(appRoutingFileContent);
                        if (firstBlock && firstBlock[2]) {
                            appRoutingFileContent = appRoutingFileContent.replace(firstBlock[1], `[{\n${indentation.repeat(2)}path: '${moduleToAdd.nameWithDashes}',\n` +
                                `${indentation.repeat(2)}loadChildren: () => import('${expectedPath}').then(mod => mod.${moduleToAdd.moduleCapitalizedCamelCasedName}Module)`);
                        }
                    }
                }
                // filesToCreate.push({
                //     fileContent: appRoutingFileContent,
                //     path: routingFilePath
                // });
            }
            uiUtils.stoprProgress();
            uiUtils.startProgress({ length: filesToCreate.length, start: 0, title: 'Write files' });
            for (let i = 0; i < filesToCreate.length; i++) {
                uiUtils.progress(i);
                const fileToCreate = filesToCreate[i];
                file_utils_1.FileUtils.createFolderStructureIfNeeded(fileToCreate.path);
                file_utils_1.FileUtils.writeFileSync(fileToCreate.path, fileToCreate.fileContent);
            }
            uiUtils.stoprProgress();
            if (filesToCreate.length) {
                uiUtils.success({ origin: this._origin, message: `Created ${filesToCreate.length} files` });
            }
            else {
                uiUtils.warning({ origin: this._origin, message: `No files created` });
            }
        });
    }
    static _createFrontendServiceFunction(params) {
        let functionParameters = '';
        let lambdaFunctionParameters = '';
        switch (params.action) {
            case 'get':
                functionParameters = 'id: number';
                lambdaFunctionParameters = 'id';
                break;
            case 'delete':
                functionParameters = 'id: number';
                lambdaFunctionParameters = 'id';
                break;
            case 'list':
                functionParameters = 'params: any';
                lambdaFunctionParameters = 'params';
                break;
            case 'save':
                functionParameters = `params: ${params.capitalizedCamelCasedName}`;
                lambdaFunctionParameters = 'params';
                break;
            default:
                break;
        }
        let f = `${indentation}async ${params.action}${params.capitalizedCamelCasedName}(${functionParameters}): Promise<${params.capitalizedCamelCasedName}> {\n`;
        f += `${indentation}return this.lambdaService.callLambdaPromise({\n`;
        f += `${indentation.repeat(2)}apiName: '${params.serviceName}',\n`;
        f += `${indentation.repeat(2)}functionName: 'runfunction',\n`;
        f += `${indentation.repeat(2)}payload: {functionName: '${params.serviceFunctionName}', ${lambdaFunctionParameters}}\n`;
        f += `${indentation.repeat(2)}});\n`;
        f += `${indentation}}`;
        return f;
    }
    static _createModelFile(fields, uiUtils) {
        return fields.map(field => {
            return `${indentation}${field.camelCasedName}: ${FrontendFileHelper._databaseTypeToFrontendType(field.type, uiUtils)};`;
        }).join('\n');
    }
    static _databaseTypeToFrontendType(databaseType, uiUtils) {
        const type = databaseType
            .trim()
            .toLowerCase()
            .split('(')[0]
            .split(' ')[0];
        switch (type) {
            case 'int':
            case 'integer':
            case 'serial':
                return 'number';
            case 'int[]':
            case 'integer[]':
            case 'serial[]':
                return 'number[]';
            case 'text':
            case 'char':
            case 'character':
            case 'varchar':
            case 'nvarchar':
            case 'uuid':
                return 'string';
            case 'boolean':
                return 'boolean';
            case 'date':
            case 'interval':
            case 'timestamp':
            case 'timestamptz':
            case 'datetime':
                return 'Date';
            case 'json':
            case 'jsonb':
                return 'any';
            default:
                uiUtils.warning({ origin: this._origin, message: `Database Type "${databaseType}" not mapped` });
                break;
        }
        return 'any';
    }
}
exports.FrontendFileHelper = FrontendFileHelper;
FrontendFileHelper._origin = 'FrontendFileHelper';
FrontendFileHelper.frontendTemplatesFolder = path_1.default.resolve(process.argv[1], '../../data/frontend/templates');

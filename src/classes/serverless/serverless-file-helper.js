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
exports.ServerlessFileHelper = void 0;
const database_helper_1 = require("../database/database-helper");
const file_utils_1 = require("../../utils/file.utils");
const path_1 = __importDefault(require("path"));
const colors_1 = __importDefault(require("colors"));
const js_yaml_1 = __importDefault(require("js-yaml"));
const serverless_repo_reader_1 = require("./serverless-repo-reader");
const database_file_helper_1 = require("../database/database-file-helper");
const repository_utils_1 = require("../../utils/repository.utils");
class ServerlessFileHelper {
    static generateFunctions(params, uiUtils) {
        return __awaiter(this, void 0, void 0, function* () {
            yield repository_utils_1.RepositoryUtils.checkOrGetApplicationName(params, 'middle-tier', uiUtils);
            const applicationDatabaseName = params.applicationName.replace(/\-middle-tier$/, '-database');
            // read the db File, to get the list of functions
            const databaseObject = yield database_helper_1.DatabaseHelper.getApplicationDatabaseObject(applicationDatabaseName);
            if (!databaseObject) {
                throw 'This application does not exist';
            }
            const actions = [
                'save',
                'get',
                'list',
                'delete',
            ];
            let filesCreated = 0;
            let filesIgnored = 0;
            let filesOverwritten = 0;
            const tables = Object.keys(databaseObject.table);
            uiUtils.startProgress({ length: tables.length * 4, start: 0, title: 'Functions' });
            const functionsToAdd = [];
            for (let t = 0; t < tables.length; t++) {
                const tableName = tables[t];
                if (!databaseObject.table[tableName].tags.ignore) {
                    const slsParams = {
                        function_name: '',
                        read_only: '',
                        db_function_name: '',
                        db_camel_cased_parameters: '',
                        function_description: ''
                    };
                    const nameWithoutPrefixAndSuffix = tableName
                        .replace(new RegExp(`\_${databaseObject.table[tableName].tableSuffix}$`), '')
                        .replace(new RegExp(`^${databaseObject._properties.dbName}t\_`), '');
                    const nameWithoutUnderscore = nameWithoutPrefixAndSuffix.replace(/_/g, '');
                    const serviceName = databaseObject.table[tableName].tags['service-name'] ?
                        databaseObject.table[tableName].tags['service-name'].value : 'service';
                    const folderPath = path_1.default.resolve(databaseObject._properties.path.replace('database', 'middle-tier'), 'lambda', serviceName);
                    file_utils_1.FileUtils.createFolderStructureIfNeeded(folderPath);
                    for (let i = 0; i < actions.length; i++) {
                        const action = actions[i];
                        slsParams.function_name = action + nameWithoutUnderscore;
                        slsParams.db_function_name = `${databaseObject._properties.dbName}f_${action}_${nameWithoutPrefixAndSuffix}`;
                        slsParams.read_only = action === 'get' || action === 'list' ? 'ReadOnly' : '';
                        slsParams.function_description = `${action} ${nameWithoutPrefixAndSuffix.replace(/_/g, ' ')}`;
                        let params = [];
                        switch (action) {
                            case 'get':
                                params = ['id'];
                                break;
                            case 'delete':
                                params = ['id', 'modifiedAt'];
                                break;
                            case 'save':
                            case 'list':
                                params = ['params'];
                                break;
                            default:
                                break;
                        }
                        slsParams.db_camel_cased_parameters = params.map(x => `'${x}'`).join(', ');
                        const fileName = path_1.default.resolve(folderPath, 'handlers', nameWithoutPrefixAndSuffix.replace(/_/g, '-'), `${slsParams.function_name}.js`);
                        if (!databaseObject.table[tableName].tags[`no-${action}`]) {
                            // let fileString = await FileUtils.readFile(path.resolve(process.argv[1], ServerlessFileHelper.serverlessTemplatesFolder, 'handlers', `lambda.js`));
                            // for (let j = 0; j < slsParamsFields.length; j++) {
                            //     const param = slsParamsFields[j];
                            //     fileString = fileString.replace(new RegExp(`<${param}>`, 'gi'), slsParams[param]);
                            // }
                            let writeFile = true;
                            // if (FileUtils.checkIfFolderExists(fileName)) {
                            //     // we have an existing file. We get the content, and check if it is different. If yer, we override
                            //     const currentFileCOntent = await FileUtils.readFile(fileName);
                            //     if (currentFileCOntent !== fileString) {
                            //         writeFile = true;
                            //         filesOverwritten++;
                            //     } else {
                            //         writeFile = false;
                            //         filesIgnored++;
                            //     }
                            // } else {
                            //     writeFile = true;
                            // }
                            if (writeFile) {
                                // FileUtils.writeFileSync(fileName, fileString);
                                filesCreated++;
                                functionsToAdd.push({
                                    functionName: slsParams.function_name,
                                    dbFunctionName: slsParams.db_function_name,
                                    functionPath: `handlers/${nameWithoutPrefixAndSuffix.replace(/_/g, '-')}/${slsParams.function_name}`,
                                    servicePath: folderPath,
                                    serviceName: serviceName,
                                    functionFields: params,
                                    readOnly: slsParams.read_only === 'ReadOnly',
                                    operation: slsParams.function_description
                                });
                            }
                            uiUtils.progress(4 * t + i);
                        }
                    }
                }
            }
            uiUtils.stoprProgress();
            let feedback = 'No files created.';
            if (filesCreated) {
                feedback = `Created ${filesCreated} files.`;
            }
            if (filesIgnored) {
                feedback += ` ${colors_1.default.yellow(`${filesIgnored}`)} files ignored (as unchanged)`;
            }
            if (filesOverwritten) {
                feedback += ` ${colors_1.default.yellow(`${filesOverwritten}`)} files overwritten`;
            }
            if (filesCreated) {
                uiUtils.success({ origin: this._origin, message: feedback });
            }
            else {
                uiUtils.warning({ origin: this._origin, message: feedback });
            }
            const takenNames = {
                abrevations: {},
                serviceNames: {},
            };
            // todo fill the taken names with the current service data
            if (filesCreated || filesOverwritten) {
                const services = functionsToAdd.reduce((agg, curr) => {
                    if (agg.indexOf(curr.serviceName) === -1) {
                        agg.push(curr.serviceName);
                    }
                    return agg;
                }, []);
                for (let i = 0; i < services.length; i++) {
                    const service = services[i];
                    let abbreviation = databaseObject._properties.dbName + '-' + service.substr(0, 1);
                    // get the service name
                    if (takenNames.serviceNames[service]) {
                        // service already exist, we get the same name
                        abbreviation = takenNames.serviceNames[service];
                    }
                    else if (takenNames.abrevations[abbreviation]) {
                        let letterCount = 2;
                        abbreviation = databaseObject._properties.dbName + '-' + service.substr(0, letterCount);
                        while (takenNames.abrevations[abbreviation] && letterCount < service.length) {
                            letterCount++;
                            abbreviation = databaseObject._properties.dbName + '-' + service.substr(0, letterCount);
                        }
                        if (abbreviation === service) {
                            let index = 0;
                            abbreviation = databaseObject._properties.dbName + '-' + service.substr(0, 1) + `${index + 1}`;
                            while (takenNames.abrevations[abbreviation]) {
                                index++;
                                abbreviation = databaseObject._properties.dbName + '-' + service.substr(0, 1) + `${index + 1}`;
                            }
                        }
                        takenNames.abrevations[abbreviation] = service;
                        takenNames.serviceNames[service] = abbreviation;
                    }
                    // copy the files in the folder if nothing exists
                    const folderPath = path_1.default.resolve(databaseObject._properties.path.replace('database', 'middle-tier'), 'lambda', service);
                    file_utils_1.FileUtils.createFolderStructureIfNeeded(path_1.default.resolve(folderPath, 'utils'));
                    file_utils_1.FileUtils.createFolderStructureIfNeeded(path_1.default.resolve(folderPath, 'handlers'));
                    const existingService = file_utils_1.FileUtils.checkIfFolderExists(path_1.default.resolve(folderPath, 'serverless.yml'));
                    const filesToCreate = [
                        {
                            from: path_1.default.resolve(ServerlessFileHelper.serverlessTemplatesFolder, 'serverless.yml'),
                            to: path_1.default.resolve(folderPath, 'serverless.yml')
                        },
                        {
                            from: path_1.default.resolve(ServerlessFileHelper.serverlessTemplatesFolder, 'variables.yml'),
                            to: path_1.default.resolve(folderPath, 'variables.yml')
                        },
                        {
                            from: path_1.default.resolve(ServerlessFileHelper.serverlessTemplatesFolder, 'handlers', 'runfunction.js'),
                            to: path_1.default.resolve(folderPath, 'handlers', 'runfunction.js')
                        },
                        {
                            from: path_1.default.resolve(ServerlessFileHelper.serverlessTemplatesFolder, 'handlers', 'functions.js'),
                            to: path_1.default.resolve(folderPath, 'handlers', 'functions.js')
                        },
                        {
                            from: path_1.default.resolve(ServerlessFileHelper.serverlessTemplatesFolder, 'utils', 'CommonUtils.js'),
                            to: path_1.default.resolve(folderPath, 'utils', 'CommonUtils.js')
                        },
                    ];
                    for (let j = 0; j < filesToCreate.length; j++) {
                        const fileToCreate = filesToCreate[j];
                        if (!file_utils_1.FileUtils.checkIfFolderExists(fileToCreate.to)) {
                            file_utils_1.FileUtils.copyFileSync(fileToCreate.from, fileToCreate.to);
                        }
                    }
                    if (existingService) {
                        // update the current service
                        let fileString = yield file_utils_1.FileUtils.readFile(path_1.default.resolve(folderPath, 'serverless.yml'));
                        const serverlessYmlAsJson = ServerlessFileHelper.ymlToJson(fileString);
                        if (!serverlessYmlAsJson.functions.runfunction) {
                            serverlessYmlAsJson.functions.runfunction = {
                                handler: 'handlers/runfunction.runfunction'
                            };
                        }
                        file_utils_1.FileUtils.writeFileSync(path_1.default.resolve(folderPath, 'serverless.yml'), js_yaml_1.default.dump(serverlessYmlAsJson, {
                            noArrayIndent: true
                        }));
                    }
                    else {
                        // update the functions file
                        const functions = `module.exports.functions = {\n${functionsToAdd
                            .filter(x => x.serviceName === service)
                            .map(x => `${database_file_helper_1.indentationSpaces}${x.functionName}: {dbName: '${x.dbFunctionName}', fields: [${x.functionFields.map(y => `'${y}'`).join(', ')}], operationName: '${x.operation}', readOnly: ${x.readOnly ? 'true' : 'false'}}`)
                            .join(',\n')}\n};`;
                        file_utils_1.FileUtils.writeFileSync(path_1.default.resolve(folderPath, 'handlers', 'functions.js'), functions);
                        let fileString = yield file_utils_1.FileUtils.readFile(path_1.default.resolve(folderPath, 'serverless.yml'));
                        const serverlessYmlAsJson = ServerlessFileHelper.ymlToJson(fileString);
                        serverlessYmlAsJson.service = abbreviation;
                        if (!serverlessYmlAsJson.functions.runfunction) {
                            serverlessYmlAsJson.functions.runfunction = {
                                handler: 'handlers/runfunction.runfunction'
                            };
                        }
                        file_utils_1.FileUtils.writeFileSync(path_1.default.resolve(folderPath, 'serverless.yml'), js_yaml_1.default.dump(serverlessYmlAsJson, {
                            noArrayIndent: true
                        }));
                    }
                }
                yield serverless_repo_reader_1.ServerlessRepositoryReader.readRepo(databaseObject._properties.path.replace('database', 'middle-tier'), params.applicationName, uiUtils);
            }
            return yield Promise.resolve(true);
        });
    }
    static ymlToJson(yml) {
        return js_yaml_1.default.load(yml);
    }
    static jsonToYml(json) {
        return js_yaml_1.default.dump(json, {
            noArrayIndent: true
        });
    }
}
exports.ServerlessFileHelper = ServerlessFileHelper;
ServerlessFileHelper._origin = 'ServerlessRepositoryReader';
ServerlessFileHelper.serverlessTemplatesFolder = path_1.default.resolve(process.argv[1], '../../data/serverless/templates');

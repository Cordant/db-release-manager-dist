"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
exports.ServerlessRepositoryReader = void 0;
const file_utils_1 = require("../../utils/file.utils");
const YAML = __importStar(require("yamljs"));
const serverless_file_model_1 = require("../../models/serverless-file.model");
const path_1 = __importDefault(require("path"));
const colors_1 = __importDefault(require("colors"));
const repository_utils_1 = require("../../utils/repository.utils");
const database_helper_1 = require("../database/database-helper");
const serverless_file_helper_1 = require("./serverless-file-helper");
class ServerlessRepositoryReader {
    static readRepo(startPath, repoName, uiUtils) {
        return __awaiter(this, void 0, void 0, function* () {
            const files = yield file_utils_1.FileUtils.getFileList({
                startPath: startPath,
                filter: /serverless.yml/
            });
            const variableFiles = yield file_utils_1.FileUtils.getFileList({
                startPath: startPath,
                filter: /variables.yml/
            });
            const serverlessFiles = yield ServerlessRepositoryReader._readFiles(files, variableFiles, uiUtils);
            // read the current serverless file and add on
            file_utils_1.FileUtils.createFolderStructureIfNeeded(ServerlessRepositoryReader._tempFolderPath);
            let fileData = {};
            if (file_utils_1.FileUtils.checkIfFolderExists(ServerlessRepositoryReader._serverlessDbPath)) {
                fileData = yield file_utils_1.FileUtils.readJsonFile(ServerlessRepositoryReader._serverlessDbPath);
            }
            fileData[repoName] = serverlessFiles;
            file_utils_1.FileUtils.writeFileSync(ServerlessRepositoryReader._serverlessDbPath, JSON.stringify(fileData, null, 2));
            uiUtils.success({ origin: this._origin, message: `Repository read` });
        });
    }
    static _ymlToJson(data) {
        return YAML.parse(data.replace(/\t/g, '  ').replace(/\r\n\r\n/g, '\r\n').replace(/\r\n\r\n/g, '\r\n').replace(/\n$/, "").trim());
    }
    static _readFiles(files, variableFiles, uiUtils) {
        return __awaiter(this, void 0, void 0, function* () {
            const serverlessFiles = [];
            uiUtils.startProgress({ length: files.length, start: 0, title: 'serverless.yml' });
            for (let i = 0; i < files.length; i++) {
                uiUtils.progress(i + 1);
                const fileString = file_utils_1.FileUtils.readFileSync(files[i]);
                const serverlessFile = new serverless_file_model_1.ServerlessFile(ServerlessRepositoryReader._ymlToJson(fileString));
                serverlessFile.fileName = files[i];
                const variableFileName = variableFiles.find(x => x.replace(/variables\.yml$/, 'serverless.yml') === files[i]);
                let variables = {};
                if (variableFileName) {
                    const variableFileString = file_utils_1.FileUtils.readFileSync(variableFileName);
                    variables = ServerlessRepositoryReader._ymlToJson(variableFileString);
                }
                let serverlessVariables = [];
                const regexVariables = new RegExp(/\$\{file\(\.\/variables\.yml\)\:(.*?)\}/gi);
                // get the serverless variables
                serverlessVariables = serverlessFile.environmentVariables.map(x => {
                    let newValue = x.value;
                    let match = regexVariables.exec(newValue);
                    const subVars = [];
                    while (match != null) {
                        subVars.push(match[1]);
                        newValue = newValue.replace(regexVariables, match[1]);
                        match = regexVariables.exec(newValue);
                    }
                    return Object.assign(Object.assign({}, x), { value: variables[newValue], variableFileName: newValue, declared: !!variables[newValue] });
                });
                serverlessVariables.forEach(variable => {
                    const varIndex = serverlessFile.environmentVariables.findIndex(x => x.key === variable.key);
                    if (varIndex > -1) {
                        serverlessFile.environmentVariables[varIndex].declared = true;
                        serverlessFile.environmentVariables[varIndex].value = variable.value;
                    }
                });
                serverlessFiles.push(serverlessFile);
            }
            uiUtils.stoprProgress();
            return serverlessFiles;
        });
    }
    static listFunctions(filter, uiUtils) {
        return __awaiter(this, void 0, void 0, function* () {
            filter = filter || '';
            let regex = new RegExp(filter);
            const fileData = yield file_utils_1.FileUtils.readJsonFile(ServerlessRepositoryReader._serverlessDbPath);
            if (!fileData) {
                uiUtils.warning({ origin: ServerlessRepositoryReader._origin, message: 'No functions found' });
            }
            else {
                const functions = Object.keys(fileData)
                    .map((repo) => {
                    let functionsAndServices = fileData[repo].map((serverlessFile) => {
                        return serverlessFile.functions.map(f => {
                            return `\t${colors_1.default.green(serverlessFile.serviceName)}-${colors_1.default.cyan(f.name)}`;
                        });
                    }).reduce((agg, curr) => agg.concat(curr), []);
                    if (!regex.test(repo)) {
                        functionsAndServices = functionsAndServices.filter(str => regex.test(str));
                    }
                    if (functionsAndServices.length > 0) {
                        functionsAndServices.unshift(colors_1.default.yellow(repo));
                        functionsAndServices.unshift('');
                    }
                    return functionsAndServices;
                }).reduce((agg, curr) => agg.concat(curr), []).filter(Boolean);
                console.log(functions.join('\n'));
            }
        });
    }
    static checkPostgresCalls(params, uiUtils) {
        return __awaiter(this, void 0, void 0, function* () {
            yield repository_utils_1.RepositoryUtils.checkOrGetApplicationName(params, 'middle-tier', uiUtils);
            const applicationDatabaseName = params.databaseName || params.applicationName.replace(/\-middle-tier$/, '-database');
            const databaseObject = yield database_helper_1.DatabaseHelper.getApplicationDatabaseObject(applicationDatabaseName);
            if (!databaseObject) {
                throw `No database could be found with those parameters, please use the --database (-d) parameter`;
            }
            const allServerlessFiles = yield file_utils_1.FileUtils.readJsonFile(ServerlessRepositoryReader._serverlessDbPath);
            const serverlessFiles = allServerlessFiles[params.applicationName];
            if (!serverlessFiles) {
                throw 'This application does not exist';
            }
            const functionsAndMode = Object.keys(databaseObject.function)
                .reduce((agg, curr) => (Object.assign(Object.assign({}, agg), { [curr]: databaseObject.function[curr].mode })), {});
            const functionsWithIssues = [];
            const fileCount = serverlessFiles.reduce((agg, curr) => agg + Object.keys(curr.functions).length, 0);
            uiUtils.startProgress({ length: fileCount, start: 0, title: 'analyzing functions' });
            let k = 1;
            for (let i = 0; i < serverlessFiles.length; i++) {
                const serverlessFile = serverlessFiles[i];
                for (let j = 0; j < serverlessFile.functions.length; j++) {
                    uiUtils.progress(k + 1);
                    k++;
                    const serverlessFunction = serverlessFile.functions[j];
                    let serverlessFunctionString = '';
                    const fileName = path_1.default.resolve(serverlessFile.fileName.replace(/serverless\.yml$/, ''), `${serverlessFunction.handler}.js`);
                    try {
                        serverlessFunctionString = yield file_utils_1.FileUtils.readFile(fileName);
                    }
                    catch (error) {
                        functionsWithIssues.push({
                            lambdaFunctionName: serverlessFunction.handlerFunctionName,
                            severity: "error",
                            postgresFunctionName: '',
                            fileName: serverlessFile.fileName,
                            errorType: 'missing-file',
                            serverlessFileName: serverlessFile.fileName,
                            error: `File "${path_1.default.resolve(serverlessFile.fileName.replace(/serverless\.yml$/, ''), `${serverlessFunction.handler}.js`)}" does not exist`
                        });
                    }
                    if (serverlessFunctionString) {
                        const processRegex = /CommonUtils\.(process|processReadOnly)\([^']+(?:\'|")([a-z0-9]+\_[a-z0-9]+\_[a-z0-9]+)(?:\'|")/gi;
                        let extracted = processRegex.exec(serverlessFunctionString);
                        while (extracted) {
                            const [, typeOfProcess, functionName] = extracted;
                            if (!functionsAndMode[functionName]) {
                                functionsWithIssues.push({
                                    lambdaFunctionName: serverlessFunction.handlerFunctionName,
                                    severity: "error",
                                    postgresFunctionName: functionName,
                                    fileName,
                                    errorType: 'missing-function',
                                    error: `Missing postgres function "${functionName}"`
                                });
                            }
                            if (typeOfProcess === 'process') {
                                if (functionsAndMode[functionName] !== 'volatile') {
                                    // can be put on read only
                                    functionsWithIssues.push({
                                        lambdaFunctionName: serverlessFunction.handlerFunctionName,
                                        severity: 'warning',
                                        postgresFunctionName: functionName,
                                        fileName,
                                        errorType: 'put-to-read-only',
                                        error: `"${functionName}" can be put on read only mode`
                                    });
                                }
                            }
                            else if (typeOfProcess === 'processReadOnly') {
                                if (functionsAndMode[functionName] === 'volatile') {
                                    // can be put on read only
                                    functionsWithIssues.push({
                                        lambdaFunctionName: serverlessFunction.handlerFunctionName,
                                        severity: 'error',
                                        postgresFunctionName: functionName,
                                        fileName,
                                        errorType: 'put-to-process',
                                        error: `Please call "${functionName}" with the "process" operator`
                                    });
                                }
                            }
                            extracted = processRegex.exec(serverlessFunctionString);
                        }
                    }
                }
            }
            uiUtils.stoprProgress();
            for (let i = 0; i < functionsWithIssues.length; i++) {
                const f = functionsWithIssues[i];
                uiUtils[f.severity]({
                    message: `${f.lambdaFunctionName} - ${f.error}`,
                    origin: ServerlessRepositoryReader._origin
                });
            }
            const issuesWeCanFix = functionsWithIssues.filter(x => x.errorType !== 'missing-function');
            if (issuesWeCanFix.length) {
                const fix = yield uiUtils.question({
                    origin: ServerlessRepositoryReader._origin,
                    text: `Do you want to resolve the issues above ? (y/n)`
                });
                if (fix.toLowerCase() === 'y') {
                    uiUtils.info({
                        origin: ServerlessRepositoryReader._origin,
                        message: 'Solving...'
                    });
                    for (let i = 0; i < issuesWeCanFix.length; i++) {
                        const issue = issuesWeCanFix[i];
                        if (issue.errorType === 'put-to-process') {
                            uiUtils.info({
                                origin: ServerlessRepositoryReader._origin,
                                message: `  - Putting ${issue.lambdaFunctionName} to process on calling ${issue.postgresFunctionName}`
                            });
                            let fileString = yield file_utils_1.FileUtils.readFile(issue.fileName);
                            const regex = new RegExp(`\.processReadOnly\\(([^']+)(\'|")(${issue.postgresFunctionName})(\'|")`, 'gi');
                            fileString = fileString.replace(regex, `.process($1$2$3$4`);
                            yield file_utils_1.FileUtils.writeFileSync(issue.fileName, fileString);
                        }
                        else if (issue.errorType === 'put-to-read-only') {
                            uiUtils.info({
                                origin: ServerlessRepositoryReader._origin,
                                message: `  - Putting ${issue.lambdaFunctionName} to processReadOnly on calling ${issue.postgresFunctionName}`
                            });
                            let fileString = yield file_utils_1.FileUtils.readFile(issue.fileName);
                            const regex = new RegExp(`\.process\\(([^']+)(\'|")(${issue.postgresFunctionName})(\'|")`, 'gi');
                            fileString = fileString.replace(regex, `.processReadOnly($1$2$3$4`);
                            yield file_utils_1.FileUtils.writeFileSync(issue.fileName, fileString);
                        }
                        else if (issue.errorType === 'missing-file') {
                            let serverlessFile = serverless_file_helper_1.ServerlessFileHelper.ymlToJson(yield file_utils_1.FileUtils.readFile(issue.fileName));
                            delete serverlessFile.functions[issue.lambdaFunctionName];
                            if (Object.keys(serverlessFile.functions).length) {
                                uiUtils.info({
                                    origin: ServerlessRepositoryReader._origin,
                                    message: `  - Removing ${issue.lambdaFunctionName} from serverless.yml`
                                });
                                const newFileData = serverless_file_helper_1.ServerlessFileHelper.jsonToYml(serverlessFile);
                                yield file_utils_1.FileUtils.writeFileSync(issue.fileName, newFileData);
                            }
                            else {
                                uiUtils.warning({
                                    origin: ServerlessRepositoryReader._origin,
                                    message: `Removing ${issue.lambdaFunctionName} will make this service useless. Please delete manually`
                                });
                                const deleteFolder = yield uiUtils.choices({
                                    choices: [
                                        'No',
                                        'Yes',
                                    ],
                                    title: 'Delete folder',
                                    message: 'Do you want to delete this folder'
                                });
                                if (deleteFolder['Delete folder'] === 'Yes') {
                                    uiUtils.info({
                                        origin: ServerlessRepositoryReader._origin,
                                        message: `  - Removing ${issue.lambdaFunctionName} from serverless.yml`
                                    });
                                    if (issue.serverlessFileName) {
                                        file_utils_1.FileUtils.deleteFolderRecursiveSync(issue.serverlessFileName.replace(/(\\|\/)serverless.yml$/, ''));
                                    }
                                }
                            }
                        }
                    }
                    uiUtils.success({
                        origin: ServerlessRepositoryReader._origin,
                        message: 'Solved...'
                    });
                }
            }
        });
    }
    static formatServerlessFile(fileString) {
        return fileString
            .replace(/\r/g, '')
            .replace(/\n/g, '')
            .replace(/\t/g, ' ')
            .replace(/  /g, ' ')
            .replace(/  /g, ' ');
    }
}
exports.ServerlessRepositoryReader = ServerlessRepositoryReader;
ServerlessRepositoryReader._origin = 'ServerlessRepositoryReader';
ServerlessRepositoryReader._tempFolderPath = path_1.default.resolve(process.argv[1], '../../../temp');
ServerlessRepositoryReader._serverlessDbPath = ServerlessRepositoryReader._tempFolderPath + '/serverless-db.json';

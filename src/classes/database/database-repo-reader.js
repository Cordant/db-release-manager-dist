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
exports.DatabaseRepositoryReader = void 0;
const file_utils_1 = require("../../utils/file.utils");
const path_1 = __importDefault(require("path"));
const colors_1 = __importDefault(require("colors"));
const database_file_model_1 = require("../../models/database-file.model");
const database_helper_1 = require("./database-helper");
const repository_utils_1 = require("../../utils/repository.utils");
const server_utils_1 = require("../../utils/server.utils");
const acceptableVersionRegExp = /^current$|^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$/i;
class DatabaseRepositoryReader {
    static readRepo(startPath, applicationName, uiUtils, silent) {
        return __awaiter(this, void 0, void 0, function* () {
            // we have to get the list of files and read them
            const versionFiles = yield file_utils_1.FileUtils.getFileList({
                startPath: path_1.default.resolve(startPath, database_helper_1.DatabaseHelper.releasesPath),
                filter: /version.json$/
            });
            // read all the SQL files, to see if they are all in the installation scripts
            const fileList = (yield file_utils_1.FileUtils.getFileList({
                filter: /\.sql$/,
                startPath: path_1.default.resolve(startPath, database_helper_1.DatabaseHelper.releasesPath)
            })).map(x => x.replace(file_utils_1.FileUtils.replaceSlashes(startPath), '../'));
            // read the current db files file and add on
            const databaseFiles = yield DatabaseRepositoryReader._readFiles(versionFiles, fileList);
            yield database_helper_1.DatabaseHelper.updateApplicationDatabaseFiles(applicationName, databaseFiles);
            // read the current db objects file and add on
            const databaseObject = yield DatabaseRepositoryReader._extractObjectInformation(yield database_helper_1.DatabaseHelper.getApplicationDatabaseFiles(applicationName), startPath, uiUtils);
            yield database_helper_1.DatabaseHelper.updateApplicationDatabaseObject(applicationName, databaseObject);
            yield server_utils_1.ServerUtils.somethingChanged(applicationName);
        });
    }
    static initDatabase(params, uiUtils) {
        return __awaiter(this, void 0, void 0, function* () {
            yield repository_utils_1.RepositoryUtils.checkOrGetApplicationName(params, 'database', uiUtils);
            const databaseObject = yield database_helper_1.DatabaseHelper.getApplicationDatabaseObject(params.applicationName);
            let dbName = '';
            let currentPath = path_1.default.resolve(process.cwd());
            if (databaseObject) {
                currentPath = databaseObject._properties.path;
                if (file_utils_1.FileUtils.checkIfFolderExists(path_1.default.resolve(currentPath, 'postgres', 'release'))) {
                    const response = yield uiUtils.question({
                        text: 'There is already a version in this folder. Are you sure you want to override ? (y/n)',
                        origin: DatabaseRepositoryReader._origin
                    });
                    if (response.toLowerCase() !== 'y') {
                        throw 'Application forlder is not null';
                    }
                }
                dbName = databaseObject._properties.dbName;
            }
            if (!dbName) {
                while (!DatabaseRepositoryReader._isDatabaseNameValid(dbName)) {
                    dbName = yield uiUtils.question({
                        text: 'Please provide a 2 / 3 letter prefix for your database',
                        origin: DatabaseRepositoryReader._origin
                    });
                }
            }
            // we create the folder structure, and the default files
            const dbStructure = yield file_utils_1.FileUtils.readJsonFile(path_1.default.resolve(database_helper_1.DatabaseHelper.dbFolderStructureFolder, 'folder-structure.json'));
            yield DatabaseRepositoryReader._createDBFolderStructure(dbStructure, currentPath, dbName);
            uiUtils.success({ origin: DatabaseRepositoryReader._origin, message: `Database structure created for ${dbName}` });
            yield DatabaseRepositoryReader.readRepo(currentPath, params.applicationName, uiUtils, true);
        });
    }
    static _isDatabaseNameValid(name) {
        if (!name) {
            return false;
        }
        // todo check the other db names
        return /^[a-z][a-z0-9]{1,2}$/gi.test(name);
    }
    static _createDBFolderStructure(node, folderPath, dbName) {
        return __awaiter(this, void 0, void 0, function* () {
            if (node.folderName) {
                const newFolderPath = path_1.default.resolve(folderPath, node.folderName);
                file_utils_1.FileUtils.createFolderStructureIfNeeded(newFolderPath);
                if (node.children && node.children.length > 0) {
                    for (let i = 0; i < node.children.length; i++) {
                        const child = node.children[i];
                        yield DatabaseRepositoryReader._createDBFolderStructure(child, newFolderPath, dbName);
                    }
                }
                else {
                    file_utils_1.FileUtils.writeFileSync(path_1.default.resolve(newFolderPath, '.placeholder'), '');
                }
            }
            else if (node.fileName) {
                let fileContent = '';
                if (node.fileSource) {
                    fileContent = yield file_utils_1.FileUtils.readFile(path_1.default.resolve(database_helper_1.DatabaseHelper.dbFolderStructureFolder, 'files', node.fileSource));
                    if (fileContent) {
                        fileContent = fileContent.replace(/<db>/gi, dbName);
                    }
                }
                file_utils_1.FileUtils.writeFileSync(path_1.default.resolve(folderPath, node.fileName.replace('<db>', dbName)), fileContent);
            }
        });
    }
    static updateVersionFile(params, uiUtils) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!params.version) {
                throw 'Please provide a version.';
            }
            yield repository_utils_1.RepositoryUtils.checkOrGetApplicationName(params, 'database', uiUtils);
            const databaseObject = yield database_helper_1.DatabaseHelper.getApplicationDatabaseObject(params.applicationName);
            if (!databaseObject) {
                throw 'Please run the read repo command before running this command.';
            }
            const fileList = (yield file_utils_1.FileUtils.getFileList({
                filter: /\.sql/,
                startPath: path_1.default.resolve(databaseObject._properties.path, 'postgres', 'release', params.version)
            }));
            // read the files, see if they have dependencies
            const replacedPath = path_1.default.resolve(databaseObject._properties.path, 'postgres', 'release', params.version);
            const newDBObject = yield DatabaseRepositoryReader._extractObjectInformation([{
                    versionName: params.version,
                    fileName: params.version,
                    versions: [{
                            userToUse: 'root',
                            files: fileList
                                .map(filePath => new database_file_model_1.DatabaseFile(databaseObject._properties.path, filePath.replace(replacedPath, '../postgres/'))),
                            fileList: fileList,
                            databaseToUse: ''
                        }],
                }], databaseObject._properties.path, uiUtils);
            const versionFileList = [];
            // order the objects
        });
    }
    static _readFiles(files, allFiles) {
        return __awaiter(this, void 0, void 0, function* () {
            const filesRead = [];
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                const fileData = yield file_utils_1.FileUtils.readJsonFile(file);
                filesRead.push(new database_file_model_1.DatabaseVersionFile(file, fileData, allFiles));
            }
            return filesRead;
        });
    }
    static _processVersionFile(databaseFile, databaseObject, sqlFile, unmapped) {
        return __awaiter(this, void 0, void 0, function* () {
            if (sqlFile.type !== 'unknown') {
                if (!databaseObject[sqlFile.type]) {
                    databaseObject[sqlFile.type] = {};
                }
                if (!databaseObject[sqlFile.type][sqlFile.objectName]) {
                    databaseObject[sqlFile.type][sqlFile.objectName] = new database_file_model_1.DatabaseSubObject();
                }
                databaseObject[sqlFile.type][sqlFile.objectName].name = sqlFile.objectName;
                databaseObject[sqlFile.type][sqlFile.objectName].latestFile = sqlFile.fileName;
                databaseObject[sqlFile.type][sqlFile.objectName].latestVersion = databaseFile.versionName;
                databaseObject[sqlFile.type][sqlFile.objectName].versions.push({
                    file: sqlFile.fileName,
                    version: databaseFile.versionName
                });
            }
        });
    }
    static _extractObjectInformation(databaseFiles, path, uiUtils) {
        return __awaiter(this, void 0, void 0, function* () {
            databaseFiles = databaseFiles.filter(x => x.versionName.match(acceptableVersionRegExp));
            databaseFiles.sort((a, b) => {
                let vA = 0, vB = 0;
                if (a.versionName === 'current') {
                    vA = Infinity;
                }
                else {
                    vA = +a.versionName
                        .split('.')
                        .map((x, i) => +x + 1000)
                        .reduce((agg, curr) => `${agg}${curr}`, '');
                }
                if (b.versionName === 'current') {
                    vB = Infinity;
                }
                else {
                    vB = +b.versionName
                        .split('.')
                        .map((x, i) => +x + 1000)
                        .reduce((agg, curr) => `${agg}${curr}`, '');
                }
                return vA - vB;
            });
            const databaseObject = new database_file_model_1.DatabaseObject();
            databaseFiles.forEach(databaseFile => {
                if (databaseFile.versionName === 'current') {
                    databaseObject._properties.hasCurrent = true;
                }
                if (databaseObject._versions.indexOf(databaseFile.versionName) === -1) {
                    databaseObject._versions.push(databaseFile.versionName);
                }
                databaseFile.versions.forEach(version => {
                    version.files.forEach(file => DatabaseRepositoryReader._processVersionFile(databaseFile, databaseObject, file, false));
                    (version.unmappedFiles || []).forEach(file => DatabaseRepositoryReader._processVersionFile(databaseFile, databaseObject, file, true));
                });
            });
            const filesToAnalyzeLength = Object.keys(databaseObject.table).length +
                Object.keys(databaseObject.function).length +
                Object.keys(databaseObject.data).length;
            if (filesToAnalyzeLength > 0) {
                uiUtils.startProgress({
                    length: filesToAnalyzeLength,
                    start: 0,
                    title: 'Analyzing files'
                });
                let i = 0;
                if (Object.keys(databaseObject.table).length > 0) {
                    const keys = Object.keys(databaseObject.table);
                    for (let j = 0; j < keys.length; j++) {
                        const key = keys[j];
                        uiUtils.progress(++i);
                        databaseObject.table[key] = new database_file_model_1.DatabaseTable(databaseObject.table[key]);
                        yield databaseObject.table[key].analyzeFile(uiUtils);
                    }
                }
                if (Object.keys(databaseObject.function).length > 0) {
                    const keys = Object.keys(databaseObject.function);
                    for (let j = 0; j < keys.length; j++) {
                        const key = keys[j];
                        uiUtils.progress(++i);
                        databaseObject.function[key] = new database_file_model_1.DatabaseFunction(databaseObject.function[key]);
                        yield databaseObject.function[key].analyzeFile(uiUtils);
                    }
                }
                if (Object.keys(databaseObject['local-tables']).length > 0) {
                    const keys = Object.keys(databaseObject['local-tables']);
                    for (let j = 0; j < keys.length; j++) {
                        const key = keys[j];
                        uiUtils.progress(++i);
                        databaseObject['local-tables'][key] = new database_file_model_1.DatabaseLocalReplicatedTable(databaseObject['local-tables'][key]);
                        yield databaseObject['local-tables'][key].analyzeFile(uiUtils);
                    }
                }
                if (Object.keys(databaseObject.data).length > 0) {
                    const keys = Object.keys(databaseObject.data);
                    for (let j = 0; j < keys.length; j++) {
                        const key = keys[j];
                        uiUtils.progress(++i);
                        databaseObject.data[key] = new database_file_model_1.DatabaseDataScript(databaseObject.data[key]);
                        yield databaseObject.data[key].analyzeFile(uiUtils);
                    }
                }
                uiUtils.stoprProgress();
            }
            // get the db name from the drop script if we have one
            if (databaseObject.setup['01-drop-database']) {
                const fileContent = yield file_utils_1.FileUtils.readFile(databaseObject.setup['01-drop-database'].latestFile);
                const dbMatched = fileContent.match(/\<env\>_[a-z][a-z0-9]{1,2}/i);
                if (dbMatched) {
                    databaseObject._properties.dbName = dbMatched[0].replace('<env>_', '');
                }
            }
            // latest version
            const latestVersionNWithoutCurrent = databaseFiles.filter(x => x.versionName !== 'current');
            if (latestVersionNWithoutCurrent.length) {
                databaseObject._properties.lastVersion = latestVersionNWithoutCurrent[latestVersionNWithoutCurrent.length - 1].versionName;
            }
            if (!databaseObject._properties.dbName &&
                Object.keys(databaseObject.table).length > 0
                && Object.keys(databaseObject.table)[0].match(/^([a-z]{2,4})t_/)) {
                const dbNameRegex = /^([a-z]{2,4})t_/g.exec(Object.keys(databaseObject.table)[0]);
                Object.keys(databaseObject.table)[0];
                if (dbNameRegex) {
                    databaseObject._properties.dbName = dbNameRegex[1];
                }
            }
            // read the files to check for parameters
            const filesToWatch = databaseFiles.map(databaseFile => {
                return databaseFile.versions.map(version => {
                    return version.files.map(file => file.fileName);
                }).reduce((agg, curr) => agg.concat(curr), []);
            }).reduce((agg, curr) => agg.concat(curr), []);
            const variableRegex = new RegExp(/\<(\w+)\>/gim);
            const variablesPerFiles = {};
            uiUtils.startProgress({
                length: filesToAnalyzeLength,
                start: 0,
                title: 'Read the files to check for parameters'
            });
            for (let i = 0; i < filesToWatch.length; i++) {
                uiUtils.progress(i + 1);
                const element = filesToWatch[i];
                if (file_utils_1.FileUtils.checkIfFolderExists(element)) {
                    const data = yield file_utils_1.FileUtils.readFile(element);
                    const variablesArray = (data.match(variableRegex) || []);
                    if (variablesArray.length > 0) {
                        const startArray = [];
                        const variablesForFile = variablesArray
                            .reduce((agg, curr) => (agg.indexOf(curr) > -1 ? agg : [...agg, curr]), startArray)
                            .map((x) => x.substr(1, x.length - 2));
                        for (let j = 0; j < variablesForFile.length; j++) {
                            const variable = variablesForFile[j];
                            if (!variablesPerFiles[variable]) {
                                variablesPerFiles[variable] = [];
                            }
                            variablesPerFiles[variable].push(element);
                        }
                    }
                }
            }
            uiUtils.stoprProgress();
            databaseObject._parameters = variablesPerFiles;
            databaseObject._properties.path = path;
            return databaseObject;
        });
    }
    static checkParams(params, uiUtils) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!params.environment) {
                uiUtils.warning({ origin: DatabaseRepositoryReader._origin, message: 'No environment provided, the check will be ran for local' });
                params.environment = 'local';
            }
            // get the database parameters
            file_utils_1.FileUtils.createFolderStructureIfNeeded(database_helper_1.DatabaseHelper.tempFolderPath);
            let fileDataDatabaseObject = {};
            if (file_utils_1.FileUtils.checkIfFolderExists(database_helper_1.DatabaseHelper.postgresDbDataPath)) {
                fileDataDatabaseObject = yield file_utils_1.FileUtils.readJsonFile(database_helper_1.DatabaseHelper.postgresDbDataPath);
            }
            let databasesToCheck = Object.keys(fileDataDatabaseObject);
            // filter them if needed
            if (params.filter) {
                databasesToCheck = databasesToCheck.filter(x => x.indexOf(params.filter) > -1);
            }
            // get the parameters to set
            let databaseParams = [];
            for (let i = 0; i < databasesToCheck.length; i++) {
                const database = databasesToCheck[i];
                databaseParams = databaseParams.concat(Object.keys((fileDataDatabaseObject[database]._parameters || {})).map(x => ({
                    databaseName: database,
                    paramName: x
                })));
            }
            if (databaseParams.length === 0) {
                throw 'No database parameters detected';
            }
            // read the current db file and add on
            file_utils_1.FileUtils.createFolderStructureIfNeeded(database_helper_1.DatabaseHelper.tempFolderPath);
            let databaseParametersFromDb = {};
            if (file_utils_1.FileUtils.checkIfFolderExists(database_helper_1.DatabaseHelper.postgresDbParamsPath)) {
                databaseParametersFromDb = yield file_utils_1.FileUtils.readJsonFile(database_helper_1.DatabaseHelper.postgresDbParamsPath);
            }
            // loop through all of them, and ask to set or update
            for (let i = 0; i < databaseParams.length; i++) {
                const element = databaseParams[i];
                let value = '';
                if (databaseParametersFromDb &&
                    databaseParametersFromDb[element.databaseName] &&
                    databaseParametersFromDb[element.databaseName][params.environment] &&
                    databaseParametersFromDb[element.databaseName][params.environment][element.paramName]) {
                    value = databaseParametersFromDb[element.databaseName][params.environment][element.paramName];
                }
                const paramValue = yield uiUtils.question({
                    origin: DatabaseRepositoryReader._origin,
                    text: `Please enter the value for ${colors_1.default.yellow(params.environment)} - ${colors_1.default.green(element.databaseName)} - ${colors_1.default.cyan(element.paramName)} ${value ? `(current : "${value}") ` : ''}:`
                });
                if (paramValue) {
                    if (!databaseParametersFromDb[element.databaseName]) {
                        databaseParametersFromDb[element.databaseName] = {};
                    }
                    if (!databaseParametersFromDb[element.databaseName][params.environment]) {
                        databaseParametersFromDb[element.databaseName][params.environment] = {};
                    }
                    databaseParametersFromDb[element.databaseName][params.environment][element.paramName] = paramValue;
                }
                else {
                    uiUtils.info({ origin: DatabaseRepositoryReader._origin, message: 'No value provided => value not changed' });
                }
            }
            uiUtils.info({ origin: DatabaseRepositoryReader._origin, message: `Saving data in postgres params db file` });
            file_utils_1.FileUtils.writeFileSync(database_helper_1.DatabaseHelper.postgresDbParamsPath, JSON.stringify(databaseParametersFromDb, null, 2));
        });
    }
    static analyzeDataFile(params, uiUtils) {
        uiUtils.info({ origin: this._origin, message: `Analyzing data file.` });
    }
}
exports.DatabaseRepositoryReader = DatabaseRepositoryReader;
DatabaseRepositoryReader._origin = 'DatabaseRepositoryReader';

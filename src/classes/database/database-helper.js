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
exports.DatabaseHelper = void 0;
const path_1 = __importDefault(require("path"));
const file_utils_1 = require("../../utils/file.utils");
class DatabaseHelper {
    static getApplicationDatabaseObject(applicationName) {
        return __awaiter(this, void 0, void 0, function* () {
            file_utils_1.FileUtils.createFolderStructureIfNeeded(DatabaseHelper.tempFolderPath);
            let fileData = {};
            if (file_utils_1.FileUtils.checkIfFolderExists(DatabaseHelper.postgresDbDataPath)) {
                fileData = yield file_utils_1.FileUtils.readJsonFile(DatabaseHelper.postgresDbDataPath);
            }
            let toReturn;
            if (applicationName.match(/-database$/i)) {
                toReturn = fileData[applicationName];
            }
            else {
                // we might be trying to get the database from its suffix
                // let's map the db to those, and check if ours exists
                const databaseMapping = Object.keys(fileData)
                    .reduce((agg, curr) => {
                    if (fileData[curr]._properties && fileData[curr]._properties.dbName) {
                        agg[fileData[curr]._properties.dbName] = curr;
                    }
                    return agg;
                }, {});
                toReturn = fileData[databaseMapping[applicationName]];
            }
            if (toReturn) {
                return toReturn;
            }
            throw 'This application does not exist';
        });
    }
    static getDatabaseSubObject(params, databaseObject, origin, uiUtils) {
        return __awaiter(this, void 0, void 0, function* () {
            let databaseSubObject = null;
            if (params.objectType) {
                if (!databaseObject[params.objectType]) {
                    uiUtils.warning({
                        origin,
                        message: `invalid object type. The search for this object will be ran on all objects`
                    });
                }
                else {
                    databaseSubObject = databaseObject[params.objectType][params.objectName];
                }
            }
            else {
                uiUtils.warning({
                    origin,
                    message: `No type provided. Next time please pass the object type with the --type (-y) option fo the search to go quicker.`
                });
            }
            if (!databaseSubObject) {
                // we will here loop through the objects, and try to find it with full name first
                const objectKeys = Object.keys(databaseObject);
                const partials = [];
                for (let i = 0; i < objectKeys.length && !databaseSubObject; i++) {
                    const objectKey = objectKeys[i];
                    const typeKeys = Object.keys(databaseObject[objectKey]);
                    for (let j = 0; j < typeKeys.length && !databaseSubObject; j++) {
                        const typeKey = typeKeys[j];
                        if (typeKey === params.objectName) {
                            params.objectType = objectKey;
                            databaseSubObject = databaseObject[params.objectType][params.objectName];
                        }
                        else if (typeKey.indexOf(params.objectName) > -1) {
                            partials.push({
                                name: typeKey,
                                type: objectKey
                            });
                        }
                    }
                }
                if (!databaseSubObject) {
                    if (partials.length > 15) {
                        uiUtils.error({
                            origin,
                            message: `More than 15 objects were found with those parameters, please narrow done the name and retry.`
                        });
                        throw '';
                    }
                    else if (partials.length > 1) {
                        const choice = yield uiUtils.choices({
                            title: 'Objects Found',
                            message: `${partials.length} objects were found containing this name. which one do you want to edit?`,
                            choices: partials.map(x => `${x.type} - ${x.name}`)
                        });
                        const [type, name] = choice['Objects Found'].split(' - ');
                        params.objectType = type;
                        params.objectName = name;
                        databaseSubObject = databaseObject[params.objectType][params.objectName];
                    }
                    else if (partials.length === 1) {
                        params.objectType = partials[0].type;
                        params.objectName = partials[0].name;
                        databaseSubObject = databaseObject[params.objectType][params.objectName];
                    }
                }
            }
            if (!databaseSubObject) {
                throw 'This object does not exist';
            }
            return databaseSubObject;
        });
    }
    static getApplicationDatabaseObjects() {
        return __awaiter(this, void 0, void 0, function* () {
            file_utils_1.FileUtils.createFolderStructureIfNeeded(DatabaseHelper.tempFolderPath);
            let fileData = {};
            if (file_utils_1.FileUtils.checkIfFolderExists(DatabaseHelper.postgresDbDataPath)) {
                fileData = yield file_utils_1.FileUtils.readJsonFile(DatabaseHelper.postgresDbDataPath);
            }
            return fileData;
        });
    }
    static getApplicationDatabaseParameters(applicationName) {
        return __awaiter(this, void 0, void 0, function* () {
            file_utils_1.FileUtils.createFolderStructureIfNeeded(DatabaseHelper.tempFolderPath);
            let fileParameters = {};
            if (file_utils_1.FileUtils.checkIfFolderExists(DatabaseHelper.postgresDbParamsPath)) {
                fileParameters = yield file_utils_1.FileUtils.readJsonFile(DatabaseHelper.postgresDbParamsPath);
            }
            return fileParameters[applicationName];
        });
    }
    static getApplicationDatabaseFiles(applicationName) {
        return __awaiter(this, void 0, void 0, function* () {
            file_utils_1.FileUtils.createFolderStructureIfNeeded(DatabaseHelper.tempFolderPath);
            let fileData = {};
            if (file_utils_1.FileUtils.checkIfFolderExists(DatabaseHelper.postgresDbFilesPath)) {
                fileData = yield file_utils_1.FileUtils.readJsonFile(DatabaseHelper.postgresDbFilesPath);
            }
            return fileData[applicationName];
        });
    }
    static getApplicationDatabaseFile(applicationName, version) {
        return __awaiter(this, void 0, void 0, function* () {
            file_utils_1.FileUtils.createFolderStructureIfNeeded(DatabaseHelper.tempFolderPath);
            let fileData = {};
            if (file_utils_1.FileUtils.checkIfFolderExists(DatabaseHelper.postgresDbFilesPath)) {
                fileData = yield file_utils_1.FileUtils.readJsonFile(DatabaseHelper.postgresDbFilesPath);
            }
            if (fileData[applicationName]) {
                return fileData[applicationName].find(versionFile => versionFile.versionName === version);
            }
        });
    }
    static updateApplicationDatabaseObject(applicationName, data) {
        return __awaiter(this, void 0, void 0, function* () {
            file_utils_1.FileUtils.createFolderStructureIfNeeded(DatabaseHelper.tempFolderPath);
            let fileData = {};
            if (file_utils_1.FileUtils.checkIfFolderExists(DatabaseHelper.postgresDbDataPath)) {
                fileData = yield file_utils_1.FileUtils.readJsonFile(DatabaseHelper.postgresDbDataPath);
            }
            fileData[applicationName] = data;
            file_utils_1.FileUtils.writeFileSync(DatabaseHelper.postgresDbDataPath, JSON.stringify(fileData, null, 2));
        });
    }
    static updateApplicationDatabaseFiles(applicationName, data) {
        return __awaiter(this, void 0, void 0, function* () {
            file_utils_1.FileUtils.createFolderStructureIfNeeded(DatabaseHelper.tempFolderPath);
            let fileData = {};
            if (file_utils_1.FileUtils.checkIfFolderExists(DatabaseHelper.postgresDbFilesPath)) {
                fileData = yield file_utils_1.FileUtils.readJsonFile(DatabaseHelper.postgresDbFilesPath);
            }
            fileData[applicationName] = data;
            file_utils_1.FileUtils.writeFileSync(DatabaseHelper.postgresDbFilesPath, JSON.stringify(fileData, null, 2));
        });
    }
    static updateApplicationDatabaseParameters(applicationName, data) {
        return __awaiter(this, void 0, void 0, function* () {
            file_utils_1.FileUtils.createFolderStructureIfNeeded(DatabaseHelper.tempFolderPath);
            let fileData = {};
            if (file_utils_1.FileUtils.checkIfFolderExists(DatabaseHelper.postgresDbParamsPath)) {
                fileData = yield file_utils_1.FileUtils.readJsonFile(DatabaseHelper.postgresDbParamsPath);
            }
            fileData[applicationName] = data;
            file_utils_1.FileUtils.writeFileSync(DatabaseHelper.postgresDbParamsPath, JSON.stringify(fileData, null, 2));
        });
    }
}
exports.DatabaseHelper = DatabaseHelper;
DatabaseHelper.dbTemplatesFolder = path_1.default.resolve(process.argv[1], '../../data/db/templates');
DatabaseHelper.dbFolderStructureFolder = path_1.default.resolve(process.argv[1], '../../data/db/database-structure');
DatabaseHelper.tempFolderPath = path_1.default.resolve(process.argv[1], '../../../temp');
DatabaseHelper.postgresDbFilesPath = DatabaseHelper.tempFolderPath + '/postgres-dbs.json';
DatabaseHelper.postgresDbParamsPath = DatabaseHelper.tempFolderPath + '/postgres-db-params.json';
DatabaseHelper.postgresDbDataPath = DatabaseHelper.tempFolderPath + '/postgres-db-data.json';
DatabaseHelper.releasesPath = 'postgres/release';

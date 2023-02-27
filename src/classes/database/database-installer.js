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
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseInstaller = void 0;
const file_utils_1 = require("../../utils/file.utils");
const postgres_utils_1 = require("../../utils/postgres.utils");
const repository_utils_1 = require("../../utils/repository.utils");
const database_helper_1 = require("./database-helper");
class DatabaseInstaller {
    static installDatabase(params, uiUtils) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!params.environment) {
                uiUtils.warning({ origin: this._origin, message: 'No environment provided, the installation will be ran for local' });
                params.environment = 'local';
            }
            yield repository_utils_1.RepositoryUtils.checkOrGetApplicationName(params, 'database', uiUtils);
            yield repository_utils_1.RepositoryUtils.readRepository({
                type: "postgres"
            }, uiUtils);
            // get the db as object to get the params
            let databaseObject = yield database_helper_1.DatabaseHelper.getApplicationDatabaseObject(params.applicationName);
            // get the application and its versions
            let databaseData = yield database_helper_1.DatabaseHelper.getApplicationDatabaseFiles(params.applicationName);
            if (!databaseData || !databaseObject) {
                throw 'Invalid application name. Please run the "am repo read" command in the desired folder beforehand.';
            }
            // await DatabaseRepositoryReader.readRepo(params.applicationName, databaseObject._properties.path, uiUtils);
            // get the application parameters
            const fileParameters = yield database_helper_1.DatabaseHelper.getApplicationDatabaseParameters(params.applicationName);
            if (!fileParameters[params.environment] || !fileParameters[params.environment].password_root || fileParameters[params.environment].server) {
                while (!fileParameters[params.environment].password_root) {
                    fileParameters[params.environment].password_root = yield uiUtils.question({
                        origin: DatabaseInstaller._origin,
                        text: 'Please provide the root password'
                    });
                }
                while (!fileParameters[params.environment].server) {
                    fileParameters[params.environment].server = yield uiUtils.question({
                        origin: DatabaseInstaller._origin,
                        text: 'Please provide the server'
                    });
                }
                yield database_helper_1.DatabaseHelper.updateApplicationDatabaseParameters(params.applicationName, fileParameters);
            }
            // we get the database objects again after we read the repo
            // get the db as object to get the params
            databaseObject = yield database_helper_1.DatabaseHelper.getApplicationDatabaseObject(params.applicationName);
            // get the application and its versions
            databaseData = yield database_helper_1.DatabaseHelper.getApplicationDatabaseFiles(params.applicationName);
            let versionsToInstall = [];
            if (params.version) {
                const databaseVersion = databaseData.find(x => x.versionName === params.version);
                if (databaseVersion) {
                    versionsToInstall.push(databaseVersion);
                }
            }
            else if (['dev', 'demo', 'prod'].includes(params.environment)) {
                const confirmed = yield uiUtils.choices({
                    message: 'You are probably about to drop and recreate the database you are working with. Is it something you are ok about ?',
                    choices: [
                        'Yes',
                        'Wait...'
                    ],
                    title: 'check'
                });
                if (confirmed['check'] === 'Yes') {
                    const confirmed = yield uiUtils.choices({
                        message: 'You really sure ?',
                        choices: [
                            'Yes',
                            'No'
                        ],
                        title: 'check2'
                    });
                    if (confirmed['check2'] === 'Yes') {
                        versionsToInstall = databaseData;
                    }
                    else {
                        throw 'ok';
                    }
                }
                else {
                    throw 'ok';
                }
            }
            else {
                versionsToInstall = databaseData;
            }
            if (!versionsToInstall[0]) {
                throw 'Invalid version name. Please run the "am repo read" again if this version is missing.';
            }
            let paramsPerFile = {};
            if (databaseObject && databaseObject._parameters) {
                for (let i = 0; i < Object.keys(databaseObject._parameters).length; i++) {
                    const parameterName = Object.keys(databaseObject._parameters)[i];
                    for (let j = 0; j < databaseObject._parameters[parameterName].length; j++) {
                        const fileName = databaseObject._parameters[parameterName][j];
                        if (!paramsPerFile[fileName]) {
                            paramsPerFile[fileName] = [];
                        }
                        let parameterValue = '';
                        if (fileParameters && fileParameters[params.environment]) {
                            parameterValue = fileParameters[params.environment][parameterName];
                        }
                        paramsPerFile[fileName].push({
                            paramName: parameterName,
                            value: parameterValue
                        });
                    }
                }
            }
            // todo check we have all the params
            // todo check we have the root password
            uiUtils.info({ origin: this._origin, message: `Found ${versionsToInstall.length} versions to install` });
            const postgresUtils = new postgres_utils_1.PostgresUtils();
            let carryOn = true;
            versionsToInstall.sort((a, b) => {
                if (a.versionName === 'current') {
                    return 1;
                }
                else if (b.versionName === 'current') {
                    return -1;
                }
                const countA = a.versionName.split('.').reverse().reduce((agg, x, i) => agg + +x * Math.pow(100, i), 0);
                const countB = b.versionName.split('.').reverse().reduce((agg, x, i) => agg + +x * Math.pow(100, i), 0);
                return countA - countB;
            });
            try {
                for (let i = 0; i < versionsToInstall.length && carryOn; i++) {
                    const version = versionsToInstall[i];
                    for (let j = 0; j < version.versions.length && carryOn; j++) {
                        uiUtils.info({
                            origin: this._origin,
                            message: `Installing ${params.applicationName} ${version.versionName}${version.versions.length > 1 ? ` (${j + 1} of ${version.versions.length})` : ''}`
                        });
                        const subVersion = version.versions[j];
                        if (subVersion.databaseToUse === 'postgres') {
                            postgresUtils.setConnectionString(`postgres://root:${fileParameters[params.environment].password_root}@${fileParameters[params.environment].server || 'localhost'}:5432/postgres`, uiUtils);
                        }
                        else {
                            postgresUtils.setConnectionString(`postgres://root:${fileParameters[params.environment].password_root}@${fileParameters[params.environment].server || 'localhost'}:5432/${params.environment}_${databaseObject._properties.dbName}`, uiUtils);
                        }
                        uiUtils.startProgress({ length: subVersion.files.length, start: 0, title: `${params.applicationName} - ${version.versionName}` });
                        for (let k = 0; k < subVersion.files.length && carryOn; k++) {
                            const file = subVersion.files[k];
                            let fileString = yield file_utils_1.FileUtils.readFile(file.fileName);
                            if (paramsPerFile[file.fileName]) {
                                for (let l = 0; l < paramsPerFile[file.fileName].length; l++) {
                                    const parameter = paramsPerFile[file.fileName][l];
                                    const paramRegex = new RegExp(`\<${parameter.paramName}\>`, 'gi');
                                    fileString = fileString.replace(paramRegex, parameter.value);
                                }
                            }
                            try {
                                if (!fileString) {
                                    uiUtils.warning({
                                        origin: this._origin,
                                        message: `File "${fileString}" is empty - ignoring`
                                    });
                                }
                                else {
                                    yield postgresUtils.execute(fileString);
                                }
                            }
                            catch (error) {
                                uiUtils.stoprProgress();
                                uiUtils.error({ origin: this._origin, message: fileString });
                                uiUtils.error({ origin: this._origin, message: `Error on file ${file.fileName}` });
                                file_utils_1.FileUtils.openFileInFileEditor(file.fileName);
                                let text = 'There has been an issue with this file.\n';
                                text += 'Press "Enter" to retry this file\n';
                                text += 'Use "r" to restart the whole installation\n';
                                text += 'Use "s" to stop\n';
                                console.log(error);
                                const response = yield uiUtils.question({
                                    origin: this._origin,
                                    text: text
                                });
                                switch (response.toLowerCase()) {
                                    case 'r':
                                        carryOn = false;
                                        yield this.installDatabase(params, uiUtils);
                                        break;
                                    case '':
                                        k = k - 1;
                                        uiUtils.startProgress({ length: subVersion.files.length, start: k + 1, title: `${params.applicationName} - ${version.versionName}` });
                                        break;
                                    case 's':
                                    default:
                                        carryOn = false;
                                        break;
                                }
                            }
                            uiUtils.progress(k + 1);
                        }
                        uiUtils.stoprProgress();
                    }
                }
            }
            catch (error) {
                uiUtils.error({ origin: this._origin, message: error.toString() });
                postgresUtils.endAllConnections();
                process.exit(1);
            }
            finally {
                postgresUtils.endAllConnections();
            }
        });
    }
}
exports.DatabaseInstaller = DatabaseInstaller;
DatabaseInstaller._origin = 'DatabaseInstaller';

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
exports.DatabaseVersionChecker = void 0;
const database_helper_1 = require("./database-helper");
const repository_utils_1 = require("../../utils/repository.utils");
const file_utils_1 = require("../../utils/file.utils");
const path_1 = __importDefault(require("path"));
class DatabaseVersionChecker {
    static checkVersion(params, uiUtils) {
        return __awaiter(this, void 0, void 0, function* () {
            yield repository_utils_1.RepositoryUtils.checkOrGetApplicationName(params, 'database', uiUtils);
            const databaseObject = yield database_helper_1.DatabaseHelper.getApplicationDatabaseObject(params.applicationName);
            const databaseFiles = yield database_helper_1.DatabaseHelper.getApplicationDatabaseFiles(params.applicationName);
            if (!databaseObject || !databaseFiles) {
                throw 'Invalid application name';
            }
            if (params.version) {
                if (databaseObject._versions.indexOf(params.version) === -1) {
                    throw 'Invalid version';
                }
            }
            else {
                params.version = databaseObject._versions[databaseObject._versions.length - 1];
            }
            uiUtils.info({ message: `Checking tables for ${params.version}`, origin: this._origin });
            // we check if we have an alter table in the list of files
            // then check if we have the table script
            const scriptNames = Object.keys(databaseObject.script)
                .map(key => databaseObject.script[key])
                .filter(script => script.latestVersion === params.version)
                .map(script => script.latestFile);
            const modifiedTables = [];
            // we read the version's table folder
            const tableList = yield file_utils_1.FileUtils.getFileList({
                startPath: path_1.default.resolve(databaseObject._properties.path, 'postgres', 'release', params.version, 'schema', '03-tables'),
                filter: /\.sql/
            });
            const tableNamesFromtableScripts = tableList
                .map(table => table.split('/')[table.split('/').length - 1].split('.')[0]);
            for (let i = 0; i < scriptNames.length; i++) {
                const scriptName = scriptNames[i];
                const file = yield file_utils_1.FileUtils.readFile(scriptName);
                const alterTableRegExp = /alter\s+table\s+(?!if\s+exists\s+)?(?!only\s+)?(?!public\.)?\"?([a-z0-9_]+)\"?/gmi;
                let regexpResult = alterTableRegExp.exec(file);
                while (regexpResult && regexpResult[1]) {
                    if (modifiedTables.indexOf(regexpResult[1]) === -1) {
                        modifiedTables.push(regexpResult[1]);
                    }
                    regexpResult = alterTableRegExp.exec(file);
                }
            }
            if (modifiedTables.length > 0) {
                // we check if we have missing table
                const missingTableScripts = modifiedTables
                    .filter(table => tableNamesFromtableScripts.indexOf(table) === -1);
                if (missingTableScripts.length > 0) {
                    uiUtils.error({ message: `Missing table scripts for : ${missingTableScripts.join(', ')}`, origin: this._origin });
                }
            }
            if (tableNamesFromtableScripts.length > 0) {
                // if we have the table script, we check if we have the alter table
                const missingAlterScripts = tableNamesFromtableScripts
                    .filter(table => databaseObject.table[table] &&
                    databaseObject.table[table].latestVersion !== params.version)
                    .filter(table => modifiedTables.indexOf(table) === -1);
                if (missingAlterScripts.length > 0) {
                    uiUtils.error({ message: `Missing alter table scripts for : ${missingAlterScripts.join(', ')}`, origin: this._origin });
                }
            }
        });
    }
}
exports.DatabaseVersionChecker = DatabaseVersionChecker;
DatabaseVersionChecker._origin = 'DatabaseVersionChecker';

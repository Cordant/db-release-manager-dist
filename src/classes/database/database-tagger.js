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
exports.DatabaseTagger = exports.fieldSettingsRegex = void 0;
const file_utils_1 = require("../../utils/file.utils");
const database_helper_1 = require("./database-helper");
const database_repo_reader_1 = require("./database-repo-reader");
const repository_utils_1 = require("../../utils/repository.utils");
// const fieldSettingsRegex = '+([^(),]+\\([^,]\\)|[^(),]+)([^(),]+\\([^()]+\\)[^(),]?)?[^(),\\/*]+(\\/\\*[^\\/*]+\\*\\/)?)[,)]';
exports.fieldSettingsRegex = '+([^(),]+\\([^,]\\)|[^(),]+)(\\([^()]+\\))?[^(),\\/*]*(\\/\\*[^\\/*]+\\*\\/)?)[,)]';
class DatabaseTagger {
    static addTagOnTable(params, uiUtils) {
        return __awaiter(this, void 0, void 0, function* () {
            uiUtils.info({ origin: this._origin, message: `Getting ready to edit object.` });
            yield repository_utils_1.RepositoryUtils.checkOrGetApplicationName(params, 'database', uiUtils);
            const databaseObject = yield database_helper_1.DatabaseHelper.getApplicationDatabaseObject(params.applicationName);
            const databaseSubObject = yield database_helper_1.DatabaseHelper.getDatabaseSubObject(Object.assign(Object.assign({}, params), { objectType: 'table' }), databaseObject, DatabaseTagger._origin, uiUtils);
            let fileString = yield file_utils_1.FileUtils.readFile(databaseSubObject.latestFile);
            if (/\/\*[^*\/]+\*\/[^"]*TABLE/im.test(fileString)) {
                // in that case, we already have tags
                if (!new RegExp(`#${params.tagName}[^"]*TABLE`).test(fileString)) {
                    // but we don't have the one we're looking for
                    fileString = fileString.replace(/\/\*([^*\/]+)\*\//im, `/*$1 #${params.tagName}${params.tagValue ? '=' + params.tagValue : ''} */`);
                }
                else if (params.tagValue) {
                    // we the replace what we have to replace
                    fileString = fileString.replace(new RegExp(`#${params.tagName}[^#]+ ?([\#\*])`), `#${params.tagName}=${params.tagValue} $1`);
                }
                else if (new RegExp(`#${params.tagName}=[^"]*TABLE`).test(fileString)) {
                    // we had a value, we don't have one anymore
                    fileString = fileString.replace(new RegExp(`#${params.tagName}[^#\*]+ ?([\#\*])`), `#${params.tagName} $1`);
                }
            }
            else {
                fileString = `/* #${params.tagName}${params.tagValue ? '=' + params.tagValue : ''} */\n` + fileString;
            }
            file_utils_1.FileUtils.writeFileSync(databaseSubObject.latestFile, fileString);
            yield database_repo_reader_1.DatabaseRepositoryReader.readRepo(databaseObject._properties.path, params.applicationName, uiUtils);
        });
    }
    static removeTagFromTable(params, uiUtils) {
        return __awaiter(this, void 0, void 0, function* () {
            uiUtils.info({ origin: this._origin, message: `Getting ready to edit object.` });
            yield repository_utils_1.RepositoryUtils.checkOrGetApplicationName(params, 'database', uiUtils);
            const databaseObject = yield database_helper_1.DatabaseHelper.getApplicationDatabaseObject(params.applicationName);
            const databaseSubObject = yield database_helper_1.DatabaseHelper.getDatabaseSubObject(Object.assign(Object.assign({}, params), { objectType: 'table' }), databaseObject, DatabaseTagger._origin, uiUtils);
            let fileString = yield file_utils_1.FileUtils.readFile(databaseSubObject.latestFile);
            if (/\/\*[^*\/]+\*\/[^"]*TABLE/im.test(fileString)) {
                // in that case, we already have tags
                if (new RegExp(`#${params.tagName}[^"]*TABLE`, 'i').test(fileString)) {
                    fileString = fileString.replace(new RegExp(`#${params.tagName}[^#\*]+ ?([\#\*])`), `$1`);
                }
            }
            file_utils_1.FileUtils.writeFileSync(databaseSubObject.latestFile, fileString);
            yield database_repo_reader_1.DatabaseRepositoryReader.readRepo(databaseObject._properties.path, params.applicationName, uiUtils);
        });
    }
    static addTagOnField(params, uiUtils) {
        return __awaiter(this, void 0, void 0, function* () {
            uiUtils.info({ origin: this._origin, message: `Getting ready to edit object.` });
            yield repository_utils_1.RepositoryUtils.checkOrGetApplicationName(params, 'database', uiUtils);
            const databaseObject = yield database_helper_1.DatabaseHelper.getApplicationDatabaseObject(params.applicationName);
            const databaseSubObject = yield database_helper_1.DatabaseHelper.getDatabaseSubObject(Object.assign(Object.assign({}, params), { objectType: 'table' }), databaseObject, DatabaseTagger._origin, uiUtils);
            let fileString = yield file_utils_1.FileUtils.readFile(databaseSubObject.latestFile);
            // look for our field's text
            const fieldRegexCaptured = new RegExp(`(${params.fieldName} ${exports.fieldSettingsRegex}`, 'i')
                .exec(fileString);
            if (fieldRegexCaptured && fieldRegexCaptured[1]) {
                const tagToPut = `#${params.tagName}${params.tagValue ? '=' + params.tagValue : ''}`;
                // we got our tield
                const fieldText = fieldRegexCaptured[1];
                const tags = fieldRegexCaptured[4];
                if (tags) {
                    if (!new RegExp(`#${params.tagName}[=\s]`, 'i').test(tags)) {
                        // but we don't have the one we're looking for
                        fileString = fileString.replace(fieldText, fieldText.replace(tags, tags.replace('*/', `${tagToPut} */`)));
                    }
                    else {
                        // we replace the tag
                        fileString = fileString.replace(fieldText, fieldText.replace(tags, tags.replace(new RegExp(`#${params.tagName}[^#]+ ?([\#\*])`), `${tagToPut} $1`)));
                    }
                }
                else {
                    // no tags
                    fileString = fileString.replace(fieldText, fieldText + ` /* ${tagToPut} */`);
                }
            }
            else {
                throw `Invalid field name (${params.fieldName})`;
            }
            file_utils_1.FileUtils.writeFileSync(databaseSubObject.latestFile, fileString);
            yield database_repo_reader_1.DatabaseRepositoryReader.readRepo(databaseObject._properties.path, params.applicationName, uiUtils);
        });
    }
    static removeTagFromField(params, uiUtils) {
        return __awaiter(this, void 0, void 0, function* () {
            uiUtils.info({ origin: this._origin, message: `Getting ready to edit object.` });
            yield repository_utils_1.RepositoryUtils.checkOrGetApplicationName(params, 'database', uiUtils);
            const databaseObject = yield database_helper_1.DatabaseHelper.getApplicationDatabaseObject(params.applicationName);
            const databaseSubObject = yield database_helper_1.DatabaseHelper.getDatabaseSubObject(Object.assign(Object.assign({}, params), { objectType: 'table' }), databaseObject, DatabaseTagger._origin, uiUtils);
            let fileString = yield file_utils_1.FileUtils.readFile(databaseSubObject.latestFile);
            // look for our field's text
            const fieldRegexCaptured = new RegExp(`(${params.fieldName} ${exports.fieldSettingsRegex}`, 'i')
                .exec(fileString);
            if (fieldRegexCaptured) {
                // we got our tield
                const fieldText = fieldRegexCaptured[1];
                const tags = fieldRegexCaptured[4];
                if (tags) {
                    // in that case, we already have tags
                    fileString = fileString.replace(fieldText, fieldText.replace(tags, tags.replace(new RegExp(`#${params.tagName}[^#]+ ?([\#\*])`), `$1`)));
                }
            }
            else {
                throw 'Invalid field name';
            }
            file_utils_1.FileUtils.writeFileSync(databaseSubObject.latestFile, fileString);
            yield database_repo_reader_1.DatabaseRepositoryReader.readRepo(databaseObject._properties.path, params.applicationName, uiUtils);
        });
    }
}
exports.DatabaseTagger = DatabaseTagger;
DatabaseTagger._origin = 'DatabaseTagger';

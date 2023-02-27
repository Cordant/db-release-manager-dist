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
exports.DatabaseTemplates = void 0;
const path_1 = __importDefault(require("path"));
const file_utils_1 = require("../../utils/file.utils");
const repository_utils_1 = require("../../utils/repository.utils");
const database_helper_1 = require("./database-helper");
const database_file_helper_1 = require("./database-file-helper");
const syntax_utils_1 = require("../../utils/syntax.utils");
class TemplateFileParams {
    constructor(params) {
        this.databaseObjectPath = '';
        this.fileName = '';
        this.fileString = '';
        this.subPath = '';
        this.templateFilePath = '';
        this.versionToChange = '';
        if (params) {
            this.databaseObjectPath = params.databaseObjectPath || this.databaseObjectPath;
            this.fileName = params.fileName || this.fileName;
            this.fileString = params.fileString || this.fileString;
            this.subPath = params.subPath || this.subPath;
            this.templateFilePath = params.templateFilePath || this.templateFilePath;
            this.versionToChange = params.versionToChange || this.versionToChange;
        }
    }
    update(params) {
        for (const key in params) {
            if (params.hasOwnProperty(key)) {
                this[key] = params[key];
            }
        }
    }
}
class DatabaseTemplates {
    /**
     * Function to copy a file to the database location
     */
    static _templateFileToWrite(params) {
        return __awaiter(this, void 0, void 0, function* () {
            let folderPath = path_1.default.resolve(params.databaseObjectPath, 'postgres', 'release', params.versionToChange, params.subPath);
            let fileString = params.fileString || (yield file_utils_1.FileUtils.readFile(params.templateFilePath));
            if (params.replacements) {
                for (let i = 0; i < params.replacements.length; i++) {
                    const replacement = params.replacements[i];
                    fileString = fileString.replace(new RegExp(`<${replacement.variableName}>`, 'g'), replacement.replaceWith);
                }
            }
            file_utils_1.FileUtils.writeFileSync(path_1.default.resolve(folderPath, params.fileName), fileString);
            return ['../', 'postgres', 'release', params.versionToChange, params.subPath, params.fileName].join('/');
        });
    }
    static addTemplate(params, uiUtils) {
        return __awaiter(this, void 0, void 0, function* () {
            uiUtils.info({ origin: this._origin, message: `Getting ready to create template.` });
            yield repository_utils_1.RepositoryUtils.checkOrGetApplicationName(params, 'database', uiUtils);
            const databaseObject = yield database_helper_1.DatabaseHelper.getApplicationDatabaseObject(params.applicationName);
            if (!databaseObject) {
                throw 'This application does not exist';
            }
            const databaseVersionFiles = yield database_helper_1.DatabaseHelper.getApplicationDatabaseFiles(params.applicationName);
            const versionToChange = yield database_file_helper_1.DatabaseFileHelper.getVersionToChange(params, databaseVersionFiles, uiUtils);
            const templateFiles = [];
            const templateFileParams = new TemplateFileParams({
                databaseObjectPath: databaseObject._properties.path,
                versionToChange: versionToChange
            });
            switch (params.template) {
                case 'lookup':
                    if (databaseObject.table[databaseObject._properties.dbName + 't_lookup_lkp'] || databaseObject.table[databaseObject._properties.dbName + 't_lookup_type_lty']) {
                        throw 'This application already has lookup tables';
                    }
                    // lookup type table
                    templateFileParams.update({
                        replacements: [{
                                variableName: 'db_name',
                                replaceWith: databaseObject._properties.dbName
                            }],
                        fileName: `${databaseObject._properties.dbName}t_lookup_type_lty.sql`,
                        templateFilePath: path_1.default.resolve(process.argv[1], database_helper_1.DatabaseHelper.dbTemplatesFolder, 'lookup', `lookup_type.sql`),
                        subPath: 'schema/03-tables'
                    });
                    templateFiles.push(yield this._templateFileToWrite(templateFileParams));
                    // lookup table
                    templateFileParams.update({
                        fileName: `${databaseObject._properties.dbName}t_lookup_lkp.sql`,
                        templateFilePath: path_1.default.resolve(process.argv[1], database_helper_1.DatabaseHelper.dbTemplatesFolder, 'lookup', `lookup.sql`)
                    });
                    templateFiles.push(yield this._templateFileToWrite(templateFileParams));
                    // get lookups function
                    templateFileParams.update({
                        fileName: `${databaseObject._properties.dbName}f_get_lookups.sql`,
                        templateFilePath: path_1.default.resolve(process.argv[1], database_helper_1.DatabaseHelper.dbTemplatesFolder, 'lookup', `get_lookups.sql`),
                        subPath: 'schema/07-functions/lookups'
                    });
                    templateFiles.push(yield this._templateFileToWrite(templateFileParams));
                    break;
                case 'version':
                    if (databaseObject.table[databaseObject._properties.dbName + 't_version_ver']) {
                        throw 'This application already has version table';
                    }
                    // version table
                    templateFileParams.update({
                        replacements: [{
                                variableName: 'db_name',
                                replaceWith: databaseObject._properties.dbName
                            }],
                        fileName: `${databaseObject._properties.dbName}t_version_ver.sql`,
                        templateFilePath: path_1.default.resolve(process.argv[1], database_helper_1.DatabaseHelper.dbTemplatesFolder, 'version', `version_table.sql`),
                        subPath: 'schema/03-tables',
                    });
                    templateFiles.push(yield this._templateFileToWrite(templateFileParams));
                    // get versions function
                    templateFileParams.update({
                        fileName: `${databaseObject._properties.dbName}f_get_versions.sql`,
                        templateFilePath: path_1.default.resolve(process.argv[1], database_helper_1.DatabaseHelper.dbTemplatesFolder, 'version', `get_versions.sql`),
                        subPath: 'schema/07-functions/version',
                    });
                    templateFiles.push(yield this._templateFileToWrite(templateFileParams));
                    // version data
                    templateFileParams.update({
                        fileName: `00-version.sql`,
                        templateFilePath: path_1.default.resolve(process.argv[1], database_helper_1.DatabaseHelper.dbTemplatesFolder, 'version', `version_data.sql`),
                        subPath: 'schema/09-data',
                    });
                    templateFiles.push(yield this._templateFileToWrite(templateFileParams));
                    break;
                default:
                    throw 'Unknown template';
            }
            if (templateFiles.length) {
                yield database_file_helper_1.DatabaseFileHelper.updateVersionFile(databaseObject._properties.path, versionToChange, templateFiles, params.applicationName, uiUtils);
            }
            return true;
        });
    }
    static setUpReplications(params, uiUtils) {
        return __awaiter(this, void 0, void 0, function* () {
            uiUtils.info({ origin: this._origin, message: `Getting ready to set up replications.` });
            yield repository_utils_1.RepositoryUtils.checkOrGetApplicationName(params, 'database', uiUtils);
            const databaseObject = yield database_helper_1.DatabaseHelper.getApplicationDatabaseObject(params.applicationName);
            if (!databaseObject) {
                throw 'This application does not exist';
            }
            const databaseVersionFiles = yield database_helper_1.DatabaseHelper.getApplicationDatabaseFiles(params.applicationName);
            const versionToChange = yield database_file_helper_1.DatabaseFileHelper.getVersionToChange(params, databaseVersionFiles, uiUtils);
            const templateFiles = [];
            const templateFileParams = new TemplateFileParams({
                databaseObjectPath: databaseObject._properties.path,
                versionToChange: versionToChange
            });
            if (params.fromOrTo === 'from') {
                params.tableName = yield database_file_helper_1.DatabaseFileHelper.getObjectName(params.tableName, 'table', databaseObject, uiUtils);
                const table = databaseObject.table[params.tableName];
                if (databaseObject.trigger[`${databaseObject._properties.dbName}ts_${table.tableSuffix}_replications`]) {
                    throw 'This table seems to already be set up for replications';
                }
                const templateFiles = [];
                const tableFields = Object.keys(table.fields)
                    .filter(fieldName => fieldName !== 'created_by' &&
                    fieldName !== 'created_at' &&
                    fieldName !== 'modified_by' &&
                    fieldName !== 'modified_at' &&
                    !fieldName.match(new RegExp(`pk_${table.tableSuffix}_id`)));
                // replication function
                templateFileParams.update({
                    subPath: 'schema/07-functions/replications',
                    fileName: `${databaseObject._properties.dbName}f_${table.tableSuffix}_trigger_replication.sql`,
                    templateFilePath: path_1.default.resolve(process.argv[1], database_helper_1.DatabaseHelper.dbTemplatesFolder, 'replications', 'from', `replication_function.sql`),
                    replacements: [
                        { variableName: 'table_name', replaceWith: params.tableName },
                        { variableName: 'db_name', replaceWith: databaseObject._properties.dbName },
                        { variableName: 'table_suffix', replaceWith: table.tableSuffix },
                        { variableName: 'fields_equal_dollar', replaceWith: tableFields.map((field, i) => `${syntax_utils_1.indentation.repeat(12)}${field} = $${i + 6}`).join(',\r\n') },
                        { variableName: 'new_plus_field_name', replaceWith: tableFields.map((field, i) => `${syntax_utils_1.indentation.repeat(10)}NEW.${field}`).join(',\r\n') },
                        { variableName: 'field_names', replaceWith: tableFields.map((field, i) => `${syntax_utils_1.indentation.repeat(12)}${field}`).join(',\r\n') },
                        { variableName: 'dollars', replaceWith: tableFields.map((_field, i) => `${i + 6}`).join(',') }
                    ]
                });
                templateFiles.push(yield this._templateFileToWrite(templateFileParams));
                templateFileParams.update({
                    templateFilePath: path_1.default.resolve(process.argv[1], database_helper_1.DatabaseHelper.dbTemplatesFolder, 'replications', 'from', `trigger.sql`),
                    subPath: 'schema/08-triggers/replications',
                    fileName: `${databaseObject._properties.dbName}tr_${table.tableSuffix}_replication.sql`,
                    replacements: [
                        { variableName: 'table_name', replaceWith: params.tableName },
                        { variableName: 'db_name', replaceWith: databaseObject._properties.dbName },
                        { variableName: 'table_suffix', replaceWith: table.tableSuffix },
                    ]
                });
                templateFiles.push(yield this._templateFileToWrite(templateFileParams));
                if (templateFiles.length) {
                    yield database_file_helper_1.DatabaseFileHelper.updateVersionFile(databaseObject._properties.path, versionToChange, templateFiles, params.applicationName, uiUtils);
                }
            }
            else if (params.fromOrTo === 'to') {
                const sourceDatabaseObject = yield database_file_helper_1.DatabaseFileHelper._getDatabaseObject(params.sourceDatabase || '', uiUtils);
                params.tableName = yield database_file_helper_1.DatabaseFileHelper.getObjectName(params.tableName, 'table', sourceDatabaseObject, uiUtils);
                const hasReplication = !!sourceDatabaseObject.trigger[`${sourceDatabaseObject._properties.dbName}tr_${sourceDatabaseObject.table[params.tableName].tableSuffix}_replication`];
                if (!hasReplication) {
                    throw `This table is not yet duplicated. you can set it up by running "am db replication-from -o ${params.tableName}" on the source database.`;
                }
                // the table is available for replication, we will now create the duplication code
                // set up the extentions
                const file = Object.keys(databaseObject.setup).filter(x => x.indexOf('extension') > -1).map(x => databaseObject.setup[x])[0];
                // edit the extensions
                let needsPostgresFdw = false, needsDbLink = false;
                let fileString = file ? yield file_utils_1.FileUtils.readFile(file.latestFile) : '';
                if (!fileString.match(new RegExp(`postgres_fdw`, 'gim'))) {
                    needsPostgresFdw = true;
                }
                if (!fileString.match(new RegExp(`dblink`, 'gim'))) {
                    needsDbLink = true;
                }
                if (needsPostgresFdw || needsDbLink) {
                    let newFileString = `${needsPostgresFdw ? 'CREATE EXTENSION IF NOT EXISTS postgres_fdw;\r\n' : ''}`;
                    newFileString += `${needsDbLink ? 'CREATE EXTENSION IF NOT EXISTS dblink;\r\n' : ''}`;
                    fileString += '\r\n' + newFileString;
                    templateFileParams.update({
                        subPath: `schema/00-database-setup`,
                        fileName: (file || {}).name || 'extensions.sql',
                        fileString: fileString
                    });
                    yield this._templateFileToWrite(templateFileParams);
                    templateFileParams.update({
                        subPath: 'scripts'
                    });
                    templateFiles.push(yield this._templateFileToWrite(templateFileParams));
                }
                // set up the foreign server
                if (!databaseObject["foreign-servers"][sourceDatabaseObject._properties.dbName]) {
                    // create the server file
                    let fileString = yield file_utils_1.FileUtils.readFile(path_1.default.resolve(process.argv[1], database_helper_1.DatabaseHelper.dbTemplatesFolder, 'replications', 'to', `foreign_server.sql`));
                    fileString = fileString
                        .replace(/<target_db>/gi, databaseObject._properties.dbName)
                        .replace(/<source_db>/gi, sourceDatabaseObject._properties.dbName);
                    let folderPath = path_1.default.resolve(databaseObject._properties.path, 'postgres', 'release', versionToChange, 'schema', '02-external-systems', '00-replications', '00-foreign-servers');
                    let fileName = `${sourceDatabaseObject._properties.dbName}.sql`;
                    file_utils_1.FileUtils.writeFileSync(path_1.default.resolve(folderPath, fileName), fileString);
                    fileName = `foreign_server_${sourceDatabaseObject._properties.dbName}.sql`;
                    file_utils_1.FileUtils.writeFileSync(path_1.default.resolve(databaseObject._properties.path, 'postgres', 'release', versionToChange, 'scripts', fileName), fileString);
                    templateFiles.push(['../', 'postgres', 'release', versionToChange, 'scripts', fileName].join('/'));
                }
                // set up the user mapping
                if (!databaseObject["user-mappings"][sourceDatabaseObject._properties.dbName]) {
                    // create the user mapping file
                    let fileString = yield file_utils_1.FileUtils.readFile(path_1.default.resolve(process.argv[1], database_helper_1.DatabaseHelper.dbTemplatesFolder, 'replications', 'to', `user_mapping.sql`));
                    fileString = fileString
                        .replace(/<target_db>/gi, databaseObject._properties.dbName)
                        .replace(/<source_db>/gi, sourceDatabaseObject._properties.dbName);
                    let folderPath = path_1.default.resolve(databaseObject._properties.path, 'postgres', 'release', versionToChange, 'schema', '02-external-systems', '00-replications', '01-user-mappings');
                    let fileName = `${sourceDatabaseObject._properties.dbName}.sql`;
                    file_utils_1.FileUtils.writeFileSync(path_1.default.resolve(folderPath, fileName), fileString);
                    templateFiles.push(['../', 'postgres', 'release', versionToChange, 'schema', '02-external-systems', '00-replications', '01-user-mappings', `${sourceDatabaseObject._properties.dbName}.sql`].join('/'));
                }
                // set up the local table
                if (!databaseObject["local-tables"][params.tableName]) {
                    // create the local table file
                    let fileString = yield file_utils_1.FileUtils.readFile(sourceDatabaseObject.table[params.tableName].latestFile);
                    fileString = fileString
                        .replace(/serial\W+primary\W+key/gim, 'INTEGER NOT NULL UNIQUE');
                    let folderPath = path_1.default.resolve(databaseObject._properties.path, 'postgres', 'release', versionToChange, 'schema', '02-external-systems', '00-replications', '02-local-tables');
                    let fileName = `${params.tableName}.sql`;
                    file_utils_1.FileUtils.writeFileSync(path_1.default.resolve(folderPath, fileName), fileString);
                    templateFiles.push(['../', 'postgres', 'release', versionToChange, 'schema', '02-external-systems', '00-replications', '02-local-tables', `${params.tableName}.sql`].join('/'));
                }
                const foreignTableName = `${databaseObject._properties.dbName}_${params.tableName}`;
                // set up the user mapping
                if (!databaseObject["foreign-tables"][foreignTableName]) {
                    // create the foreign table file
                    let fileString = yield file_utils_1.FileUtils.readFile(path_1.default.resolve(process.argv[1], database_helper_1.DatabaseHelper.dbTemplatesFolder, 'replications', 'to', `foreign_table.sql`));
                    let currentFileString = yield file_utils_1.FileUtils.readFile(sourceDatabaseObject.table[params.tableName].latestFile);
                    currentFileString = currentFileString
                        .replace(params.tableName, foreignTableName)
                        .replace(/create\W+table/gi, 'CREATE FOREIGN TABLE')
                        .replace(/references\W+[a-z0-9_]+\W\([a-z0-9_]+\)/gi, '')
                        .replace(/serial\W+primary\W+key/gim, 'INTEGER NOT NULL UNIQUE');
                    fileString = fileString
                        .replace(/<target_db>/gi, databaseObject._properties.dbName)
                        .replace(/<source_db>/gi, sourceDatabaseObject._properties.dbName)
                        .replace(/<table_name>/gi, params.tableName)
                        .replace(/<table_code_on_foreign_server>/gi, currentFileString);
                    let folderPath = path_1.default.resolve(databaseObject._properties.path, 'postgres', 'release', versionToChange, 'schema', '02-external-systems', '00-replications', '03-foreign-tables');
                    let fileName = `${foreignTableName}.sql`;
                    file_utils_1.FileUtils.writeFileSync(path_1.default.resolve(folderPath, fileName), fileString);
                    templateFiles.push(['../', 'postgres', 'release', versionToChange, 'schema', '02-external-systems', '00-replications', '03-foreign-tables', `${foreignTableName}.sql`].join('/'));
                }
                // replicate the table
                fileString = `select dblink('${databaseObject._properties.dbName}_${sourceDatabaseObject._properties.dbName}', '
                DELETE FROM ${foreignTableName};
                INSERT INTO ${foreignTableName}(${Object.keys(sourceDatabaseObject.table[params.tableName].fields).map(field => field).join(',')})
                SELECT ${Object.keys(sourceDatabaseObject.table[params.tableName].fields).map(field => field).join(',')}
                FROM ${params.tableName};
            ')`;
                let folderPath = path_1.default.resolve(databaseObject._properties.path, 'postgres', 'release', versionToChange, 'scripts');
                let fileName = `${foreignTableName}_replication.sql`;
                file_utils_1.FileUtils.writeFileSync(path_1.default.resolve(folderPath, fileName), fileString);
                templateFiles.push(['../', 'postgres', 'release', versionToChange, 'scripts', `${databaseObject._properties.dbName}_${params.tableName}_replication.sql`].join('/'));
            }
            if (templateFiles.length) {
                yield database_file_helper_1.DatabaseFileHelper.updateVersionFile(databaseObject._properties.path, versionToChange, templateFiles, params.applicationName, uiUtils);
            }
            return true;
        });
    }
}
exports.DatabaseTemplates = DatabaseTemplates;
DatabaseTemplates._origin = 'DatabaseTemplates';

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
exports.DatabaseFileHelper = exports.fieldSettingsRegex = exports.indentationSpaces = exports.intentationSpaceNumber = void 0;
const database_file_model_1 = require("../../models/database-file.model");
const file_utils_1 = require("../../utils/file.utils");
const path_1 = __importDefault(require("path"));
const colors_1 = __importDefault(require("colors"));
const database_helper_1 = require("./database-helper");
const database_repo_reader_1 = require("./database-repo-reader");
const repository_utils_1 = require("../../utils/repository.utils");
const syntax_utils_1 = require("../../utils/syntax.utils");
exports.intentationSpaceNumber = 4;
exports.indentationSpaces = ' '.repeat(exports.intentationSpaceNumber);
// const fieldSettingsRegex = '+([^(),]+\\([^,]\\)|[^(),]+)([^(),]+\\([^()]+\\)[^(),]?)?[^(),\\/*]+(\\/\\*[^\\/*]+\\*\\/)?)[,)]';
exports.fieldSettingsRegex = '+([^(),]+\\([^,]\\)|[^(),]+)(\\([^()]+\\))?[^(),\\/*]*(\\/\\*[^\\/*]+\\*\\/)?)[,)]';
class DatabaseFileHelper {
    static getVersionToChange(params, databaseVersionFiles, uiUtils) {
        return __awaiter(this, void 0, void 0, function* () {
            const databaseVersionFile = databaseVersionFiles[databaseVersionFiles.length - 1];
            let versionToChange = params.version;
            if (params.version && databaseVersionFile.versionName !== params.version) {
                throw 'The version you provided is not the last version. Please check and try again.';
            }
            else {
                const lastVersion = databaseVersionFiles[databaseVersionFiles.length - 1];
                versionToChange = lastVersion.versionName;
                if (!lastVersion) {
                    throw 'No version found, please run init in the repo to initialize the DB code';
                }
                if (lastVersion.versionName !== 'current') {
                    let ok = false;
                    while (!ok) {
                        const response = yield uiUtils.question({ origin: this._origin, text: `The last version is not current (last version = ${versionToChange}). If you wish to amend this version, please use "y". If you want to create a new version (current folder), please use "c".` });
                        if (response === 'c') {
                            versionToChange = 'current';
                            ok = true;
                        }
                        else if (response === 'y') {
                            ok = true;
                        }
                        else {
                            uiUtils.warning({ origin: this._origin, message: 'Incorrect response' });
                        }
                    }
                }
            }
            return versionToChange;
        });
    }
    static getObjectName(objectName, objectType, databaseObject, uiUtils) {
        return __awaiter(this, void 0, void 0, function* () {
            if (objectName && databaseObject[objectType][objectName]) {
                return objectName;
            }
            let found = false;
            const tableNames = Object.keys(databaseObject[objectType]);
            while (!found) {
                // look for the tables
                const validTableNames = tableNames.filter(x => x.toLowerCase().indexOf((objectName || '').toLowerCase()) > -1);
                if (validTableNames.length === 1) {
                    found = true;
                    objectName = validTableNames[0];
                }
                else if (validTableNames.length === 0 || validTableNames.length > 9) {
                    objectName = yield uiUtils.question({ origin: this._origin, text: `No ${objectType} could be found with the provided name. Please type a valid name` });
                }
                else {
                    // more than one object => we show a list of choices
                    objectName = (yield uiUtils.choices({
                        message: 'More than one table returned with those parameters, please select the one you want',
                        choices: validTableNames,
                        title: 'Select table'
                    }))['Select table'];
                    found = true;
                }
            }
            return objectName || '';
        });
    }
    static _getDatabaseObject(dbName, uiUtils) {
        return __awaiter(this, void 0, void 0, function* () {
            const databaseObjects = yield database_helper_1.DatabaseHelper.getApplicationDatabaseObjects();
            if (databaseObjects[dbName]) {
                return databaseObjects[dbName];
            }
            let found = false;
            const dbNames = Object.keys(databaseObjects);
            while (!found) {
                // look for the tables
                const validTableNames = dbNames.filter(x => x.toLowerCase().indexOf(dbName.toLowerCase()) > -1);
                if (validTableNames.length === 1) {
                    return databaseObjects[validTableNames[0]];
                }
                else if (validTableNames.length === 0 || validTableNames.length > 9) {
                    dbName = yield uiUtils.question({ origin: this._origin, text: `No database could be found with the provided name. Please type a valid name` });
                }
                else {
                    // more than one object => we show a list of choices
                    dbName = (yield uiUtils.choices({
                        message: 'More than one table returned with those parameters, please select the one you want',
                        choices: validTableNames,
                        title: 'Select table'
                    }))['Select table'];
                }
            }
            return databaseObjects[dbName];
        });
    }
    static createFunctions(params, uiUtils) {
        return __awaiter(this, void 0, void 0, function* () {
            uiUtils.info({ origin: this._origin, message: `Getting ready to create functions.` });
            yield repository_utils_1.RepositoryUtils.checkOrGetApplicationName(params, 'database', uiUtils);
            const databaseObject = yield database_helper_1.DatabaseHelper.getApplicationDatabaseObject(params.applicationName);
            if (!databaseObject) {
                throw 'This application does not exist';
            }
            const databaseVersionFiles = yield database_helper_1.DatabaseHelper.getApplicationDatabaseFiles(params.applicationName);
            const versionToChange = yield DatabaseFileHelper.getVersionToChange(params, databaseVersionFiles, uiUtils);
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
            uiUtils.info({ origin: this._origin, message: `Going to add the functions to version ${versionToChange}` });
            uiUtils.startProgress({ length: tables.length * 4, start: 0, title: 'Functions' });
            const functionsToAdd = [];
            for (let t = 0; t < tables.length; t++) {
                const tableName = tables[t];
                if (!databaseObject.table[tableName].tags.ignore) {
                    const dbParams = {
                        'entity_name': 'entity',
                        'db_prefix': 'db',
                        'roles': 'null',
                        'table_name': 'cbt_entity_ety',
                        'primary_key_name': 'pk_ety_id',
                        'camel_cased_fields': '',
                        'table_fields': '',
                        'joins': '',
                        'table_fields_update': '',
                        'table_fields_insert': '',
                        'params_fields_insert': '',
                        'list_filters': '',
                        'list_json_object': '',
                        'list_sorting': '',
                    };
                    const dbParamsFields = Object.keys(dbParams);
                    const nameWithoutPrefixAndSuffix = tableName
                        .replace(new RegExp(`\_${databaseObject.table[tableName].tableSuffix}$`), '')
                        .replace(new RegExp(`^${databaseObject._properties.dbName}t\_`), '');
                    dbParams.entity_name = nameWithoutPrefixAndSuffix;
                    dbParams.db_prefix = databaseObject._properties.dbName;
                    dbParams.table_name = tableName;
                    dbParams.primary_key_name = `pk_${databaseObject.table[tableName].tableSuffix}_id`;
                    const fields = Object.keys(databaseObject.table[tableName].fields);
                    // we now get the list of sub entities relative to this table, with the get-with-parent tag
                    const tablesToRetrieveAlong = Object.keys(databaseObject.table).map(t => {
                        const fieldsToGet = Object.keys(databaseObject.table[t].fields)
                            .filter(f => databaseObject.table[t].fields[f].isForeignKey)
                            .filter(f => databaseObject.table[t].fields[f].foreignKey &&
                            (databaseObject.table[t].fields[f].foreignKey || { table: '' }).table === tableName);
                        if (fieldsToGet.filter(f => databaseObject.table[t].fields[f].tags['get-with-parent']).length) {
                            return fieldsToGet.map(field => ({ fieldName: field, table: databaseObject.table[t] }));
                        }
                        return [{ fieldName: '', table: new database_file_model_1.DatabaseTable() }];
                    })
                        .reduce((agg, curr) => agg.concat(curr), [])
                        .filter(x => !!x.fieldName);
                    const camelCasedFields = [], tableFields = [], tableFieldsUpdate = [], tableFieldsInsert = [], paramsFieldsInsert = [], listFilters = [], listJsonObject = [], listSortingAsc = [], listSortingDesc = [];
                    for (let i = 0; i < fields.length; i++) {
                        const field = databaseObject.table[tableName].fields[fields[i]];
                        camelCasedFields.push(`${exports.indentationSpaces.repeat(2)}"${field.camelCasedName}" ${!!field.type && field.type.toLowerCase() === 'serial' ? 'integer' : field.type}`);
                        tableFields.push(exports.indentationSpaces.repeat(2) + field.name);
                        if (tablesToRetrieveAlong.length) {
                            for (let j = 0; j < tablesToRetrieveAlong.length; j++) {
                                const subTable = tablesToRetrieveAlong[j];
                                camelCasedFields.push(`${exports.indentationSpaces.repeat(2)}"${subTable.table.camelCasedName}" json`);
                                let subQuery = `${exports.indentationSpaces.repeat(2)}(\n`;
                                subQuery += `${exports.indentationSpaces.repeat(3)}SELECT COALESCE(JSON_AGG(\n`;
                                subQuery += `${exports.indentationSpaces.repeat(4)}json_build_object(\n`;
                                subQuery += Object.keys(subTable.table.fields).map(field => {
                                    return `${exports.indentationSpaces.repeat(5)}'${subTable.table.fields[field].camelCasedName}', ${subTable.table.fields[field].name}`;
                                }).join(',\n');
                                subQuery += `${exports.indentationSpaces.repeat(4)})\n`;
                                subQuery += `${exports.indentationSpaces.repeat(3)}) FILTER(where sub${j}.modified_at is not null), '[]'::json)\n`;
                                subQuery += `${exports.indentationSpaces.repeat(3)}FROM ${subTable.table.name} sub${j}\n`;
                                subQuery += `${exports.indentationSpaces.repeat(4)}where sub${j}.${subTable.table.primaryKey ? subTable.table.primaryKey.name : 'id'} = ${subTable.fieldName}\n`;
                                subQuery += `${exports.indentationSpaces.repeat(2)})\n`;
                                tableFields.push(subQuery);
                            }
                        }
                        if (field.toUpdate) {
                            tableFieldsUpdate.push(`${exports.indentationSpaces.repeat(4)}${field.name} = (i_params->>'${field.camelCasedName}')::${field.type}`);
                        }
                        if (field.toUpdate) {
                            tableFieldsInsert.push(`${exports.indentationSpaces.repeat(3)}${field.name}`);
                            paramsFieldsInsert.push(`${exports.indentationSpaces.repeat(3)}(i_params->>'${field.camelCasedName}')::${field.type}`);
                        }
                        if (field.isListFilter) {
                            if (field.type.match(/text/i)) {
                                listFilters.push(`${exports.indentationSpaces.repeat(4)}(i_params->'filters'->>'${field.listFilterName}' IS null OR ${field.name} ilike '%' || (i_params->'filters'->>'${field.listFilterName}')::TEXT || '%')`);
                            }
                            else if (field.type.match(/integer/i)) {
                                listFilters.push(`${exports.indentationSpaces.repeat(4)}(i_params->'filters'->>'${field.listFilterName}' IS null OR ${field.name} = i_params->'filters'->>'${field.listFilterName}')::INTEGER)`);
                            }
                            // todo add the other types
                        }
                        if (field.retrieveInList) {
                            listJsonObject.push(`${exports.indentationSpaces.repeat(6)}'${field.camelCasedName}',  ${field.name}`);
                        }
                        if (field.sort) {
                            listSortingAsc.push(`${exports.indentationSpaces.repeat(7)}WHEN (i_params->>'sorting') = '${field.camelCasedName}' AND (i_params->>'direction') = 'asc' THEN ${field.name}`);
                            listSortingDesc.push(`${exports.indentationSpaces.repeat(7)}WHEN (i_params->>'sorting') = '${field.camelCasedName}' AND (i_params->>'direction') = 'desc' THEN ${field.name}`);
                        }
                    }
                    dbParams.camel_cased_fields = camelCasedFields.join(',\n');
                    dbParams.table_fields = tableFields.join(',\n');
                    dbParams.table_fields_update = tableFieldsUpdate.join(',\n');
                    dbParams.table_fields_insert = tableFieldsInsert.join(',\n');
                    dbParams.params_fields_insert = paramsFieldsInsert.join(',\n');
                    dbParams.list_filters = listFilters.length > 0 ?
                        `${exports.indentationSpaces.repeat(3)}WHERE(\n${listFilters.join(' OR \n')}\n${exports.indentationSpaces.repeat(3)})`
                        : '';
                    dbParams.list_json_object = listJsonObject.join(',\n');
                    if (listSortingAsc.length) {
                        dbParams.list_sorting = `${exports.indentationSpaces.repeat(5)}ORDER BY\n`;
                        dbParams.list_sorting += `${exports.indentationSpaces.repeat(6)}(CASE\n`;
                        dbParams.list_sorting += listSortingAsc.join('\n');
                        dbParams.list_sorting += `\n${exports.indentationSpaces.repeat(6)}END) ASC,\n`;
                        dbParams.list_sorting += `${exports.indentationSpaces.repeat(6)}(CASE\n`;
                        dbParams.list_sorting += listSortingDesc.join('\n');
                        dbParams.list_sorting += `\n${exports.indentationSpaces.repeat(6)}END) DESC\n`;
                    }
                    else {
                        dbParams.list_sorting = '';
                    }
                    // todo deal with joins later
                    dbParams.joins = '';
                    const folderPath = path_1.default.resolve(databaseObject._properties.path, 'postgres', 'release', versionToChange, 'schema', '07-functions', nameWithoutPrefixAndSuffix);
                    file_utils_1.FileUtils.createFolderStructureIfNeeded(folderPath);
                    for (let i = 0; i < actions.length; i++) {
                        const action = actions[i];
                        const canCreate = (!params.filter || new RegExp(params.filter).test(`${action}_${nameWithoutPrefixAndSuffix}`)) && !databaseObject.table[tableName].tags[`no-${action}`];
                        if (canCreate) {
                            let fileString = yield file_utils_1.FileUtils.readFile(path_1.default.resolve(process.argv[1], database_helper_1.DatabaseHelper.dbTemplatesFolder, `${action}.sql`));
                            for (let j = 0; j < dbParamsFields.length; j++) {
                                const param = dbParamsFields[j];
                                let valueToReplaceWith = dbParams[param];
                                switch (param) {
                                    case 'roles':
                                        let roles = '';
                                        if (databaseObject.table[tableName].tags[`${action}-roles`]) {
                                            if (databaseObject.table[tableName].tags[`${action}-roles`].value.match(/^\[[a-zA-Z0-9-_' ,]+\]$/)) {
                                                roles = databaseObject.table[tableName].tags[`${action}-roles`].value;
                                            }
                                        }
                                        if (databaseObject.table[tableName].tags[`roles`]) {
                                            if (databaseObject.table[tableName].tags[`roles`].value.match(/^\[[a-zA-Z0-9-_' ,]+\]$/)) {
                                                roles = databaseObject.table[tableName].tags[`roles`].value;
                                            }
                                        }
                                        roles = roles
                                            .replace(/\'/g, '"')
                                            .replace(/\[/g, '{')
                                            .replace(/\]/g, '}');
                                        if (roles) {
                                            valueToReplaceWith = `'${roles}'`;
                                        }
                                        break;
                                    default:
                                        break;
                                }
                                fileString = fileString.replace(new RegExp(`<${param}>`, 'gi'), valueToReplaceWith);
                            }
                            let writeFile = true;
                            if (file_utils_1.FileUtils.checkIfFolderExists(path_1.default.resolve(folderPath, `${dbParams.db_prefix}f_${action}_${nameWithoutPrefixAndSuffix}.sql`))) {
                                // we have an existing file. We get the content, and check if it is different. If yer, we override
                                const currentFileCOntent = yield file_utils_1.FileUtils.readFile(path_1.default.resolve(folderPath, `${dbParams.db_prefix}f_${action}_${nameWithoutPrefixAndSuffix}.sql`));
                                if (currentFileCOntent !== fileString) {
                                    writeFile = true;
                                    filesOverwritten++;
                                }
                                else {
                                    writeFile = false;
                                    filesIgnored++;
                                }
                            }
                            else {
                                writeFile = true;
                            }
                            if (writeFile) {
                                const fileName = `${dbParams.db_prefix}f_${action}_${nameWithoutPrefixAndSuffix}.sql`;
                                file_utils_1.FileUtils.writeFileSync(path_1.default.resolve(folderPath, `${dbParams.db_prefix}f_${action}_${nameWithoutPrefixAndSuffix}.sql`), fileString);
                                filesCreated++;
                                functionsToAdd.push(['../', 'postgres', 'release', versionToChange, 'schema', '07-functions', nameWithoutPrefixAndSuffix, fileName].join('/'));
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
            if (filesCreated || filesOverwritten) {
                // if something has been changed, we update the file
                yield DatabaseFileHelper.updateVersionFile(databaseObject._properties.path, versionToChange, functionsToAdd, params.applicationName, uiUtils);
            }
            return yield Promise.resolve(true);
        });
    }
    static updateVersionFile(filePath, version, filePaths, applicationName, uiUtils) {
        return __awaiter(this, void 0, void 0, function* () {
            // if something has been changed, we update the file
            const newVersionJsonPath = path_1.default.resolve(filePath, 'postgres', 'release', version, 'version.json');
            const versionJsonPath = path_1.default.resolve(process.argv[1], '../../data/db/database-structure/files/version.json');
            let versionJsonFile = yield file_utils_1.FileUtils.readJsonFile(versionJsonPath);
            if (file_utils_1.FileUtils.checkIfFolderExists(newVersionJsonPath)) {
                versionJsonFile = yield file_utils_1.FileUtils.readJsonFile(newVersionJsonPath);
            }
            else {
                versionJsonFile = [new database_file_model_1.DatabaseVersion({
                        userToUse: 'root',
                        fileList: []
                    }, newVersionJsonPath)];
            }
            // todo list versions to add
            // todo update version.json
            versionJsonFile[versionJsonFile.length - 1].fileList = [
                ...versionJsonFile[versionJsonFile.length - 1].fileList,
                ...filePaths.filter(x => versionJsonFile[versionJsonFile.length - 1].fileList.indexOf(x) === -1)
            ];
            file_utils_1.FileUtils.createFolderStructureIfNeeded(newVersionJsonPath);
            file_utils_1.FileUtils.writeFileSync(newVersionJsonPath, JSON.stringify(versionJsonFile, null, 2));
            yield database_repo_reader_1.DatabaseRepositoryReader.readRepo(filePath, applicationName, uiUtils);
        });
    }
    static createTable(params, uiUtils) {
        return __awaiter(this, void 0, void 0, function* () {
            uiUtils.info({ origin: this._origin, message: `Getting ready to create table.` });
            yield repository_utils_1.RepositoryUtils.checkOrGetApplicationName(params, 'database', uiUtils);
            const databaseObject = yield database_helper_1.DatabaseHelper.getApplicationDatabaseObject(params.applicationName);
            if (!databaseObject) {
                throw 'This application does not exist';
            }
            const databaseVersionFiles = yield database_helper_1.DatabaseHelper.getApplicationDatabaseFiles(params.applicationName);
            const versionToChange = yield DatabaseFileHelper.getVersionToChange(params, databaseVersionFiles, uiUtils);
            if (!params.tableDetails || (params.tableDetails && !params.tableDetails.name)) {
                // we have User Interraction to build the table
                let tableName = '';
                while (!tableName) {
                    let newTableName = yield uiUtils.question({ origin: DatabaseFileHelper._origin, text: 'Please provide a table name' });
                    if (!DatabaseFileHelper._checkNewNameHasUnderscoresAndAlphanumerics(newTableName)) {
                        uiUtils.warning({ origin: DatabaseFileHelper._origin, message: 'Please use snake cased alphanumeric characters' });
                        tableName = '';
                    }
                    else {
                        tableName = yield DatabaseFileHelper._checkNewTableName(databaseObject, newTableName, uiUtils);
                    }
                }
                //table name is valid.
                const tablePrefix = tableName.substr(-3);
                params.tableDetails = {
                    name: tableName,
                    fields: [{
                            isPrimaryKey: true,
                            name: `pk_${tableName.substr(-3)}_id`,
                            type: 'serial',
                            unique: true,
                            notNull: true
                        }],
                    tags: [],
                };
                uiUtils.info({ origin: DatabaseFileHelper._origin, message: `Table name: ${params.tableDetails.name}` });
                // ask about fields
                let finished = false;
                let newFieldName = yield uiUtils.question({ origin: DatabaseFileHelper._origin, text: 'Please provide a field name' });
                let referenceDetails;
                while (!finished) {
                    let validName = false;
                    let selectedType = '';
                    while (!validName) {
                        validName = true;
                        const matchedNewField = newFieldName.match(/^fk_([a-z0-9]{3})_([a-z0-9]{3})_/i);
                        if (matchedNewField) {
                            // check that the suffix is this table's actual suffix
                            if (matchedNewField[2] !== tablePrefix) {
                                validName = false;
                                uiUtils.error({
                                    origin: this._origin,
                                    message: `The second set of 3 letters on the field name should be the table suffix "${tablePrefix}". "${matchedNewField[2]}" was found`
                                });
                            }
                            let foundAMatchingTable = false;
                            // check if we have the matching table
                            for (let i = 0; i < Object.keys(databaseObject.table).length && !foundAMatchingTable; i++) {
                                const databaseTableName = Object.keys(databaseObject.table)[i];
                                const matchingTableRegex = new RegExp(`_${matchedNewField[1]}$`, 'i');
                                if (databaseTableName.match(matchingTableRegex)) {
                                    foundAMatchingTable = true;
                                    referenceDetails = {
                                        table: databaseTableName,
                                        key: `pk_${matchedNewField[1]}_id`,
                                    };
                                    selectedType = 'integer';
                                }
                            }
                            // check if we have the matching table in the replicated local tables
                            for (let i = 0; i < Object.keys(databaseObject["local-tables"]).length && !foundAMatchingTable; i++) {
                                const databaseTableName = Object.keys(databaseObject["local-tables"])[i];
                                const matchingTableRegex = new RegExp(`_${matchedNewField[1]}$`, 'i');
                                if (databaseTableName.match(matchingTableRegex)) {
                                    foundAMatchingTable = true;
                                    referenceDetails = {
                                        table: databaseTableName,
                                        key: `pk_${matchedNewField[1]}_id`,
                                    };
                                    selectedType = 'integer';
                                }
                            }
                            if (!foundAMatchingTable) {
                                uiUtils.warning({
                                    origin: this._origin,
                                    message: `Could not find a match for table prefix "${matchedNewField[1]}". Please check your reference`
                                });
                            }
                        }
                        validName = validName && DatabaseFileHelper._checkNewNameHasUnderscoresAndAlphanumerics(newFieldName);
                        if (!validName) {
                            newFieldName = yield uiUtils.question({ origin: DatabaseFileHelper._origin, text: 'Please provide a field name' });
                        }
                    }
                    const types = [
                        'text',
                        'integer',
                        'timestamp',
                        'date',
                        'float',
                        'boolean'
                    ];
                    while (!selectedType) {
                        selectedType = yield uiUtils.question({
                            origin: DatabaseFileHelper._origin, text: `Please select a type, or type the desired one : \n${types.map((x, i) => {
                                return `\t ${i + 1} - ${x}`;
                            }).join('\n')}`
                        });
                    }
                    if (+selectedType && types[+selectedType - 1]) {
                        selectedType = types[+selectedType - 1];
                    }
                    params.tableDetails.fields.push({
                        name: `${!!referenceDetails ? tablePrefix + '_' : ''}${newFieldName}`,
                        type: selectedType,
                        foreignKey: referenceDetails,
                        isForeignKey: !!referenceDetails
                    });
                    const paramIndex = params.tableDetails.fields.length - 1;
                    params.tableDetails.fields[paramIndex].notNull = (yield uiUtils.question({ origin: DatabaseFileHelper._origin, text: 'Should it be not null ? (y for yes)' })).toLowerCase() === 'y';
                    if (params.tableDetails.fields[paramIndex].notNull) {
                        params.tableDetails.fields[paramIndex].default = (yield uiUtils.question({ origin: DatabaseFileHelper._origin, text: 'Please provide a default value (press enter for none)' }));
                        if (!params.tableDetails.fields[paramIndex].default) {
                            params.tableDetails.fields[paramIndex].default = undefined;
                        }
                    }
                    params.tableDetails.fields[paramIndex].unique = (yield uiUtils.question({ origin: DatabaseFileHelper._origin, text: 'Should it be unique ? (y for yes)' })).toLowerCase() === 'y';
                    // next
                    newFieldName = yield uiUtils.question({ origin: DatabaseFileHelper._origin, text: 'Please provide the next field name' });
                    finished = !newFieldName;
                }
                params.tableDetails.fields = params.tableDetails.fields.concat([{
                        name: 'created_by',
                        type: 'CHAR(4)',
                        notNull: true
                    },
                    {
                        name: 'created_at',
                        type: 'TIMESTAMPTZ',
                        notNull: true,
                        default: 'CURRENT_TIMESTAMP'
                    },
                    {
                        name: 'modified_by',
                        type: 'CHAR(4)',
                        notNull: true
                    },
                    {
                        name: 'modified_at',
                        type: 'TIMESTAMPTZ',
                        notNull: true,
                        default: 'CURRENT_TIMESTAMP'
                    }]);
            }
            // we try and build the table based on the provided details
            let tableString = ``;
            if (params.tableDetails.tags && params.tableDetails.tags.length) {
                tableString += `/* ${params.tableDetails.tags.map(tag => {
                    return `#${tag.name}${tag.value ? `=${tag.value}` : ''}`;
                }).join(' ')} */\n`;
            }
            tableString += `CREATE OR REPLACE TABLE public."${params.tableDetails.name}" (\n`;
            tableString += params.tableDetails.fields.map(field => {
                let fieldString = `${syntax_utils_1.indentation}${field.name} ${field.type}`;
                fieldString += `${field.isPrimaryKey ? ' PRIMARY KEY' : ''}`;
                fieldString += `${field.unique ? ' UNIQUE' : ''}`;
                fieldString += `${field.notNull ? ' NOT' : ''} NULL`;
                if (field.isForeignKey && field.foreignKey) {
                    fieldString += ` REFERENCES ${field.foreignKey.table}(${field.foreignKey.key})`;
                }
                fieldString += `${field.notNull && field.default ? ` DEFAULT ${field.default}` : ''}`;
                if (field.tags && Object.keys(field.tags).length) {
                    fieldString += `/* ${Object.keys(field.tags).map(tagName => {
                        if (field.tags && field.tags[tagName]) {
                            return `#${field.tags[tagName].name}${field.tags[tagName].value ? `=${field.tags[tagName].value}` : ''}`;
                        }
                        return '';
                    }).filter(Boolean).join(' ')} */`;
                }
                return fieldString;
            }).join(',\n');
            tableString += '\n);';
            const fileName = `${params.tableDetails.name}.sql`;
            const folderPath = path_1.default.resolve(databaseObject._properties.path, 'postgres', 'release', versionToChange, 'schema', '03-tables');
            file_utils_1.FileUtils.writeFileSync(path_1.default.resolve(folderPath, fileName), tableString);
            yield DatabaseFileHelper.updateVersionFile(databaseObject._properties.path, versionToChange, [
                ['../', 'postgres', 'release', versionToChange, 'schema', '03-tables', fileName].join('/')
            ], params.applicationName, uiUtils);
        });
    }
    static _checkNewNameHasUnderscoresAndAlphanumerics(tableName) {
        return /^[a-z0-9_]+$/i.test(tableName);
    }
    static _checkNewTableName(databaseObject, tableName, uiUtils) {
        return __awaiter(this, void 0, void 0, function* () {
            if (tableName.indexOf(databaseObject._properties.dbName) !== 0) {
                tableName = databaseObject._properties.dbName + 't_' + tableName;
            }
            // loop on all the other tables, and check if one stats the same
            const existingTables = Object.keys(databaseObject.table)
                .filter(t => {
                return t.indexOf(tableName) === 0 && t.length === tableName.length + 4;
            });
            if (existingTables.length > 0) {
                return '';
            }
            const probablyHasSuffix = !!tableName.match(/_[a-z][a-z0-9]{1,2}$/i);
            let hasSuffix = false;
            if (probablyHasSuffix) {
                hasSuffix = (yield uiUtils.question({ origin: DatabaseFileHelper._origin, text: 'It seems that you provided a suffix for this table, pleas confirm (y/n)' })) === 'y';
            }
            if (hasSuffix) {
                return tableName;
            }
            const takenSuffixes = Object.keys(databaseObject.table).map(t => {
                return t.split('_')[t.split('_').length - 1];
            });
            const tableNameSplit = tableName.split('_');
            let suffix = tableNameSplit[1].substr(0, 1);
            // we first try one suffix, as we would like it, then we loop
            if (tableNameSplit.length >= 4) {
                suffix += tableNameSplit[2].substr(0, 1) + tableNameSplit[3].substr(0, 1);
            }
            else if (tableNameSplit.length === 3) {
                suffix += tableNameSplit[1].substr(1, 1) + tableNameSplit[2].substr(0, 1);
            }
            else {
                suffix = tableNameSplit[1].substr(0, 3);
            }
            let tries = 1;
            const tableNameWIthoutDBName = tableName.substr(4);
            while (takenSuffixes.indexOf(suffix) > -1 && tries < tableName.length - (3 + tableNameSplit.length)) {
                // we get crazy
                suffix =
                    tableNameWIthoutDBName.substr(Math.floor(tableNameWIthoutDBName.length * Math.random()), 1) +
                        tableNameWIthoutDBName.substr(Math.floor(tableNameWIthoutDBName.length * Math.random()), 1) +
                        tableNameWIthoutDBName.substr(Math.floor(tableNameWIthoutDBName.length * Math.random()), 1);
                tries++;
            }
            if (takenSuffixes.indexOf(suffix) > -1) {
                // numbers ?
                tries = 0;
                while (takenSuffixes.indexOf(suffix) > -1 && tries < 100) {
                    // we get crazy
                    suffix = tableNameWIthoutDBName.substr(tries < 10 ? 2 : 1, 1) + (tries < 10 ? `0${tries}` : `${tries}`);
                    tries++;
                }
            }
            if (takenSuffixes.indexOf(suffix) > -1) {
                // what DB is that ???
                throw 'Could not find a proper suffix for this table. try providing one in the name';
            }
            return tableName + '_' + suffix;
        });
    }
    static createVersion(params, uiUtils) {
        return __awaiter(this, void 0, void 0, function* () {
            uiUtils.info({ origin: this._origin, message: `Getting ready to create version.` });
            yield repository_utils_1.RepositoryUtils.checkOrGetApplicationName(params, 'database', uiUtils);
            const databaseObject = yield database_helper_1.DatabaseHelper.getApplicationDatabaseObject(params.applicationName);
            if (!databaseObject) {
                throw 'This application does not exist';
            }
            if (!databaseObject._properties.hasCurrent) {
                throw `In order to create a version, you will need to change / create something on the database, and doing so, create a 'current' version`;
            }
            // check that we have a version provided
            const versionSplit = databaseObject._properties.lastVersion.split('.');
            const versions = [
                [+versionSplit[0] + 1, 0, 0, 0].join('.') + ' - Major release',
                [versionSplit[0], +versionSplit[1] + 1, 0, 0].join('.') + ' - Feature release',
                [versionSplit[0], versionSplit[1], +versionSplit[2] + 1, 0].join('.') + ' - Bug fixing',
                [versionSplit[0], versionSplit[1], versionSplit[2], +versionSplit[3] + 1].join('.') + ' - Development version',
            ];
            const chosenVersion = yield uiUtils.choices({
                message: 'Please choose the version you want to create',
                title: 'version',
                choices: versions
            });
            const version = chosenVersion.version.match(/^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+/i)[0];
            // copy from current to the newly created version folder
            yield file_utils_1.FileUtils.renameFolder(path_1.default.resolve(databaseObject._properties.path, 'postgres', 'release', 'current'), path_1.default.resolve(databaseObject._properties.path, 'postgres', 'release', version));
            // copy the schema to the schema folder
            const fileList = yield file_utils_1.FileUtils.getFileList({
                filter: /\.sql/,
                startPath: path_1.default.resolve(databaseObject._properties.path, 'postgres', 'release', version, 'schema')
            });
            // update the paths in the version.json file
            const versionJsonFile = yield file_utils_1.FileUtils.readJsonFile(path_1.default.resolve(databaseObject._properties.path, 'postgres', 'release', version, 'version.json'));
            for (let i = 0; i < versionJsonFile.length; i++) {
                versionJsonFile[i].fileList = versionJsonFile[i].fileList
                    .map(fileName => fileName.replace('postgres/release/current', `postgres/release/${version}`));
            }
            yield file_utils_1.FileUtils.writeFileSync(path_1.default.resolve(databaseObject._properties.path, 'postgres', 'release', version, 'version.json'), JSON.stringify(versionJsonFile, null, 2));
            for (let i = 0; i < fileList.length; i++) {
                const fileName = fileList[i];
                const newFileName = fileName.replace(`postgres/release/${version}/schema`, 'postgres/schema');
                file_utils_1.FileUtils.copyFileSync(fileName, newFileName);
            }
            yield database_repo_reader_1.DatabaseRepositoryReader.readRepo(databaseObject._properties.path, params.applicationName, uiUtils);
            return true;
        });
    }
    static editObject(params, uiUtils) {
        return __awaiter(this, void 0, void 0, function* () {
            uiUtils.info({ origin: this._origin, message: `Getting ready to edit ${params.objectType} "${params.objectName}".` });
            yield repository_utils_1.RepositoryUtils.checkOrGetApplicationName(params, 'database', uiUtils);
            const databaseObject = yield database_helper_1.DatabaseHelper.getApplicationDatabaseObject(params.applicationName);
            const databaseSubObject = yield database_helper_1.DatabaseHelper.getDatabaseSubObject(params, databaseObject, DatabaseFileHelper._origin, uiUtils);
            if (databaseSubObject.latestVersion === 'current') {
                // object is at the current version ALREADY
                throw 'Object is already at the current version';
            }
            const filesToInstall = [];
            const fileName = databaseSubObject.latestFile;
            const newFileName = fileName.replace(`/${databaseSubObject.latestVersion}/`, '/current/');
            yield file_utils_1.FileUtils.createFolderStructureIfNeeded(newFileName);
            yield file_utils_1.FileUtils.copyFileSync(fileName, newFileName);
            // todo add the other types
            if (databaseSubObject.type === 'function') {
                filesToInstall.push(newFileName.replace(new RegExp(`.*?(postgres\/release\/current\/schema/.*?)`, 'i'), '..//$1'));
            }
            else if (databaseSubObject.type === 'table' || databaseSubObject.type === 'local-tables') {
                // create the alter table file if not exist
                const alterTableFileName = newFileName.replace(new RegExp(`.*?postgres\/release\/current\/schema/.*?/([a-z0-9_]+.sql)`, 'i'), '..//postgres/release/current/scripts/alter_$1');
                if (!file_utils_1.FileUtils.checkIfFolderExists(alterTableFileName.replace(/\.\.\/\//, databaseObject._properties.path + '/'))) {
                    file_utils_1.FileUtils.writeFileSync(alterTableFileName.replace(/\.\.\/\//, databaseObject._properties.path + '/'), '');
                }
                filesToInstall.push(alterTableFileName);
            }
            if (filesToInstall.length) {
                yield DatabaseFileHelper.updateVersionFile(databaseObject._properties.path, 'current', filesToInstall, params.applicationName, uiUtils);
            }
            uiUtils.success({ origin: this._origin, message: `New file version created for ${params.objectType} "${params.objectName}"` });
            yield database_repo_reader_1.DatabaseRepositoryReader.readRepo(databaseObject._properties.path, params.applicationName, uiUtils);
        });
    }
    static renameTableField(params, uiUtils) {
        return __awaiter(this, void 0, void 0, function* () {
            yield repository_utils_1.RepositoryUtils.checkOrGetApplicationName(params, 'database', uiUtils);
            let databaseObject = yield database_helper_1.DatabaseHelper.getApplicationDatabaseObject(params.applicationName);
            const databaseSubObject = yield database_helper_1.DatabaseHelper.getDatabaseSubObject(Object.assign(Object.assign({}, params), { objectType: 'table' }), databaseObject, DatabaseFileHelper._origin, uiUtils);
            const tableName = databaseSubObject.name;
            // rename in the table
            // - Create the new table script, and the alter table script
            try {
                yield DatabaseFileHelper.editObject({
                    applicationName: params.applicationName,
                    objectName: databaseSubObject.name,
                    objectType: 'table'
                }, uiUtils);
            }
            catch (e) {
                uiUtils.info({
                    origin: this._origin,
                    message: e.toString()
                });
            }
            // refresh the database object
            databaseObject = yield database_helper_1.DatabaseHelper.getApplicationDatabaseObject(params.applicationName);
            uiUtils.info({
                origin: this._origin,
                message: `Updating ${tableName} script`
            });
            file_utils_1.FileUtils.writeFileSync(databaseObject.table[tableName].latestFile, (yield file_utils_1.FileUtils.readFile(databaseObject.table[tableName].latestFile))
                .replace(new RegExp(params.fieldName, `ig`), params.newName));
            const newRenameScript = `ALTER TABLE ${tableName} RENAME COLUMN ${params.fieldName} TO ${params.newName};`;
            const currentAlterScriptPath = path_1.default.resolve(databaseObject._properties.path, 'postgres', 'release', 'current', 'scripts', `alter_${tableName}.sql`);
            let currentAlterScript = yield file_utils_1.FileUtils.readFile(currentAlterScriptPath);
            if (currentAlterScript) {
                currentAlterScript += '\r\n';
            }
            currentAlterScript += newRenameScript;
            uiUtils.info({
                origin: this._origin,
                message: `Updating ${tableName} alter script`
            });
            yield file_utils_1.FileUtils.writeFileSync(currentAlterScriptPath, currentAlterScript);
            // look for all relevant objects, check the ones that were using it
            // replace in objects, and create them in the version
            uiUtils.warning({
                origin: this._origin,
                message: `So far the fields will be replaced in the tables, functions, views, and triggers`
            });
            const objectsToReplaceIn = [
                {
                    name: 'table', specificProcess: (key) => __awaiter(this, void 0, void 0, function* () {
                        const newRenameScript = `ALTER TABLE ${key} RENAME COLUMN ${params.fieldName} TO ${params.newName};`;
                        const currentAlterScriptPath = path_1.default.resolve(databaseObject._properties.path, 'postgres', 'release', 'current', 'scripts', `alter_${key}.sql`);
                        let currentAlterScript = yield file_utils_1.FileUtils.readFile(currentAlterScriptPath);
                        if (currentAlterScript) {
                            currentAlterScript += '\r\n';
                        }
                        currentAlterScript += newRenameScript;
                        yield file_utils_1.FileUtils.writeFileSync(currentAlterScriptPath, currentAlterScript);
                    })
                },
                { name: 'function' },
                { name: 'view' },
                { name: 'trigger' },
            ];
            for (let j = 0; j < objectsToReplaceIn.length; j++) {
                const objectToReplaceIn = objectsToReplaceIn[j];
                for (let i = 0; i < Object.keys(databaseObject[objectToReplaceIn.name]).length; i++) {
                    const key = Object.keys(databaseObject[objectToReplaceIn.name])[i];
                    const currentScript = yield file_utils_1.FileUtils.readFile(databaseObject[objectToReplaceIn.name][key].latestFile);
                    if (currentScript.match(new RegExp(params.fieldName, 'i'))) {
                        try {
                            yield DatabaseFileHelper.editObject({
                                applicationName: params.applicationName,
                                objectName: key,
                                objectType: objectToReplaceIn.name
                            }, uiUtils);
                        }
                        catch (e) {
                            uiUtils.info({
                                origin: this._origin,
                                message: e.toString()
                            });
                        }
                        // refresh the database object
                        databaseObject = yield database_helper_1.DatabaseHelper.getApplicationDatabaseObject(params.applicationName);
                        file_utils_1.FileUtils.writeFileSync(databaseObject[objectToReplaceIn.name][key].latestFile, currentScript.replace(new RegExp(params.fieldName, 'ig'), params.newName));
                        if (objectToReplaceIn.specificProcess) {
                            objectToReplaceIn.specificProcess(key);
                        }
                    }
                }
            }
        });
    }
}
exports.DatabaseFileHelper = DatabaseFileHelper;
DatabaseFileHelper._origin = 'DatabaseFileHelper';

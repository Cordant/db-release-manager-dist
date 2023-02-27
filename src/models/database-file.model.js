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
exports.DatabaseVersionFile = exports.DatabaseVersion = exports.DatabaseFile = exports.DatabaseObject = exports.DatabaseDataScript = exports.DatabaseLocalReplicatedTable = exports.DatabaseTable = exports.DatabaseFunction = exports.DatabaseTableField = exports.DatabaseSubObject = exports.Tag = void 0;
const file_utils_1 = require("../utils/file.utils");
const syntax_utils_1 = require("../utils/syntax.utils");
const TableConstraintsFirstWord = [
    'check',
    'unique',
    'primary',
    'constraint',
    'exclude',
    'foreign'
];
class Tag {
    constructor(tag) {
        const regexedTag = /#([a-z-]+)(=([\[|\(]?[a-zA-Z0-9-_' ,]+[\]|\)]?))?/gi.exec(tag);
        if (regexedTag) {
            this.name = regexedTag[1];
            this.value = regexedTag[2] ? regexedTag[2].substr(1) : true;
        }
    }
}
exports.Tag = Tag;
class DatabaseSubObject {
    constructor(params) {
        params = params || {};
        this.name = params.name || '';
        this.type = params.type || 'unknown';
        this.latestVersion = params.latestVersion;
        this.latestFile = params.latestFile || '';
        this.versions = params.versions || [];
    }
    analyzeFile(uiUtils) {
        return __awaiter(this, void 0, void 0, function* () { });
    }
}
exports.DatabaseSubObject = DatabaseSubObject;
class DatabaseTableField {
    constructor(field, tableSuffix) {
        this.name = field.split[0];
        this.camelCasedName = '';
        this.type = field.split[1];
        this.notNull = field.fullText.indexOf('not null') > -1;
        this.tags = (field.fullText.match(/#[a-z-]+(=[\[|\(]?[a-zA-Z0-9-_' ,]+[\]|\)]?)?/gi) || [])
            .reduce((agg, current) => {
            const tag = new Tag(current);
            return Object.assign(Object.assign({}, agg), { [tag.name]: tag });
        }, {});
        this.isForeignKey = false;
        this.isPrimaryKey = false;
        this.unique = false;
        this.retrieveInList = false;
        this.isListFilter = false;
        this.listFilterName = '';
        this.toUpdate = true;
        this.sort = false;
        this.default = false;
        this.defaultValue = '';
        const reference = /references\W*(\"?public\"?\.)?\"?([a-z0-9_]+)\"?\W*\((.*?)\)/i.exec(field.fullText);
        if (reference) {
            this.isForeignKey = true;
            this.foreignKey = {
                table: reference[2],
                key: reference[3]
            };
        }
        const unique = / unique[^a-z]/i.exec(field.fullText);
        if (unique) {
            this.unique = true;
        }
        const def = /default (.*)/i.exec(field.fullText);
        if (def) {
            this.default = true;
            this.defaultValue = def[1];
        }
        const primaryKey = /primary key/i.test(field.fullText);
        if (primaryKey) {
            this.isPrimaryKey = true;
            this.toUpdate = false;
            this.retrieveInList = true;
        }
        if (this.name === 'modified_at' ||
            this.name === 'modified_by' ||
            this.name === 'created_by' ||
            this.name === 'created_at') {
            this.toUpdate = false;
        }
        // get camel cased name
        if (this.tags['camel-cased-name'] && this.tags['camel-cased-name'].value) {
            this.camelCasedName = this.tags['camel-cased-name'].value;
        }
        else {
            if (this.isForeignKey) {
                if (this.name.match(/fk_[a-z0-9]{3}_[a-z0-9]{3}_/i)) {
                    this.camelCasedName = syntax_utils_1.SyntaxUtils
                        .snakeCaseToCamelCase(this.name.substr(11));
                }
            }
            else if (this.isPrimaryKey) {
                if (this.name.match(/pk_[a-z0-9]{3}_id/gi)) {
                    this.camelCasedName = 'id';
                }
            }
            if (!this.camelCasedName) {
                const fieldName = tableSuffix ? this.name.replace(tableSuffix + '_', '') : this.name;
                this.camelCasedName = syntax_utils_1.SyntaxUtils
                    .snakeCaseToCamelCase(fieldName);
            }
        }
        if (this.tags['list-filter']) {
            this.isListFilter = true;
            if (this.tags['list-filter'].value && this.tags['list-filter'].value !== true) {
                this.listFilterName = this.tags['list-filter'].value;
            }
            else {
                this.listFilterName = this.camelCasedName;
            }
        }
        if (this.tags.sort) {
            this.sort = true;
        }
    }
}
exports.DatabaseTableField = DatabaseTableField;
class DatabaseFunction extends DatabaseSubObject {
    constructor(params) {
        super(params);
        this.hasOrReplace = false;
        this.dbPrefix = '';
        this.mode = '';
        this.returnType = '';
        this.arguments = [];
    }
    analyzeFile(uiUtils) {
        return __awaiter(this, void 0, void 0, function* () {
            this.type = "function";
            let functionFile = '';
            try {
                functionFile = yield file_utils_1.FileUtils.readFile(this.latestFile);
            }
            catch (error) {
                uiUtils.warning({ message: `File ${this.latestFile} does not exist`, origin: 'DatabaseTable' });
                return;
            }
            functionFile = syntax_utils_1.SyntaxUtils.simplifyDbFileForAnalysis(functionFile);
            const functionMatch = /create(?: or replace)? function (\"?public\"?\.)?\"?([a-z0-9_]+)\"? \(/i.exec(functionFile);
            if (functionMatch) {
                this.name = functionMatch[2];
                if (this.name.match(/[a-z0-9]{2,3}f_[a-z0-9_]+/i)) {
                    const [dbPrefix, tableName] = /([a-z0-9]{2,3})f_([a-z0-9_]+)/i.exec(this.name) || ['', ''];
                    this.dbPrefix = dbPrefix;
                    this.camelCasedName = syntax_utils_1.SyntaxUtils.snakeCaseToCamelCase(tableName);
                }
            }
            // const modeMatch = / (immutable|stable|volatile|(?:not )) ?leakproof/i.exec(functionFile);
            const modeMatch = /\W(immutable|stable|volatile)\W/i.exec(functionFile);
            if (modeMatch) {
                this.mode = modeMatch[1].toLowerCase();
            }
            const paramsMatch = /create(?: or replace)? function (?:\"?public\"?\.)?\"?[a-z0-9_]+\"? \(([^()]+)\)/i.exec(functionFile);
            if (paramsMatch) {
                this.arguments = paramsMatch[1].trim()
                    .split(',')
                    .map(param => {
                    const paramSplit = param.toLowerCase().trim().split(' ');
                    const paramToReturn = {
                        mode: '',
                        name: '',
                        type: '',
                        defaultValue: ''
                    };
                    if (/in|out|inout|variadic/i.test(paramSplit[0])) {
                        paramToReturn.mode = paramSplit[0].toLowerCase();
                        paramSplit.splice(0, 1);
                    }
                    paramToReturn.name = paramSplit[0];
                    paramSplit.splice(0, 1);
                    const defaultIndex = paramSplit.indexOf('default');
                    if (defaultIndex > -1) {
                        paramToReturn.defaultValue = paramSplit.splice(defaultIndex + 1, paramSplit.length - 1).join(' ');
                        paramSplit.splice(defaultIndex, 1);
                    }
                    paramToReturn.type = paramSplit.join(' ');
                    return paramToReturn;
                });
            }
            if (/create or replace function (?:\"?public\"?\.)?\"?[a-z0-9_]+\"? \(([^()]+)\)/i.test(functionFile)) {
                this.hasOrReplace = true;
            }
            const returnTableMatch = /returns table ?\(([^()]+)\)/i.exec(functionFile);
            const returnSetOfMatch = /returns setof ([a-z0-9_])/i.exec(functionFile);
            const returnSingleMatch = /returns ([a-z0-9_()]+)/i.exec(functionFile);
            if (returnTableMatch) {
                this.returnType = 'table';
                this.returnTable = returnTableMatch[1].trim()
                    .split(',')
                    .map(param => {
                    const paramSplit = param.trim().split(' ');
                    const paramToReturn = {
                        name: paramSplit[0].replace(/"/g, ''),
                        type: ''
                    };
                    paramSplit.splice(0, 1);
                    paramToReturn.type = paramSplit.join(' ').toLowerCase();
                    return paramToReturn;
                });
            }
            else if (returnSetOfMatch) {
                this.returnType = `setof ${returnSetOfMatch[1].toLowerCase()}`;
            }
            else if (returnSingleMatch) {
                this.returnType = returnSingleMatch[1].toLowerCase();
            }
            else {
                this.returnType = 'void';
            }
        });
    }
}
exports.DatabaseFunction = DatabaseFunction;
class DatabaseTable extends DatabaseSubObject {
    constructor(params) {
        super(params);
        this.fields = (params || {}).fields || {};
        this.tableSuffix = '';
        this.dbPrefix = '';
        this.camelCasedName = '';
        this.tags = {};
    }
    analyzeFile(uiUtils) {
        return __awaiter(this, void 0, void 0, function* () {
            this.type = "table";
            let tableFile = '';
            try {
                tableFile = yield file_utils_1.FileUtils.readFile(this.latestFile);
            }
            catch (error) {
                uiUtils.warning({ message: `File ${this.latestFile} does not exist`, origin: 'DatabaseTable' });
                return;
            }
            tableFile = syntax_utils_1.SyntaxUtils.simplifyDbFileForAnalysis(tableFile);
            const tableNameMatch = /[table|exists] (\"?public\"?\.)?\"?([a-z0-9_]+)\"?\W?\(/i.exec(tableFile);
            if (tableNameMatch) {
                this.name = tableNameMatch[2];
                if (this.name.match(/[a-z0-9]{2,3}t_[a-z0-9_]+_[a-z0-9]{3}/i)) {
                    const [, dbPrefix, tableName, tableSuffix] = /([a-z0-9]{2,3})t_([a-z0-9_]+)_([a-z0-9]{3})/i.exec(this.name) || ['', '', '', ''];
                    this.dbPrefix = dbPrefix;
                    this.camelCasedName = syntax_utils_1.SyntaxUtils.snakeCaseToCamelCase(tableName);
                    this.tableSuffix = tableSuffix;
                }
            }
            const stringBeforeCreate = tableFile.substr(0, tableFile.indexOf('create'));
            this.tags = (stringBeforeCreate.match(/#[a-z-]+(=[\[|\(]?[a-zA-Z0-9-_' ,]+[\]|\)]?)?/gi) || [])
                .reduce((agg, current) => {
                const tag = new Tag(current);
                return Object.assign(Object.assign({}, agg), { [tag.name]: tag });
            }, {});
            const tableMatch = /\((.*?)\);/.exec(tableFile);
            if (tableMatch) {
                const fieldsAsStringWithParenthesis = tableMatch[1];
                const fieldsAsString = fieldsAsStringWithParenthesis;
                const fields = fieldsAsString.split(',').reduce((agg, curr, i) => {
                    if (i === 0) {
                        return [curr];
                    }
                    const aggMatchOpen = agg[agg.length - 1].match(/\(/g);
                    if (aggMatchOpen) {
                        const aggMatchClose = agg[agg.length - 1].match(/\)/g);
                        if (!aggMatchClose) {
                            agg[agg.length - 1] += ',' + curr;
                            return agg;
                        }
                        else if (aggMatchOpen.length > aggMatchClose.length) {
                            agg[agg.length - 1] += ',' + curr;
                            return agg;
                        }
                    }
                    const aggMatchOpenSquare = agg[agg.length - 1].match(/\[/g);
                    if (aggMatchOpenSquare) {
                        const aggMatchCloseSquare = agg[agg.length - 1].match(/\]/g);
                        if (!aggMatchCloseSquare) {
                            agg[agg.length - 1] += ',' + curr;
                            return agg;
                        }
                        else if (aggMatchOpenSquare.length > aggMatchCloseSquare.length) {
                            agg[agg.length - 1] += ',' + curr;
                            return agg;
                        }
                    }
                    agg.push(curr);
                    return agg;
                }, []).map(x => x.trim());
                const newFields = fields.map(x => {
                    return {
                        fullText: x,
                        split: x.split(' ')
                    };
                });
                for (let i = 0; i < newFields.length; i++) {
                    const field = newFields[i];
                    if (TableConstraintsFirstWord.find(fw => field.split[0].toLowerCase().indexOf(fw) > -1)) {
                        continue;
                    }
                    this.fields[field.split[0]] = new DatabaseTableField(field, this.tableSuffix);
                }
            }
            const primaryKeyName = Object.keys(this.fields).find(x => this.fields[x].isPrimaryKey);
            if (primaryKeyName) {
                this.primaryKey = this.fields[primaryKeyName];
            }
        });
    }
}
exports.DatabaseTable = DatabaseTable;
class DatabaseLocalReplicatedTable extends DatabaseSubObject {
    constructor(params) {
        super(params);
        this.fields = (params || {}).fields || {};
        this.tableSuffix = '';
        this.dbPrefix = '';
        this.camelCasedName = '';
        this.tags = {};
    }
    analyzeFile(uiUtils) {
        return __awaiter(this, void 0, void 0, function* () {
            this.type = "local-tables";
            let tableFile = '';
            try {
                tableFile = yield file_utils_1.FileUtils.readFile(this.latestFile);
            }
            catch (error) {
                uiUtils.warning({ message: `File ${this.latestFile} does not exist`, origin: 'DatabaseTable' });
                return;
            }
            tableFile = syntax_utils_1.SyntaxUtils.simplifyDbFileForAnalysis(tableFile);
            const tableNameMatch = /[table|exists] (\"?public\"?\.)?\"?([a-z0-9_]+)\"?\W?\(/i.exec(tableFile);
            if (tableNameMatch) {
                this.name = tableNameMatch[2];
                if (this.name.match(/[a-z0-9]{2,3}t_[a-z0-9_]+_[a-z0-9]{3}/i)) {
                    const [, dbPrefix, tableName, tableSuffix] = /([a-z0-9]{2,3})t_([a-z0-9_]+)_([a-z0-9]{3})/i.exec(this.name) || ['', '', '', ''];
                    this.dbPrefix = dbPrefix;
                    this.camelCasedName = syntax_utils_1.SyntaxUtils.snakeCaseToCamelCase(tableName);
                    this.tableSuffix = tableSuffix;
                }
            }
            const stringBeforeCreate = tableFile.substr(0, tableFile.indexOf('create'));
            this.tags = (stringBeforeCreate.match(/#[a-z-]+(=[\[|\(]?[a-zA-Z0-9-_' ,]+[\]|\)]?)?/gi) || [])
                .reduce((agg, current) => {
                const tag = new Tag(current);
                return Object.assign(Object.assign({}, agg), { [tag.name]: tag });
            }, {});
            const tableMatch = /\((.*?)\);/.exec(tableFile);
            if (tableMatch) {
                const fieldsAsStringWithParenthesis = tableMatch[1];
                const fieldsAsString = fieldsAsStringWithParenthesis;
                const fields = fieldsAsString.split(',').reduce((agg, curr, i) => {
                    if (i === 0) {
                        return [curr];
                    }
                    const aggMatchOpen = agg[agg.length - 1].match(/\(/g);
                    if (aggMatchOpen) {
                        const aggMatchClose = agg[agg.length - 1].match(/\)/g);
                        if (!aggMatchClose) {
                            agg[agg.length - 1] += ',' + curr;
                            return agg;
                        }
                        else if (aggMatchOpen.length > aggMatchClose.length) {
                            agg[agg.length - 1] += ',' + curr;
                            return agg;
                        }
                    }
                    const aggMatchOpenSquare = agg[agg.length - 1].match(/\[/g);
                    if (aggMatchOpenSquare) {
                        const aggMatchCloseSquare = agg[agg.length - 1].match(/\]/g);
                        if (!aggMatchCloseSquare) {
                            agg[agg.length - 1] += ',' + curr;
                            return agg;
                        }
                        else if (aggMatchOpenSquare.length > aggMatchCloseSquare.length) {
                            agg[agg.length - 1] += ',' + curr;
                            return agg;
                        }
                    }
                    agg.push(curr);
                    return agg;
                }, []).map(x => x.trim());
                const newFields = fields.map(x => {
                    return {
                        fullText: x,
                        split: x.split(' ')
                    };
                });
                for (let i = 0; i < newFields.length; i++) {
                    const field = newFields[i];
                    if (TableConstraintsFirstWord.find(fw => field.split[0].toLowerCase().indexOf(fw) > -1)) {
                        continue;
                    }
                    this.fields[field.split[0]] = new DatabaseTableField(field, this.tableSuffix);
                }
            }
            const primaryKeyName = Object.keys(this.fields).find(x => this.fields[x].isPrimaryKey);
            if (primaryKeyName) {
                this.primaryKey = this.fields[primaryKeyName];
            }
        });
    }
}
exports.DatabaseLocalReplicatedTable = DatabaseLocalReplicatedTable;
class DatabaseDataScript extends DatabaseSubObject {
    constructor(params) {
        super(params);
        this.tableChanges = {};
    }
    analyzeFile(uiUtils) {
        return __awaiter(this, void 0, void 0, function* () {
            this.type = "data";
            let tableFile = '';
            try {
                tableFile = yield file_utils_1.FileUtils.readFile(this.latestFile);
            }
            catch (error) {
                uiUtils.warning({ message: `File ${this.latestFile} does not exist`, origin: 'DatabaseTable' });
                return;
            }
            tableFile = syntax_utils_1.SyntaxUtils.simplifyDbFileForAnalysis(tableFile);
            const inserts = tableFile.match(/insert\W*into\W*[a-z0-9_]+\W*\(((([a-z0-9_]+)[, ]*)+)\)[^;]+/gmi) || [];
            for (let i = 0; i < inserts.length; i++) {
                const insert = inserts[i];
                const narrowedDownRegex = /insert\W*into\W*([a-z0-9_]+)\W*\(([^)]+)\)\W*(select|values)([^;]+)/gmi.exec(insert) || [];
                // console.log(narrowedDownRegex);
                // console.log(narrowedDownRegex.join('\n###'));
                const tableName = narrowedDownRegex[1];
                const fields = (narrowedDownRegex[2] || '').split(',');
                const selectOrValues = (narrowedDownRegex[3] ? narrowedDownRegex[3].toLowerCase() : null);
                let currentIndex = 0;
                // we check if the tableChanges contain the table
                if (this.tableChanges[tableName]) {
                    // if so, we have to check the fields, and do some eventual modifications to it
                    currentIndex = this.tableChanges[tableName].length;
                }
                else {
                    // the table does not yet exist in this file, we gonna create it
                    this.tableChanges[tableName] = [];
                }
                this.tableChanges[tableName][currentIndex] = {
                    fields, records: [], type: selectOrValues
                };
                // now, depending on the record type, we check what we can do
                if (!selectOrValues) {
                    throw `Ununderstood insert type on ${this.latestFile}, expected are SELECT and VALUES`;
                }
                else if (selectOrValues === 'values') {
                    this.tableChanges[tableName][currentIndex].records = (narrowedDownRegex[4] || '')
                        // remove first and last parentheses
                        .replace(/^\(.*?\)$/, '$1')
                        // splits the records
                        .split(/\),\(/g);
                }
                else if (selectOrValues === 'select') {
                    this.tableChanges[tableName][currentIndex].records = (narrowedDownRegex[4] ? 'SELECT ' + narrowedDownRegex[4] : '')
                        // splits the records
                        .split(/\WUNION\WALL\W|\WUNION\W/gmi)
                        .map(x => x.replace(/^\W*SELECT\W/i, ''));
                }
            }
        });
    }
}
exports.DatabaseDataScript = DatabaseDataScript;
class DatabaseObject {
    constructor(params) {
        params = params || {};
        this._versions = [];
        this.setup = params.setup || {};
        this.table = params.table || {};
        this.function = params.function || {};
        this.index = params.index || {};
        this.type = params.type || {};
        this.data = params.data || {};
        this.sequence = params.sequence || {};
        this.trigger = params.trigger || {};
        this.view = params.view || {};
        this['foreign-servers'] = params['foreign-servers'] || {};
        this['user-mappings'] = params['user-mappings'] || {};
        this['local-tables'] = params['local-tables'] || {};
        this['foreign-tables'] = params['foreign-tables'] || {};
        this['source-specific-app-setup'] = params['source-specific-app-setup'] || {};
        this['data-transfers'] = params['data-transfers'] || {};
        this['external-system-integrations'] = params['external-system-integrations'] || {};
        this['data-exchange'] = params['data-exchange'] || {};
        this['users-roles-permissions'] = params['users-roles-permissions'] || {};
        this['full-text-catalogues'] = params['full-text-catalogues'] || {};
        this['script'] = params['script'] || {};
        this._properties = params._properties || {
            dbName: '',
            hasCurrent: false,
            path: '',
            lastVersion: ''
        };
        this._parameters = params._parameters || {};
    }
}
exports.DatabaseObject = DatabaseObject;
class DatabaseFile {
    constructor(repoName, fileName) {
        this.type = 'unknown';
        this.fileName = repoName + fileName;
        if (fileName.includes('00-database-setup')) {
            this.type = 'setup';
        }
        else if (fileName.includes('03-tables')) {
            this.type = 'table';
        }
        else if (fileName.includes('0q-types')) {
            this.type = 'type';
        }
        else if (fileName.includes('07-functions')) {
            this.type = 'function';
        }
        else if (fileName.includes('09-data')) {
            this.type = 'data';
        }
        else if (fileName.includes('04-sequences')) {
            this.type = 'sequence';
        }
        else if (fileName.includes('05-indexes')) {
            this.type = 'index';
        }
        else if (fileName.includes('06-views')) {
            this.type = 'view';
        }
        else if (fileName.includes('08-triggers')) {
            this.type = 'trigger';
        }
        else if (fileName.includes('00-foreign-servers')) {
            this.type = 'foreign-servers';
        }
        else if (fileName.includes('01-user-mappings')) {
            this.type = 'user-mappings';
        }
        else if (fileName.includes('02-local-tables')) {
            this.type = 'local-tables';
        }
        else if (fileName.includes('03-foreign-tables')) {
            this.type = 'foreign-tables';
        }
        else if (fileName.includes('04-source-specific-app-setup')) {
            this.type = 'source-specific-app-setup';
        }
        else if (fileName.includes('01-data-transfers')) {
            this.type = 'data-transfers';
        }
        else if (fileName.includes('02-external-system-integrations')) {
            this.type = 'external-system-integrations';
        }
        else if (fileName.includes('03-data-exchange')) {
            this.type = 'data-exchange';
        }
        else if (fileName.includes('10-users-roles-permissions')) {
            this.type = 'users-roles-permissions';
        }
        else if (fileName.includes('11-full-text-catalogues')) {
            this.type = 'full-text-catalogues';
        }
        else if (fileName.includes('scripts')) {
            this.type = 'script';
        }
        const fileNameSplit = fileName.split('/');
        this.objectName = fileNameSplit[fileNameSplit.length - 1].split('.')[0];
    }
}
exports.DatabaseFile = DatabaseFile;
class DatabaseVersion {
    constructor(params, fileName, unmappedFiles) {
        this.userToUse = params.userToUse;
        this.databaseToUse = params.databaseToUse;
        this.dependencies = params.dependencies || [];
        this.fileList = params.fileList || [];
        const fileNameMinusVersion = fileName.split('/postgres/release')[0];
        this.files = this.fileList.map(file => {
            return new DatabaseFile(fileNameMinusVersion, file.replace(/\.\.\//g, ''));
        });
        this.unmappedFileList = (unmappedFiles || []);
        this.unmappedFiles = this.unmappedFileList.map(file => {
            return new DatabaseFile(fileNameMinusVersion, file.replace(/\.\.\//g, ''));
        });
    }
}
exports.DatabaseVersion = DatabaseVersion;
class DatabaseVersionFile {
    constructor(fileName, params, allFiles) {
        this.fileName = fileName;
        const fileNameSplit = this.fileName.split('/');
        this.versionName = fileNameSplit[fileNameSplit.length - 2];
        const thisVersionUnmappedFiles = (allFiles || []).filter(sqlFileName => sqlFileName.indexOf(`postgres/release/${this.versionName}/`) > -1);
        this.versions = (params || []).map((x) => new DatabaseVersion(x, this.fileName, thisVersionUnmappedFiles));
    }
}
exports.DatabaseVersionFile = DatabaseVersionFile;

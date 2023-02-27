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
exports.DatabaseChecker = void 0;
const repository_utils_1 = require("../../utils/repository.utils");
const database_helper_1 = require("./database-helper");
const database_tagger_1 = require("./database-tagger");
const database_repo_reader_1 = require("./database-repo-reader");
const colors_1 = __importDefault(require("colors"));
const path_1 = __importDefault(require("path"));
const file_utils_1 = require("../../utils/file.utils");
const database_file_helper_1 = require("./database-file-helper");
class DatabaseChecker {
    static checkCode(params, uiUtils) {
        return __awaiter(this, void 0, void 0, function* () {
            yield repository_utils_1.RepositoryUtils.checkOrGetApplicationName(params, 'database', uiUtils);
            // get the db as object to get the params
            let databaseObject = yield database_helper_1.DatabaseHelper.getApplicationDatabaseObject(params.applicationName);
            yield repository_utils_1.RepositoryUtils.readRepository({
                startPath: databaseObject._properties.path,
                type: "postgres"
            }, uiUtils);
            databaseObject = yield database_helper_1.DatabaseHelper.getApplicationDatabaseObject(params.applicationName);
            // get the application and its versions
            let databaseData = yield database_helper_1.DatabaseHelper.getApplicationDatabaseFiles(params.applicationName);
            if (!databaseData || !databaseObject) {
                throw 'Invalid application name. Please run the "am repo read" command in the desired folder beforehand.';
            }
            yield this.checkFileName(databaseObject, params, uiUtils);
            yield this.checkFilesMovesOverVersions(databaseObject, params, uiUtils);
            yield this.checkVersionFilesAreInVersionFolder(databaseObject, params, uiUtils);
            yield this.checkFilesInSchemaFolder(databaseObject, params, uiUtils);
            yield this.checkForeignKeys(databaseObject, params, uiUtils);
            yield this.checkReplicatedTableUniqueIndex(databaseObject, params, uiUtils);
        });
    }
    static checkVersionFilesAreInVersionFolder(databaseObject, params, uiUtils) {
        return __awaiter(this, void 0, void 0, function* () {
            uiUtils.info({
                origin: this._origin,
                message: `Checking that the files to install in the version are in the version folder`
            });
            let databaseVersionObjects = yield database_helper_1.DatabaseHelper.getApplicationDatabaseFiles(params.applicationName);
            const incorrectFiles = databaseVersionObjects
                .map(databaseVersionObject => {
                const regexVersion = new RegExp(`^\\.\\.\\/\\/postgres\\/release\\/${databaseVersionObject.versionName}\\/`);
                return databaseVersionObject.versions
                    .map(version => version.fileList.filter(f => !regexVersion.test(f)))
                    .reduce((agg, curr) => [...agg, ...curr.map(c => ({ version: databaseVersionObject.versionName, fileName: c }))], []);
            }).reduce((agg, curr) => [...agg, ...curr], []);
            if (incorrectFiles.length) {
                const choice = yield uiUtils.choices({
                    title: 'versionFiles',
                    message: `We found ${incorrectFiles.length} files that should be in their version folder and are not\n${incorrectFiles.map(({ version, fileName }) => `${version} - ${fileName}`).join('\n')}\n Do you want to fix those ?`,
                    choices: ['Yes', 'No']
                });
                if (choice['versionFiles'] === 'Yes') {
                    for (let i = 0; i < incorrectFiles.length; i++) {
                        const incorrectFile = incorrectFiles[i];
                        // first check if the file is contained in the version
                        const fromFileName = databaseObject._properties.path + incorrectFile.fileName
                            .replace(/^\.\.\/\/postgres/, `\/postgres`);
                        const newShortName = incorrectFile.fileName
                            .replace(/^\.\.\/\/postgres/, `\/postgres\/release\/${incorrectFile.version}`);
                        const toFileName = databaseObject._properties.path + newShortName;
                        let inVersionFolder = file_utils_1.FileUtils.checkIfFolderExists(toFileName);
                        if (!inVersionFolder) {
                            const choiceCopyFromLocation = yield uiUtils.choices({
                                title: 'choiceCopyFromLocation',
                                message: `${incorrectFile.version} ${incorrectFile.fileName} is not in the version's folder. Do you want to copy the one that is specified in the version.json file ?`,
                                choices: ['Yes', 'No']
                            });
                            if (choiceCopyFromLocation.choiceCopyFromLocation === 'Yes') {
                                file_utils_1.FileUtils.copyFileSync(fromFileName, toFileName);
                                inVersionFolder = true;
                            }
                            else {
                                uiUtils.warning({
                                    origin: this._origin,
                                    message: `ignoring`
                                });
                            }
                        }
                        if (inVersionFolder) {
                            // update version.json
                            const versionJsonFileName = databaseObject._properties.path + `/postgres/release/${incorrectFile.version}/version.json`;
                            file_utils_1.FileUtils.writeFileSync(versionJsonFileName, (yield file_utils_1.FileUtils.readFile(versionJsonFileName))
                                .replace(incorrectFile.fileName, '../' + newShortName));
                        }
                    }
                    yield database_repo_reader_1.DatabaseRepositoryReader.readRepo(databaseObject._properties.path, params.applicationName, uiUtils);
                    databaseObject = yield database_helper_1.DatabaseHelper.getApplicationDatabaseObject(params.applicationName);
                    uiUtils.success({
                        origin: this._origin,
                        message: `All done`
                    });
                }
                else {
                    uiUtils.warning({
                        origin: this._origin,
                        message: `ignoring`
                    });
                }
            }
            else {
                uiUtils.success({
                    origin: this._origin,
                    message: `All files are in the version's folder`
                });
            }
        });
    }
    static checkFilesMovesOverVersions(databaseObject, params, uiUtils) {
        return __awaiter(this, void 0, void 0, function* () {
            uiUtils.info({
                origin: this._origin,
                message: `Checking that the files in the versions are kept in the same "folder"`
            });
            const entitiesToCheck = [
                'table',
                'function',
                'setup',
                'index',
                'type',
                'data',
                'sequence',
                'trigger',
                'view',
                'foreign-servers',
                'user-mappings',
                'local-tables',
                'foreign-tables',
                'source-specific-app-setup',
                'data-transfers',
                'external-system-integrations',
                'data-exchange',
                'users-roles-permissions',
                'full-text-catalogues'
            ];
            for (let j = 0; j < entitiesToCheck.length; j++) {
                const entityToCheck = entitiesToCheck[j];
                const objectsWithIssues = Object.keys(databaseObject[entityToCheck]).reduce((agg, curr) => {
                    const obj = databaseObject[entityToCheck][curr];
                    const objectVersionsFiles = obj.versions.map(({ version, file }) => ({
                        version,
                        short: file.replace(/^.*?\/([0-9]+\.[0-9]+\.[0-9]+\.[0-9]+|current)\//, '\/')
                    }));
                    const issues = objectVersionsFiles.reduce((agg, curr, i) => {
                        if (i > 0) {
                            if (agg.current.toLowerCase() !== curr.short.toLowerCase()) {
                                agg.current = curr.short;
                                agg.switches.push({ version: curr.version, short: curr.short });
                            }
                            return agg;
                        }
                        else {
                            return {
                                switches: [{ version: curr.version, short: curr.short }],
                                current: curr.short
                            };
                        }
                    }, { switches: [], current: '' });
                    if (issues.switches.length > 1) {
                        agg[curr] = { obj, switches: issues.switches };
                    }
                    return agg;
                }, {});
                const keys = Object.keys(objectsWithIssues);
                if (keys.length) {
                    uiUtils.warning({
                        origin: this._origin,
                        message: `Checked ${Object.keys(databaseObject[entityToCheck]).length} file${Object.keys(databaseObject[entityToCheck]).length > 1 ? 's' : ''}, Found ${keys.length} issue${keys.length > 1 ? 's' : ''}\nWe will loop through them and let you decide what to do with th${keys.length > 1 ? 'ose' : 'is'} file${keys.length > 1 ? 's' : ''}`
                    });
                    for (let k = 0; k < keys.length; k++) {
                        const key = keys[k];
                        const choices = yield uiUtils.choices({
                            title: 'procesFile',
                            message: `${entityToCheck} "${key}" has changed location over the time. Which location do you want to keep ?`,
                            choices: ['Ignore', ...objectsWithIssues[key].switches.map(({ version, short }) => `${version}\t-\t${short}`)]
                        });
                        if (choices['procesFile'] !== 'Ignore') {
                            const correctShort = choices['procesFile'].split('\t-\t')[1];
                            // get all the incorrect locations to update
                            const versionFilesToUpdate = objectsWithIssues[key].obj.versions.filter(({ file }) => !file.match(new RegExp(correctShort, 'i')));
                            for (let l = 0; l < versionFilesToUpdate.length; l++) {
                                const versionFileToUpdate = versionFilesToUpdate[l];
                                if (file_utils_1.FileUtils.checkIfFolderExists(versionFileToUpdate.file)) {
                                    const incorrectVersion = versionFileToUpdate.version;
                                    const incorrectShort = versionFileToUpdate.file.split(incorrectVersion)[1];
                                    // - create the file in the new location
                                    file_utils_1.FileUtils.writeFileSync(databaseObject._properties.path + `/postgres/release/${incorrectVersion}` + correctShort, (yield file_utils_1.FileUtils.readFile(versionFileToUpdate.file)));
                                    if (incorrectVersion === objectsWithIssues[key].obj.latestVersion) {
                                        // - create the file in the new location in the postgres/schema folder
                                        file_utils_1.FileUtils.writeFileSync(databaseObject._properties.path + `/postgres` + correctShort, (yield file_utils_1.FileUtils.readFile(versionFileToUpdate.file)));
                                    }
                                    // - update the version.json
                                    file_utils_1.FileUtils.writeFileSync(databaseObject._properties.path + `/postgres/release/${incorrectVersion}/version.json`, (yield file_utils_1.FileUtils.readFile(databaseObject._properties.path + `/postgres/release/${incorrectVersion}/version.json`))
                                        .replace(new RegExp(incorrectShort), correctShort));
                                    // - delete the old file
                                    if (file_utils_1.FileUtils.checkIfFolderExists(versionFileToUpdate.file)) {
                                        file_utils_1.FileUtils.deleteFileSync(versionFileToUpdate.file);
                                    }
                                    // - delete the old file in the postgres/schema folder
                                    if (file_utils_1.FileUtils.checkIfFolderExists(databaseObject._properties.path + `/postgres` + incorrectShort)) {
                                        file_utils_1.FileUtils.deleteFileSync(databaseObject._properties.path + `/postgres` + incorrectShort);
                                    }
                                }
                            }
                        }
                    }
                    uiUtils.info({
                        origin: this._origin,
                        message: `Cleaning the repository from empty folders...`
                    });
                    file_utils_1.FileUtils.deleteEmptyFolders({
                        startPath: databaseObject._properties.path
                    });
                    yield database_repo_reader_1.DatabaseRepositoryReader.readRepo(databaseObject._properties.path, params.applicationName, uiUtils);
                    databaseObject = yield database_helper_1.DatabaseHelper.getApplicationDatabaseObject(params.applicationName);
                    uiUtils.success({
                        origin: this._origin,
                        message: `All done`
                    });
                }
                else {
                    uiUtils.success({
                        origin: this._origin,
                        message: `Checked ${Object.keys(databaseObject[entityToCheck]).length} files for ${entityToCheck} for location change - all seem fine`
                    });
                }
            }
        });
    }
    static checkFilesInSchemaFolder(databaseObject, params, uiUtils) {
        return __awaiter(this, void 0, void 0, function* () {
            uiUtils.info({
                origin: this._origin,
                message: `Checking files in postgres/schema against postgres/release/*.*.*.*/schema`
            });
            let postgresSchemaFiles = yield file_utils_1.FileUtils.getFileList({
                startPath: path_1.default.resolve(databaseObject._properties.path, 'postgres', 'schema'),
                filter: /\.sql/
            });
            let postgresReleaseSchemaFiles = yield file_utils_1.FileUtils.getFileList({
                startPath: path_1.default.resolve(databaseObject._properties.path, 'postgres', 'release'),
                filter: /[0-9]+.[0-9]+.[0-9]+.[0-9]+(\/|\\)schema.*?\.sql$/
            });
            postgresSchemaFiles = postgresSchemaFiles.map(fileName => fileName.replace(databaseObject._properties.path + '/postgres/schema', '').toLowerCase());
            const flattenedPostgresReleaseSchemaFiles = postgresReleaseSchemaFiles
                .filter(fileName => fileName.indexOf('/current/') === -1)
                .map(fileName => ({
                fileName: fileName.toLowerCase(),
                version: fileName.match(/\/([0-9]+)\.([0-9]+)\.([0-9]+)\.([0-9]+)\//i).reduce((agg, curr, i) => {
                    if (i === 0 || i > 4) {
                        return agg;
                    }
                    return agg + `00000${curr}`.substring(-5);
                }, ''),
                short: fileName
                    .replace(new RegExp(databaseObject._properties.path + '\\/postgres\\/release\\/[0-9]+.[0-9]+.[0-9]+.[0-9]+\/schema'), '')
                    .toLowerCase()
            }))
                .reduce((agg, curr) => {
                agg[curr.short] = agg[curr.short] ? (agg[curr.short].version < curr.version ? curr : agg[curr.short]) : curr;
                return agg;
            }, {});
            postgresReleaseSchemaFiles = Object.keys(flattenedPostgresReleaseSchemaFiles);
            uiUtils.info({
                origin: this._origin,
                message: `Analyzing ${postgresSchemaFiles.length + postgresReleaseSchemaFiles.length} files...`
            });
            const missingFilesInPostgresSchema = postgresReleaseSchemaFiles.filter(x => postgresSchemaFiles.indexOf(x) === -1);
            yield this.checkFilesInVersionNotPostgres(flattenedPostgresReleaseSchemaFiles, missingFilesInPostgresSchema, databaseObject, uiUtils);
            const missingFilesInVersions = postgresSchemaFiles.filter(x => postgresReleaseSchemaFiles.indexOf(x) === -1);
            yield this.checkFilesInPostgresNotVersion(missingFilesInVersions, databaseObject, uiUtils);
            yield database_repo_reader_1.DatabaseRepositoryReader.readRepo(databaseObject._properties.path, params.applicationName, uiUtils);
            databaseObject = yield database_helper_1.DatabaseHelper.getApplicationDatabaseObject(params.applicationName);
        });
    }
    static checkFilesInPostgresNotVersion(missingFiles, databaseObject, uiUtils) {
        return __awaiter(this, void 0, void 0, function* () {
            uiUtils.info({
                origin: this._origin,
                message: `  - Checking missing files in versions and that exist in postgres/schema`
            });
            if (missingFiles.length) {
                const response = yield uiUtils.choices({
                    message: `  - ${missingFiles.length} missing files found:\n - ${missingFiles.join('\n - ')}\n Do you wnat to try and fix those ?`,
                    choices: ['Yes', 'No'],
                    title: 'Missing Files'
                });
                if (response['Missing Files'] === 'Yes') {
                    const responseMethod = yield uiUtils.choices({
                        message: `  - What do you want to do with them ?`,
                        choices: [
                            'Remove from postgres/schema',
                            'Solve one at a time'
                        ],
                        title: 'Mode'
                    });
                    if (responseMethod['Mode'] === 'Remove from postgres/schema') {
                        uiUtils.info({
                            origin: this._origin,
                            message: `  - Removing`
                        });
                        for (let i = 0; i < missingFiles.length; i++) {
                            const missingFileInPostgresSchema = missingFiles[i];
                            file_utils_1.FileUtils.deleteFileSync(databaseObject._properties.path + '/postgres/schema' + missingFileInPostgresSchema);
                        }
                        uiUtils.success({
                            origin: this._origin,
                            message: `  => Removed`
                        });
                    }
                    else if (responseMethod['Mode'] === 'Solve one at a time') {
                        for (let i = 0; i < missingFiles.length; i++) {
                            const missingFileInPostgresSchema = missingFiles[i];
                            const solution = yield uiUtils.choices({
                                message: `  - What do you want to do with "${missingFileInPostgresSchema}" ?`,
                                choices: [
                                    'Remove from postgres/schema',
                                    'Nothing'
                                ],
                                title: 'solution'
                            });
                            if (solution['solution'] === 'Remove from postgres/schema') {
                                file_utils_1.FileUtils.deleteFileSync(databaseObject._properties.path + '/postgres/schema' + missingFileInPostgresSchema);
                            }
                        }
                        uiUtils.success({
                            origin: this._origin,
                            message: `  => Solved`
                        });
                    }
                }
            }
            else {
                uiUtils.success({
                    origin: this._origin,
                    message: `  => All fine`
                });
            }
        });
    }
    static checkFilesInVersionNotPostgres(flattenedPostgresReleaseSchemaFiles, missingFiles, databaseObject, uiUtils) {
        return __awaiter(this, void 0, void 0, function* () {
            uiUtils.info({
                origin: this._origin,
                message: `  - Checking missing files in postgres/schema and that exist in version`
            });
            if (missingFiles.length) {
                const response = yield uiUtils.choices({
                    message: `  - ${missingFiles.length} missing files found:\n - ${missingFiles.join('\n - ')}\n Do you wnat to try and fix those ?`,
                    choices: ['Yes', 'No'],
                    title: 'Missing Files'
                });
                if (response['Missing Files'] === 'Yes') {
                    const responseMethod = yield uiUtils.choices({
                        message: `  - What do you want to do with them ?`,
                        choices: [
                            'Add them to postgres/schema',
                            'Solve one at a time'
                        ],
                        title: 'Mode'
                    });
                    if (responseMethod['Mode'] === 'Add them to postgres/schema') {
                        uiUtils.info({
                            origin: this._origin,
                            message: `  - Copying`
                        });
                        for (let i = 0; i < missingFiles.length; i++) {
                            const missingFileInPostgresSchema = flattenedPostgresReleaseSchemaFiles[missingFiles[i]];
                            file_utils_1.FileUtils.writeFileSync(databaseObject._properties.path + '/postgres/schema' + missingFileInPostgresSchema.short, yield file_utils_1.FileUtils.readFile(missingFileInPostgresSchema.fileName));
                        }
                        uiUtils.success({
                            origin: this._origin,
                            message: `  => Copied`
                        });
                    }
                    else if (responseMethod['Mode'] === 'Solve one at a time') {
                        for (let i = 0; i < missingFiles.length; i++) {
                            const missingFileInPostgresSchema = flattenedPostgresReleaseSchemaFiles[missingFiles[i]];
                            const solution = yield uiUtils.choices({
                                message: `  - What do you want to do with "${missingFileInPostgresSchema.short}" ?`,
                                choices: [
                                    'Add to postgres/schema',
                                    'Nothing'
                                ],
                                title: 'solution'
                            });
                            if (solution['solution'] === 'Add to postgres/schema') {
                                file_utils_1.FileUtils.writeFileSync(databaseObject._properties.path + '/postgres/schema' + missingFileInPostgresSchema.short, yield file_utils_1.FileUtils.readFile(missingFileInPostgresSchema.fileName));
                            }
                        }
                        uiUtils.success({
                            origin: this._origin,
                            message: `  => Solved`
                        });
                    }
                }
            }
            else {
                uiUtils.success({
                    origin: this._origin,
                    message: `  => All fine`
                });
            }
        });
    }
    static checkForeignKeys(databaseObject, params, uiUtils) {
        return __awaiter(this, void 0, void 0, function* () {
            uiUtils.info({
                origin: DatabaseChecker._origin,
                message: `Checking foreign keys...`
            });
            const objectsWithIssue = [];
            const filesToAnalyzeLength = Object.keys(databaseObject.table).length;
            if (filesToAnalyzeLength > 0) {
                let i = 0;
                if (Object.keys(databaseObject.table).length > 0) {
                    const keys = Object.keys(databaseObject.table);
                    for (let j = 0; j < keys.length; j++) {
                        uiUtils.progress(++i);
                        const key = keys[j];
                        // check that the files columns are named correctly (foreign keys are prefixed "fk_")
                        const fieldKeys = Object.keys(databaseObject.table[key].fields);
                        for (let k = 0; k < fieldKeys.length; k++) {
                            const field = databaseObject.table[key].fields[fieldKeys[k]];
                            if (field.isForeignKey) {
                                if (field.foreignKey && !field.tags['ignore-for-fk-check']) {
                                    const foreignKeyTableSuffix = (databaseObject.table[field.foreignKey.table] || databaseObject['local-tables'][field.foreignKey.table]).tableSuffix;
                                    if (field.name.indexOf('fk_') !== 0) {
                                        objectsWithIssue.push({
                                            objectName: databaseObject.table[key].name,
                                            fileName: key,
                                            fieldName: field.name,
                                            expected: `fk_${foreignKeyTableSuffix}_${databaseObject.table[key].tableSuffix}_`,
                                            objectType: 'table',
                                            issueType: 'incorrect-fk-name',
                                        });
                                    }
                                    else if (!field.name.match(new RegExp(`fk\_${foreignKeyTableSuffix}\_${databaseObject.table[key].tableSuffix}\_[a-z0-9_]+`))) {
                                        objectsWithIssue.push({
                                            objectName: databaseObject.table[key].name,
                                            fileName: key,
                                            fieldName: field.name,
                                            expected: `fk_${foreignKeyTableSuffix}_${databaseObject.table[key].tableSuffix}_`,
                                            objectType: 'table',
                                            issueType: 'incorrect-fk-name',
                                        });
                                    }
                                }
                            }
                            else if (field.name.indexOf('fk_') === 0) {
                                if (!field.tags['ignore-for-fk-check']) {
                                    objectsWithIssue.push({
                                        objectName: databaseObject.table[key].name,
                                        fileName: key,
                                        fieldName: field.name,
                                        expected: `${databaseObject.table[key].tableSuffix}_*`,
                                        objectType: 'table',
                                        issueType: 'not-fk',
                                    });
                                }
                            }
                        }
                    }
                }
                uiUtils.stoprProgress();
                objectsWithIssue.sort((a, b) => {
                    if (a.issueType < b.issueType) {
                        return -1;
                    }
                    else if (a.issueType > b.issueType) {
                        return 1;
                    }
                    return 0;
                });
                if (objectsWithIssue.length > 0) {
                    for (let i = 0; i < objectsWithIssue.length; i++) {
                        const objectWithIssue = objectsWithIssue[i];
                        if (objectWithIssue.issueType === 'incorrect-fk-name') {
                            uiUtils.warning({
                                origin: DatabaseChecker._origin,
                                message: `   - ${objectWithIssue.objectType} "${objectWithIssue.fileName}"."${colors_1.default.yellow(objectWithIssue.fieldName)}" was expected to be called ${colors_1.default.green(objectWithIssue.expected)}*`
                            });
                        }
                        else if (objectWithIssue.issueType === 'not-fk') {
                            uiUtils.warning({
                                origin: DatabaseChecker._origin,
                                message: `   - ${objectWithIssue.objectType} "${objectWithIssue.fileName}"."${colors_1.default.yellow(objectWithIssue.fieldName)}" does not seem to be a foreign key, and yet is prefixed "fk"`
                            });
                        }
                    }
                    let fix = (yield uiUtils.choices({
                        title: 'do-it',
                        message: `Do you want to fix the file issues above ?`,
                        choices: ['Yes', 'No'],
                    }))['do-it'] === 'Yes';
                    if (fix) {
                        uiUtils.info({
                            origin: DatabaseChecker._origin,
                            message: `Fixing...`
                        });
                        // we first process 'incorrect-fk-name'
                        let objectsToProcess = objectsWithIssue.filter(x => x.issueType === 'incorrect-fk-name');
                        if (objectsToProcess.length) {
                            for (let i = 0; i < objectsToProcess.length; i++) {
                                const objectToProcess = objectsToProcess[i];
                                yield this.fixForeignKeyNameIssue(objectToProcess, databaseObject, params, uiUtils);
                            }
                        }
                        objectsToProcess = objectsWithIssue.filter(x => x.issueType === 'not-fk');
                        if (objectsToProcess.length) {
                            for (let i = 0; i < objectsToProcess.length; i++) {
                                const objectToProcess = objectsToProcess[i];
                                yield this.fixNotFkIssue(objectToProcess, databaseObject, params, uiUtils);
                            }
                        }
                        uiUtils.success({
                            origin: DatabaseChecker._origin,
                            message: `Fixed`
                        });
                        yield database_repo_reader_1.DatabaseRepositoryReader.readRepo(databaseObject._properties.path, params.applicationName, uiUtils);
                        databaseObject = yield database_helper_1.DatabaseHelper.getApplicationDatabaseObject(params.applicationName);
                    }
                }
                else {
                    uiUtils.success({
                        origin: DatabaseChecker._origin,
                        message: `Checked ${filesToAnalyzeLength} files for foreign keys - The files are looking all good.`
                    });
                }
            }
        });
    }
    static checkReplicatedTableUniqueIndex(databaseObject, params, uiUtils) {
        return __awaiter(this, void 0, void 0, function* () {
            const objectsWithIssue = [];
            const filesToAnalyzeLength = Object.keys(databaseObject['local-tables']).length;
            if (filesToAnalyzeLength > 0) {
                let i = 0;
                if (Object.keys(databaseObject['local-tables']).length > 0) {
                    const keys = Object.keys(databaseObject['local-tables']);
                    for (let i = 0; i < keys.length; i++) {
                        const key = keys[i];
                        // check that the column named 'pk_*' is unique or primary key
                        const fileString = yield file_utils_1.FileUtils.readFile(databaseObject['local-tables'][key].latestFile);
                        const matched = fileString.match(/\W(pk_[a-z0-9]{3}_id)\W([^,]+),/i);
                        if (matched) {
                            const restOfTheCode = matched[2].toLowerCase();
                            if (restOfTheCode.indexOf('unique') === -1) {
                                objectsWithIssue.push({
                                    objectName: key,
                                    fileName: key,
                                    fieldName: matched[1].toLowerCase(),
                                    objectType: 'local-tables',
                                    issueType: 'no-index-on-local-replicated-table',
                                    usefulData: {
                                        fullFieldText: matched[0]
                                    }
                                });
                            }
                        }
                    }
                }
                uiUtils.stoprProgress();
                if (objectsWithIssue.length > 0) {
                    for (let i = 0; i < objectsWithIssue.length; i++) {
                        const objectWithIssue = objectsWithIssue[i];
                        uiUtils.warning({
                            origin: DatabaseChecker._origin,
                            message: `   - ${objectWithIssue.objectType} "${objectWithIssue.fileName}"."${colors_1.default.yellow(objectWithIssue.fieldName)}" does not have an index defined on it`
                        });
                    }
                    let fix = (yield uiUtils.choices({
                        title: 'do-it',
                        message: `Do you want to fix the file issues above ?`,
                        choices: ['Yes', 'No'],
                    }))['do-it'] === 'Yes';
                    if (fix) {
                        uiUtils.info({
                            origin: DatabaseChecker._origin,
                            message: `Fixing...`
                        });
                        const objectsToProcess = objectsWithIssue.filter(x => x.issueType === 'no-index-on-local-replicated-table');
                        if (objectsToProcess.length) {
                            for (let i = 0; i < objectsToProcess.length; i++) {
                                const objectToProcess = objectsToProcess[i];
                                yield this.fixNotIndexOnLocalReplicatedTableIssue(objectToProcess, databaseObject, params, uiUtils);
                            }
                        }
                        uiUtils.success({
                            origin: DatabaseChecker._origin,
                            message: `Fixed`
                        });
                        yield database_repo_reader_1.DatabaseRepositoryReader.readRepo(databaseObject._properties.path, params.applicationName, uiUtils);
                        databaseObject = yield database_helper_1.DatabaseHelper.getApplicationDatabaseObject(params.applicationName);
                    }
                }
                else {
                    uiUtils.success({
                        origin: DatabaseChecker._origin,
                        message: `Checked ${filesToAnalyzeLength} files for unique constraints issues - The files are looking all good.`
                    });
                }
            }
        });
    }
    static fixNotIndexOnLocalReplicatedTableIssue(objectWithIssue, databaseObject, params, uiUtils) {
        return __awaiter(this, void 0, void 0, function* () {
            uiUtils.info({
                origin: DatabaseChecker._origin,
                message: `Dealing with ${colors_1.default.green(objectWithIssue.objectName)}.${colors_1.default.green(objectWithIssue.fieldName || '')}`
            });
            // - Create the new table script, and the alter table script
            try {
                yield database_file_helper_1.DatabaseFileHelper.editObject({
                    applicationName: params.applicationName,
                    objectName: objectWithIssue.objectName,
                    objectType: 'local-table'
                }, uiUtils);
            }
            catch (e) {
                uiUtils.info({
                    origin: this._origin,
                    message: e.toString()
                });
            }
            const usefulData = objectWithIssue.usefulData || { fullFieldText: '' };
            uiUtils.info({
                origin: this._origin,
                message: `Updating ${objectWithIssue.objectName} script`
            });
            file_utils_1.FileUtils.writeFileSync(databaseObject.table[objectWithIssue.objectName].latestFile, (yield file_utils_1.FileUtils.readFile(databaseObject.table[objectWithIssue.objectName].latestFile))
                .replace(usefulData.fullFieldText, usefulData.fullFieldText.replace(/([,)])$/, ` UNIQUE \$1`)));
            // - update the alter script, and add the alter table add the constraint
            const newRenameScript = `ALTER TABLE ${objectWithIssue.objectName} ADD CONSTRAINT ${objectWithIssue.objectName}_${objectWithIssue.fieldName}_uniq UNIQUE (${objectWithIssue.fieldName});`;
            const currentAlterScriptPath = path_1.default.resolve(databaseObject._properties.path, 'postgres', 'release', 'current', 'scripts', `alter_${objectWithIssue.objectName}.sql`);
            let currentAlterScript = yield file_utils_1.FileUtils.readFile(currentAlterScriptPath);
            if (currentAlterScript) {
                currentAlterScript += '\r\n';
            }
            currentAlterScript += newRenameScript;
            uiUtils.info({
                origin: this._origin,
                message: `Updating ${objectWithIssue.objectName} alter script`
            });
            yield file_utils_1.FileUtils.writeFileSync(currentAlterScriptPath, currentAlterScript);
            yield database_repo_reader_1.DatabaseRepositoryReader.readRepo(databaseObject._properties.path, params.applicationName, uiUtils);
        });
    }
    static fixNotFkIssue(objectWithIssue, databaseObject, params, uiUtils) {
        return __awaiter(this, void 0, void 0, function* () {
            uiUtils.info({
                origin: DatabaseChecker._origin,
                message: `Dealing with ${colors_1.default.green(objectWithIssue.objectName)}.${colors_1.default.green(objectWithIssue.fieldName || '')}`
            });
            let fieldName = objectWithIssue.fieldName || '';
            let newFieldName = fieldName;
            let [, targetTableSuffix, sourceTableSuffix] = ['', '', ''];
            const matched = fieldName.match(/^fk_([a-z0-9]{3})_([a-z0-9]{3})_/i);
            if (matched) {
                [, targetTableSuffix, sourceTableSuffix] = matched;
            }
            const choice = yield uiUtils.choices({
                title: 'choice',
                choices: [
                    'Ignore for this run',
                    `Set up fk...`,
                    `Remove "fk" prefix`,
                    'Ignore for next runs',
                ],
                message: ` - What do you want to do for this field (${colors_1.default.green(objectWithIssue.objectName)}.${colors_1.default.green(objectWithIssue.fieldName || '')}) ?`
            });
            switch (choice['choice']) {
                case 'Ignore for this run':
                    return;
                case 'Set up fk...':
                    // first check that the second table suffix is the one of the current table
                    if (sourceTableSuffix !== databaseObject.table[objectWithIssue.objectName].tableSuffix) {
                        uiUtils.warning({
                            origin: DatabaseChecker._origin,
                            message: `The current field name does not map to this table - we will update the name to `
                        });
                        newFieldName = fieldName.replace(/^(fk_[a-z0-9]{3}_)([a-z0-9]{3})(_.*?)/i, `\$1${databaseObject.table[objectWithIssue.objectName].tableSuffix}\$3`);
                    }
                    // - Create the new table script, and the alter table script
                    try {
                        yield database_file_helper_1.DatabaseFileHelper.editObject({
                            applicationName: params.applicationName,
                            objectName: objectWithIssue.objectName,
                            objectType: 'table'
                        }, uiUtils);
                    }
                    catch (e) {
                        uiUtils.info({
                            origin: this._origin,
                            message: e.toString()
                        });
                    }
                    // check that we have a table with the correct suffix
                    let targetTableName = '';
                    const tableNames = Object.keys(databaseObject.table);
                    for (let i = 0; i < tableNames.length && !targetTableName; i++) {
                        const tableName = tableNames[i];
                        if (databaseObject.table[tableName].tableSuffix === targetTableSuffix) {
                            targetTableName = tableName;
                        }
                    }
                    let lookForTableText = 'Please tell us which table you want to link this field to';
                    if (targetTableName) {
                        // we are going to make sure the table we found is the one the user wants to create the FK for
                        const response = yield uiUtils.choices({
                            title: `Link to ${targetTableName}`,
                            message: `Is ${targetTableName} the table you want to create the link for ${fieldName} ?`,
                            choices: ['Yes', 'No']
                        });
                        if (response[`Link to ${targetTableName}`] === 'No') {
                            targetTableName = '';
                            lookForTableText += ' then';
                        }
                    }
                    if (!targetTableName) {
                        // if not, ask which one we have to select
                        while (!targetTableName) {
                            const response = yield uiUtils.question({
                                origin: DatabaseChecker._origin,
                                text: lookForTableText
                            });
                            try {
                                const databaseSubObject = (yield database_helper_1.DatabaseHelper.getDatabaseSubObject(Object.assign(Object.assign({}, params), { objectName: response, objectType: 'table' }), databaseObject, DatabaseChecker._origin, uiUtils));
                                targetTableName = databaseSubObject.name;
                            }
                            catch (error) {
                                yield uiUtils.error({
                                    origin: DatabaseChecker._origin,
                                    message: `Could not find an object with ${response} - please retry`
                                });
                            }
                        }
                    }
                    // when we know which table to link, create the fk
                    // - check whichif the field name is the one we expect
                    if (fieldName.toLowerCase().indexOf(`fk_${targetTableSuffix}_${databaseObject.table[targetTableName].tableSuffix}`) !== 0) {
                        uiUtils.warning({
                            origin: DatabaseChecker._origin,
                            message: `The current field name does not map to this table - we will update the name to `
                        });
                        newFieldName = fieldName.replace(/^(fk_)[a-z0-9]{3}_([a-z0-9]{3})(_.*?)/i, `\$1${targetTableSuffix}_${databaseObject.table[targetTableName].tableSuffix}_${databaseObject.table[objectWithIssue.objectName].tableSuffix}\$3`);
                    }
                    // - rename the field if needed
                    if (newFieldName !== fieldName) {
                        yield database_file_helper_1.DatabaseFileHelper.renameTableField({
                            applicationName: params.applicationName,
                            fieldName,
                            newName: newFieldName,
                            objectName: objectWithIssue.objectName
                        }, uiUtils);
                    }
                    // - update the current table script, and add the reference
                    const currentFileString = yield file_utils_1.FileUtils.readFile(databaseObject.table[objectWithIssue.objectName].latestFile);
                    let primaryKeyString = '';
                    if (databaseObject.table[targetTableName].primaryKey) {
                        primaryKeyString = databaseObject.table[targetTableName].primaryKey.name;
                    }
                    const fieldSettingsRegex = '+([^(),]+\\([^,]\\)|[^(),]+)(\\([^()]+\\))?[^(),\\/*]*(\\/\\*[^\\/*]+\\*\\/)?([,)])';
                    currentFileString.replace(new RegExp(`${newFieldName} ${fieldSettingsRegex}`, 'i'), `${newFieldName} \$1 REFERENCES ${targetTableName}(${primaryKeyString}) \$3\$4`);
                    databaseObject = yield database_helper_1.DatabaseHelper.getApplicationDatabaseObject(params.applicationName);
                    uiUtils.info({
                        origin: this._origin,
                        message: `Updating ${objectWithIssue.objectName} script`
                    });
                    file_utils_1.FileUtils.writeFileSync(databaseObject.table[objectWithIssue.objectName].latestFile, currentFileString);
                    // - update the alter script, and add the alter table add constraint
                    const newRenameScript = `ALTER TABLE ${objectWithIssue.objectName} ADD CONSTRAINT ${objectWithIssue.objectName}_${newFieldName} FOREIGN KEY (${newFieldName}) REFERENCES ${targetTableName} (${primaryKeyString});`;
                    const currentAlterScriptPath = path_1.default.resolve(databaseObject._properties.path, 'postgres', 'release', 'current', 'scripts', `alter_${objectWithIssue.objectName}.sql`);
                    let currentAlterScript = yield file_utils_1.FileUtils.readFile(currentAlterScriptPath);
                    if (currentAlterScript) {
                        currentAlterScript += '\r\n';
                    }
                    currentAlterScript += newRenameScript;
                    uiUtils.info({
                        origin: this._origin,
                        message: `Updating ${objectWithIssue.objectName} alter script`
                    });
                    yield file_utils_1.FileUtils.writeFileSync(currentAlterScriptPath, currentAlterScript);
                    yield database_repo_reader_1.DatabaseRepositoryReader.readRepo(databaseObject._properties.path, params.applicationName, uiUtils);
                    break;
                case 'Remove "fk" prefix':
                    yield database_file_helper_1.DatabaseFileHelper.renameTableField({
                        applicationName: params.applicationName,
                        fieldName,
                        newName: fieldName.replace(new RegExp(`^fk_[a-z0-9]{3}_${databaseObject.table[objectWithIssue.objectName].tableSuffix}_`, 'i'), databaseObject.table[objectWithIssue.objectName].tableSuffix),
                        objectName: objectWithIssue.objectName
                    }, uiUtils);
                    break;
                case 'Ignore for next runs':
                    yield database_tagger_1.DatabaseTagger.addTagOnField({
                        applicationName: params.applicationName,
                        objectName: objectWithIssue.objectName,
                        fieldName: fieldName,
                        tagName: 'ignore-for-fk-check',
                        tagValue: '',
                    }, uiUtils);
                    break;
                default:
                    break;
            }
            databaseObject = yield database_helper_1.DatabaseHelper.getApplicationDatabaseObject(params.applicationName);
        });
    }
    static fixForeignKeyNameIssue(objectWithIssue, databaseObject, params, uiUtils) {
        return __awaiter(this, void 0, void 0, function* () {
            let fieldName = objectWithIssue.fieldName || '';
            let expected = objectWithIssue.expected || '';
            let correctName = '';
            if (fieldName.match(new RegExp(`^fk_[a-z0-9]{3}\_[a-z0-9]{3}\_`, 'i'))) {
                // we have a correct structure, just not correctly used
                correctName = fieldName.replace(new RegExp(`^fk_[a-z0-9]{3}\_[a-z0-9]{3}\_`, 'i'), expected);
            }
            else if (fieldName.match(new RegExp(`[^a-z0-9]fk_[a-z0-9]{3}\_[a-z0-9]{3}\_`, 'i'))) {
                // something exists in front of thisthe fk prefix, for reasons unknown
                correctName = fieldName.replace(new RegExp(`^(.*?)fk_[a-z0-9]{3}\_[a-z0-9]{3}\_`, 'i'), expected);
            }
            else if (fieldName.match(new RegExp(`^${databaseObject.table[objectWithIssue.objectName].tableSuffix}_`, 'i'))) {
                // we created the fk not puting fk in front of the field
                correctName = fieldName.replace(new RegExp(`^${databaseObject.table[objectWithIssue.objectName].tableSuffix}_`, 'i'), expected);
            }
            let choice = { choice: `Rename to...` };
            if (correctName) {
                choice = yield uiUtils.choices({
                    title: 'choice',
                    choices: [
                        'Ignore for this run',
                        `Rename`,
                        `Rename to...`,
                        'Ignore for next runs',
                    ],
                    message: ` - We can rename "${objectWithIssue.fieldName}" to "${correctName}". What do you want to do ?`
                });
            }
            switch (choice['choice']) {
                case 'Ignore for this run':
                    return;
                case 'Rename to...':
                    while (!correctName.match(new RegExp(`^fk_[a-z0-9]{3}\_[a-z0-9]{3}\_[a-z0-9_]+$`, 'i'))) {
                        correctName = yield uiUtils.question({
                            origin: this._origin,
                            text: `What name do you want to name this field ? (it should start with "${expected}")`
                        });
                    }
                case 'Rename':
                    yield database_file_helper_1.DatabaseFileHelper.renameTableField({
                        applicationName: params.applicationName,
                        fieldName,
                        newName: correctName,
                        objectName: objectWithIssue.objectName
                    }, uiUtils);
                    return;
                case 'Ignore for next runs':
                    yield database_tagger_1.DatabaseTagger.addTagOnField({
                        applicationName: params.applicationName,
                        objectName: objectWithIssue.objectName,
                        fieldName: fieldName,
                        tagName: 'ignore-for-fk-check',
                        tagValue: '',
                    }, uiUtils);
                    return;
                default:
                    break;
            }
        });
    }
    static checkFileName(databaseObject, params, uiUtils) {
        return __awaiter(this, void 0, void 0, function* () {
            uiUtils.info({
                origin: DatabaseChecker._origin,
                message: `Checking file names against object names...`
            });
            const objectsWithIssue = [];
            const filesToAnalyzeLength = Object.keys(databaseObject.table).length +
                Object.keys(databaseObject.function).length;
            if (filesToAnalyzeLength > 0) {
                let i = 0;
                if (Object.keys(databaseObject.table).length > 0) {
                    const keys = Object.keys(databaseObject.table);
                    for (let j = 0; j < keys.length; j++) {
                        uiUtils.progress(++i);
                        const key = keys[j];
                        if (databaseObject.table[key].name !== key) {
                            // the name of the object is not the same as the file name, we have to report that
                            objectsWithIssue.push({
                                objectName: databaseObject.table[key].name,
                                fileName: key,
                                objectType: 'table',
                                issueType: 'incorrect-name',
                            });
                        }
                    }
                }
                if (Object.keys(databaseObject.function).length > 0) {
                    const keys = Object.keys(databaseObject.function);
                    for (let j = 0; j < keys.length; j++) {
                        uiUtils.progress(++i);
                        const key = keys[j];
                        if (databaseObject.function[key].name !== key) {
                            // the name of the object is not the same as the file name, we have to report that
                            objectsWithIssue.push({
                                objectName: databaseObject.function[key].name,
                                fileName: key,
                                objectType: 'function',
                                issueType: 'incorrect-name'
                            });
                        }
                    }
                }
                uiUtils.stoprProgress();
                if (objectsWithIssue.length > 0) {
                    for (let i = 0; i < objectsWithIssue.length; i++) {
                        const objectWithIssue = objectsWithIssue[i];
                        uiUtils.warning({
                            origin: DatabaseChecker._origin,
                            message: `   - ${objectWithIssue.objectType} "${colors_1.default.yellow(objectWithIssue.fileName)}" is actually named "${colors_1.default.green(objectWithIssue.objectName)}"`
                        });
                    }
                    let fix = (yield uiUtils.choices({
                        title: 'do-it',
                        message: `Do you want to fix the file issues above ?`,
                        choices: ['Yes', 'No'],
                    }))['do-it'] === 'Yes';
                    if (fix) {
                        uiUtils.info({
                            origin: DatabaseChecker._origin,
                            message: `Fixing...`
                        });
                        for (let i = 0; i < objectsWithIssue.length; i++) {
                            const objectWithFileNameIssue = objectsWithIssue[i];
                            yield this.fixFileNameIssue(objectWithFileNameIssue, databaseObject, uiUtils);
                        }
                        uiUtils.success({
                            origin: DatabaseChecker._origin,
                            message: `Fixed`
                        });
                        yield database_repo_reader_1.DatabaseRepositoryReader.readRepo(databaseObject._properties.path, params.applicationName, uiUtils);
                        databaseObject = yield database_helper_1.DatabaseHelper.getApplicationDatabaseObject(params.applicationName);
                    }
                }
                else {
                    uiUtils.success({
                        origin: DatabaseChecker._origin,
                        message: `Checked ${filesToAnalyzeLength} files for file name issue - The files are looking all good.`
                    });
                }
            }
        });
    }
    static fixFileNameIssue(objectWithIssue, databaseObject, uiUtils) {
        return __awaiter(this, void 0, void 0, function* () {
            uiUtils.info({
                origin: DatabaseChecker._origin,
                message: ` - Renaming ${objectWithIssue.objectType} "${objectWithIssue.fileName}" as "${objectWithIssue.objectName}"`
            });
            const currentObject = databaseObject[objectWithIssue.objectType][objectWithIssue.fileName];
            let lastVersion = '';
            for (let j = 0; j < currentObject.versions.length; j++) {
                const currentObjectVersion = currentObject.versions[j];
                // copy file content into new file name
                if (lastVersion !== currentObjectVersion.version) {
                    lastVersion = currentObjectVersion.version;
                    file_utils_1.FileUtils.writeFileSync(currentObjectVersion.file.replace(`${objectWithIssue.fileName}.sql`, `${objectWithIssue.objectName}.sql`), (yield file_utils_1.FileUtils.readFile(currentObjectVersion.file)));
                    // change version.json
                    const versionJsonFilePath = currentObjectVersion.file.replace(new RegExp(`(.*?\/postgres\/release\/${currentObjectVersion.version}\/)(.*?)$`), '\$1version.json');
                    const objectRelativePath = currentObjectVersion.file.replace(new RegExp(`.*?(postgres\/release\/${currentObjectVersion.version}.*?)${objectWithIssue.fileName}.sql`), '$1');
                    file_utils_1.FileUtils.writeFileSync(versionJsonFilePath, (yield file_utils_1.FileUtils.readFile(versionJsonFilePath))
                        .replace(`${objectRelativePath}${objectWithIssue.fileName}.sql`, `${objectRelativePath}${objectWithIssue.objectName}.sql`));
                    // // delete old object
                    file_utils_1.FileUtils.deleteFileSync(currentObjectVersion.file);
                }
            }
            // update schema file
            if (currentObject.latestVersion) {
                const existingSchemaFileNamePath = currentObject.latestFile
                    .replace(`release/${currentObject.latestVersion}/`, '/');
                const newSchemaFileNamePath = existingSchemaFileNamePath
                    .replace(`${objectWithIssue.fileName}.sql`, `${objectWithIssue.objectName}.sql`);
                file_utils_1.FileUtils.writeFileSync(newSchemaFileNamePath, yield file_utils_1.FileUtils.readFile(existingSchemaFileNamePath));
                file_utils_1.FileUtils.deleteFileSync(existingSchemaFileNamePath);
            }
        });
    }
}
exports.DatabaseChecker = DatabaseChecker;
DatabaseChecker._origin = 'DatabaseChecker';

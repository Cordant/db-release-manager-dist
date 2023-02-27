#!/usr/bin/env node
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
const command_line_args_1 = __importDefault(require("command-line-args"));
const server_utils_1 = require("./utils/server.utils");
const file_utils_1 = require("./utils/file.utils");
const path_1 = __importDefault(require("path"));
const repository_utils_1 = require("./utils/repository.utils");
const database_installer_1 = require("./classes/database/database-installer");
const database_version_checker_1 = require("./classes/database/database-version-checker");
const database_templates_1 = require("./classes/database/database-templates");
const database_checker_1 = require("./classes/database/database-checker");
const database_file_helper_1 = require("./classes/database/database-file-helper");
const database_tagger_1 = require("./classes/database/database-tagger");
const serverless_file_helper_1 = require("./classes/serverless/serverless-file-helper");
const frontend_file_helper_1 = require("./classes/frontend/frontend-file-helper");
const database_repo_reader_1 = require("./classes/database/database-repo-reader");
const logger_utils_1 = require("./utils/logger.utils");
const documentation_utils_1 = require("./utils/documentation.utils");
const serverless_repo_reader_1 = require("./classes/serverless/serverless-repo-reader");
const cli_files_1 = require("./classes/cli-files/cli-files");
const mainOptions = [
    { name: 'category', alias: 'z', type: String, defaultOption: true, description: 'Action' },
];
const options = (0, command_line_args_1.default)(mainOptions, { stopAtFirstUnknown: true });
let argv = options._unknown || [];
const loggerUtils = new logger_utils_1.LoggerUtils();
const main = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        switch (options.category) {
            case 'db':
            case 'database':
                const dbOptionsDefinitions = [
                    { name: 'action', defaultOption: true },
                    { name: 'environment', alias: 'e', type: String, description: 'environment' },
                    { name: 'application-name', alias: 'a', type: String, description: 'Application Name' },
                    { name: 'object-name', alias: 'o', type: String, description: 'Object Name' },
                    { name: 'source-database', alias: 'd', type: String, description: 'Source database for replications' },
                    { name: 'object-type', alias: 'y', type: String, description: 'Object Type' },
                    { name: 'version', alias: 'v', type: String, description: 'Version to install' },
                    { name: 'template', alias: 't', type: String, description: 'Template' },
                    { name: 'tag', alias: '#', type: String, description: 'Tag' },
                    { name: 'remove', alias: 'r', type: Boolean, description: 'Remove tag' },
                    { name: 'value', alias: 'u', type: String, description: 'Value' },
                    { name: 'filter', alias: 'f', type: String, description: 'field / regex filter to apply to the commands' },
                ];
                const dbOptions = (0, command_line_args_1.default)(dbOptionsDefinitions, { argv, stopAtFirstUnknown: true });
                switch (dbOptions.action) {
                    case 'version':
                    case 'v':
                        yield database_repo_reader_1.DatabaseRepositoryReader.updateVersionFile({
                            applicationName: dbOptions['application-name'],
                            version: dbOptions.version
                        }, loggerUtils);
                        break;
                    case 'replication-from':
                    case 'rf':
                        yield database_templates_1.DatabaseTemplates.setUpReplications({
                            applicationName: dbOptions['application-name'],
                            version: dbOptions.version,
                            fromOrTo: 'from',
                            tableName: dbOptions['object-name']
                        }, loggerUtils);
                        break;
                    case 'replication-to':
                    case 'rt':
                        yield database_templates_1.DatabaseTemplates.setUpReplications({
                            applicationName: dbOptions['application-name'],
                            version: dbOptions.version,
                            fromOrTo: 'to',
                            sourceDatabase: dbOptions['source-database'],
                            tableName: dbOptions['object-name']
                        }, loggerUtils);
                        break;
                    case 'install':
                    case 'i':
                        yield database_installer_1.DatabaseInstaller.installDatabase({
                            applicationName: dbOptions['application-name'],
                            environment: dbOptions.environment,
                            version: dbOptions.version
                        }, loggerUtils);
                        break;
                    case 'create-table':
                    case 'ct':
                        yield database_file_helper_1.DatabaseFileHelper.createTable({
                            applicationName: dbOptions['application-name'],
                            version: dbOptions.version
                        }, loggerUtils);
                        break;
                    case 'new-version':
                    case 'nv':
                        yield database_file_helper_1.DatabaseFileHelper.createVersion({
                            applicationName: dbOptions['application-name'],
                            version: dbOptions.version
                        }, loggerUtils);
                        break;
                    case 'init':
                    case 'n':
                        yield database_repo_reader_1.DatabaseRepositoryReader.initDatabase({
                            applicationName: dbOptions['application-name']
                        }, loggerUtils);
                        break;
                    case 'check-version':
                    case 'cv':
                        yield database_version_checker_1.DatabaseVersionChecker.checkVersion({
                            applicationName: dbOptions['application-name'],
                            version: dbOptions['version']
                        }, loggerUtils);
                        break;
                    case 'check-code':
                    case 'c':
                        yield database_checker_1.DatabaseChecker.checkCode({
                            applicationName: dbOptions['application-name']
                        }, loggerUtils);
                        break;
                    case 'params':
                    case 'p':
                        yield repository_utils_1.RepositoryUtils.checkDbParams({
                            filter: dbOptions.filter,
                            environment: dbOptions.environment
                        }, loggerUtils);
                        break;
                    case 'gf':
                    case 'generate-functions':
                        yield database_file_helper_1.DatabaseFileHelper.createFunctions({
                            applicationName: dbOptions['application-name'],
                            version: dbOptions['version'],
                            filter: dbOptions.filter,
                        }, loggerUtils);
                        break;
                    case 'e':
                    case 'edit-object':
                        yield database_file_helper_1.DatabaseFileHelper.editObject({
                            applicationName: dbOptions['application-name'],
                            objectName: dbOptions['object-name'],
                            objectType: dbOptions['object-type'],
                        }, loggerUtils);
                        break;
                    case 't':
                    case 'add-template':
                        yield database_templates_1.DatabaseTemplates.addTemplate({
                            applicationName: dbOptions['application-name'],
                            version: dbOptions['version'],
                            template: dbOptions.template,
                        }, loggerUtils);
                        break;
                    case '#':
                    case 'tag':
                        if (!dbOptions['filter']) {
                            if (!dbOptions['remove']) {
                                yield database_tagger_1.DatabaseTagger.addTagOnTable({
                                    applicationName: dbOptions['application-name'],
                                    objectName: dbOptions['object-name'],
                                    tagName: dbOptions['tag'],
                                    tagValue: dbOptions['value']
                                }, loggerUtils);
                            }
                            else {
                                yield database_tagger_1.DatabaseTagger.removeTagFromTable({
                                    applicationName: dbOptions['application-name'],
                                    objectName: dbOptions['object-name'],
                                    tagName: dbOptions['tag']
                                }, loggerUtils);
                            }
                        }
                        else {
                            if (!dbOptions['remove']) {
                                yield database_tagger_1.DatabaseTagger.addTagOnField({
                                    applicationName: dbOptions['application-name'],
                                    objectName: dbOptions['object-name'],
                                    fieldName: dbOptions['filter'],
                                    tagName: dbOptions['tag'],
                                    tagValue: dbOptions['value']
                                }, loggerUtils);
                            }
                            else {
                                yield database_tagger_1.DatabaseTagger.removeTagFromField({
                                    applicationName: dbOptions['application-name'],
                                    objectName: dbOptions['object-name'],
                                    fieldName: dbOptions['filter'],
                                    tagName: dbOptions['tag']
                                }, loggerUtils);
                            }
                        }
                        break;
                    default:
                    case 'h':
                    case 'help':
                        console.log(documentation_utils_1.databaseHelp);
                        break;
                }
                break;
            case 'm':
            case 'middle-tier':
                const serverlessOptionsDefinitions = [
                    { name: 'action', defaultOption: true },
                    { name: 'all', alias: 'e', type: String, description: 'environment' },
                    { name: 'type', alias: 't', type: String, description: 'Type of the repository to read' },
                    { name: 'application-name', alias: 'a', type: String, description: 'Application Name' },
                    { name: 'filter', alias: 'f', type: String, description: 'regex filter to apply to the commands' },
                    { name: 'database', alias: 'd', type: String, description: 'database name if DB name differs from the middle tier name' },
                ];
                const serverlessOptions = (0, command_line_args_1.default)(serverlessOptionsDefinitions, { argv, stopAtFirstUnknown: true });
                switch (serverlessOptions.action) {
                    case 'l':
                    case 'list-functions':
                        yield repository_utils_1.RepositoryUtils.listFunctions(serverlessOptions.filter, loggerUtils);
                    case 'gf':
                    case 'generate-functions':
                        yield serverless_file_helper_1.ServerlessFileHelper.generateFunctions({
                            applicationName: serverlessOptions['application-name'],
                            filter: serverlessOptions.filter
                        }, loggerUtils);
                    case 'cro':
                    case 'ro':
                    case 'check-read-only':
                        yield serverless_repo_reader_1.ServerlessRepositoryReader.checkPostgresCalls({
                            applicationName: serverlessOptions['application-name'],
                            databaseName: serverlessOptions['database'],
                            filter: serverlessOptions.filter
                        }, loggerUtils);
                    default:
                        break;
                }
                break;
            case 'frontend':
            case 'f':
                const frontendOptionsDefinitions = [
                    { name: 'action', defaultOption: true },
                    { name: 'all', alias: 'e', type: String, description: 'environment' },
                    { name: 'application-name', alias: 'a', type: String, description: 'Application Name' },
                    { name: 'filter', alias: 'f', type: String, description: 'regex filter to apply to the commands' },
                ];
                const frontendOptions = (0, command_line_args_1.default)(frontendOptionsDefinitions, { argv, stopAtFirstUnknown: true });
                switch (frontendOptions.action) {
                    case 'l':
                    case 'list-functions':
                        yield repository_utils_1.RepositoryUtils.listFunctions(frontendOptions.filter, loggerUtils);
                    case 'g':
                    case 'generate-code':
                        yield frontend_file_helper_1.FrontendFileHelper.generateCode({
                            applicationName: frontendOptions['application-name'],
                            filter: frontendOptions.filter
                        }, loggerUtils);
                    default:
                        break;
                }
                break;
            case 'repo':
            case 'r':
                const repoOptionsDefinitions = [
                    { name: 'action', defaultOption: true },
                    { name: 'all', alias: 'e', type: String, description: 'environment' },
                    { name: 'type', alias: 't', type: String, description: 'Type of the repository to read' },
                ];
                const repoOptions = (0, command_line_args_1.default)(repoOptionsDefinitions, { argv, stopAtFirstUnknown: true });
                switch (repoOptions.action) {
                    case 'read':
                    case 'r':
                        yield repository_utils_1.RepositoryUtils.readRepository({
                            type: repoOptions.type
                        }, loggerUtils);
                        break;
                    default:
                        break;
                }
                break;
            case 'c':
            case 'clear':
                yield file_utils_1.FileUtils.deleteFolderRecursiveSync(path_1.default.resolve(__dirname, '../../temp'));
                break;
            case 'files':
                yield cli_files_1.CliFiles.openFilesFolder();
                break;
            case 's':
            case 'server':
                const serverOptionsDefinitions = [
                    { name: 'action', defaultOption: true },
                ];
                const serverOptions = (0, command_line_args_1.default)(serverOptionsDefinitions, { argv, stopAtFirstUnknown: true });
                switch (serverOptions.action) {
                    case 'start':
                    case 's':
                        yield server_utils_1.ServerUtils.startServer();
                        process.exit();
                        break;
                    case 'stop':
                    case 'p':
                        yield server_utils_1.ServerUtils.stopServer();
                        break;
                    case 'check':
                    case 'c':
                        yield server_utils_1.ServerUtils.checkServer(true);
                        break;
                    default:
                        break;
                }
            default:
            case 'h':
            case 'help':
                console.log(documentation_utils_1.mainHelp);
                break;
        }
    }
    catch (error) {
        console.log(error);
    }
});
main();

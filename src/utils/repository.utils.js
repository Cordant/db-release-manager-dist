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
exports.RepositoryUtils = void 0;
const file_utils_1 = require("./file.utils");
const path_1 = __importDefault(require("path"));
const serverless_repo_reader_1 = require("../classes/serverless/serverless-repo-reader");
const database_repo_reader_1 = require("../classes/database/database-repo-reader");
const frontend_repo_reader_1 = require("../classes/frontend/frontend-repo-reader");
class RepositoryUtils {
    static checkOrGetApplicationName(params, type, uiUtils) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!params.applicationName) {
                params.applicationName = yield RepositoryUtils.getRepoName(uiUtils);
                if (!params.applicationName) {
                    throw 'No application name provided, please use the -an parameter.';
                }
            }
            if (type && !params.applicationName.match(new RegExp(`\-${type}$`))) {
                if (params.applicationName.match(/-database$|-frontend$|-middle-tier$/)) {
                    params.applicationName = params.applicationName.replace(/database$|frontend$|middle-tier$/, type);
                }
                else {
                    params.applicationName += `-${type}`;
                }
            }
        });
    }
    static getRepoName(uiUtils, startPath) {
        return __awaiter(this, void 0, void 0, function* () {
            let repoName = '';
            startPath = startPath || path_1.default.resolve(process.cwd());
            if (file_utils_1.FileUtils.checkIfFolderExists(path_1.default.resolve(startPath, '.git'))) {
                const gitFileData = yield file_utils_1.FileUtils.readFile(path_1.default.resolve(startPath, '.git', 'config'));
                const repoUrlRegexResult = gitFileData.match(/\/.*?\.git$/gim);
                if (repoUrlRegexResult) {
                    const repoUrlRegexResultSplit = repoUrlRegexResult[0].split(/\//);
                    repoName = repoUrlRegexResultSplit[repoUrlRegexResultSplit.length - 1].replace('.git', '');
                    uiUtils.info({ origin: 'RepositoryUtils', message: `Wotking with "${repoName}"` });
                }
            }
            return repoName;
        });
    }
    static readRepository(params, uiUtils) {
        return __awaiter(this, void 0, void 0, function* () {
            params.startPath = file_utils_1.FileUtils.replaceSlashes(params.startPath || '');
            const repoName = yield RepositoryUtils.getRepoName(uiUtils, params.startPath);
            const startPath = params.startPath || path_1.default.resolve(process.cwd());
            if (!repoName) {
                if (!params.subRepo) {
                    // check if the sub folders are git folders
                    const gitFileList = yield file_utils_1.FileUtils.getFileList({
                        startPath: startPath,
                        maxLevels: 3,
                        filter: /\/\.git\/config$/
                    });
                    if (gitFileList.length > 0) {
                        for (let i = 0; i < gitFileList.length; i++) {
                            const subFolder = gitFileList[i].replace(/\/.git\/config$/, '');
                            try {
                                yield RepositoryUtils.readRepository({
                                    startPath: subFolder,
                                    type: params.type,
                                    subRepo: true
                                }, uiUtils);
                            }
                            catch (error) {
                                uiUtils.info({ origin: this.origin, message: error.toString() });
                            }
                        }
                    }
                    else {
                        throw 'Please run this command in a git folder.';
                    }
                }
                else {
                    throw 'Please run this command in a git folder.';
                }
            }
            else {
                if (!params.type) {
                    if (repoName.match(/\-middle\-tier$/g)) {
                        params.type = 'serverless';
                    }
                    else if (repoName.match(/\-database$/g)) {
                        params.type = 'postgres';
                    }
                    else if (repoName.match(/\-frontend$/g)) {
                        params.type = 'frontend';
                    }
                    else {
                        throw 'No repository type provided. Please ensure you provide it through the "--type (-t)" option';
                    }
                }
                if (params.type === 'serverless') {
                    yield serverless_repo_reader_1.ServerlessRepositoryReader.readRepo(startPath, repoName, uiUtils);
                }
                else if (params.type === 'postgres') {
                    yield database_repo_reader_1.DatabaseRepositoryReader.readRepo(startPath, repoName, uiUtils);
                }
                else if (params.type === 'frontend') {
                    yield frontend_repo_reader_1.FrontendRepositoryReader.readRepo(startPath, repoName, uiUtils);
                }
            }
        });
    }
    static checkDbParams(params, uiUtils) {
        return __awaiter(this, void 0, void 0, function* () {
            yield database_repo_reader_1.DatabaseRepositoryReader.checkParams(params, uiUtils);
        });
    }
    static listFunctions(filter, uiUtils) {
        return __awaiter(this, void 0, void 0, function* () {
            yield serverless_repo_reader_1.ServerlessRepositoryReader.listFunctions(filter, uiUtils);
        });
    }
}
exports.RepositoryUtils = RepositoryUtils;
RepositoryUtils.origin = 'RepositoryUtils';

"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
exports.FileUtils = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const child_process_1 = require("child_process");
class FileUtils {
    static getFileList(params) {
        return __awaiter(this, void 0, void 0, function* () {
            params.startPath = FileUtils.replaceSlashes(params.startPath);
            params.currentLevel = (params.currentLevel || 0) + 1;
            const foldersToIgnore = params.foldersToIgnore || ['node_modules'];
            if (foldersToIgnore) {
                if (foldersToIgnore.indexOf('node_modules') === -1) {
                    foldersToIgnore.push('node_modules');
                }
            }
            if (!fs.existsSync(params.startPath)) {
                console.error(params.startPath + ' does not exist');
                return Promise.resolve([]);
            }
            else {
                let fileNames = fs.readdirSync(params.startPath);
                let directories = fileNames.filter((x) => {
                    let fileName = path.join(params.startPath, x);
                    let stat = fs.lstatSync(fileName);
                    if (stat.isDirectory()) {
                        return foldersToIgnore.filter(y => fileName.indexOf(y) === 0).length === 0;
                    }
                    return false;
                });
                let files = fileNames.filter((x) => {
                    let fileName = path.join(params.startPath, x);
                    let stat = fs.lstatSync(fileName);
                    return !stat.isDirectory() && params.filter.test(fileName);
                });
                if (directories.length > 0 && (!params.maxLevels || params.maxLevels >= params.currentLevel)) {
                    const fileLists = yield Promise.all(directories.map((x) => {
                        return FileUtils.getFileList(Object.assign(Object.assign({}, params), { startPath: params.startPath + '/' + x, foldersToIgnore: foldersToIgnore }));
                    }));
                    let fileList = fileLists.reduce((current, item) => current.concat(item), []);
                    const newFileList = fileList.concat(files.map((x) => params.startPath + '/' + x));
                    return newFileList;
                }
                else {
                    return files.map((x) => params.startPath + '/' + x);
                }
            }
        });
    }
    static deleteEmptyFolders(params) {
        params.startPath = FileUtils.replaceSlashes(params.startPath);
        params.currentLevel = (params.currentLevel || 0) + 1;
        if (!fs.existsSync(params.startPath)) {
            console.error(params.startPath + ' does not exist');
            return false;
        }
        else {
            let fileNames = fs.readdirSync(params.startPath);
            const { directories, hasFiles } = fileNames.reduce((agg, x) => {
                let fileName = path.join(params.startPath, x);
                let stat = fs.lstatSync(fileName);
                if (stat.isDirectory()) {
                    agg.directories.push(x);
                }
                else {
                    agg.hasFiles = true;
                }
                return agg;
            }, { directories: [], hasFiles: false });
            if (directories.length > 0 && (!params.maxLevels || params.maxLevels >= params.currentLevel)) {
                const canDeleteSubs = directories.map((x) => FileUtils.deleteEmptyFolders(Object.assign(Object.assign({}, params), { startPath: params.startPath + '/' + x })));
                if (!hasFiles && canDeleteSubs.filter(x => !x).length === 0) {
                    FileUtils.deleteFolderRecursiveSync(params.startPath);
                    return true;
                }
                return false;
            }
            else if (hasFiles) {
                return false;
            }
            else {
                FileUtils.deleteFolderRecursiveSync(params.startPath);
                return true;
            }
        }
    }
    static replaceSlashes(path) {
        return path
            .replace(/\/\//g, '/')
            .replace(/\\\\/g, '/')
            .replace(/\\/g, '/');
    }
    static getFolderList(params) {
        const foldersToIgnore = params.foldersToIgnore || ['node_modules'];
        if (foldersToIgnore) {
            if (foldersToIgnore.indexOf('node_modules') === -1) {
                foldersToIgnore.push('node_modules');
            }
        }
        if (!fs.existsSync(params.startPath)) {
            console.log(params.startPath + ' does not exist');
            return Promise.resolve([]);
        }
        else {
            let fileNames = fs.readdirSync(params.startPath);
            let directories = fileNames.filter((x) => {
                let fileName = path.join(params.startPath, x);
                let stat = fs.lstatSync(fileName);
                if (stat.isDirectory()) {
                    return foldersToIgnore.filter(y => fileName.indexOf(y) > -1).length === 0;
                }
                return false;
            });
            return Promise.resolve(directories.map(x => params.startPath + '/' + x));
        }
    }
    static readFile(fileName) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield new Promise((resolve, reject) => {
                fs.readFile(fileName, (error, data) => {
                    if (error) {
                        reject(error);
                    }
                    else {
                        resolve(data.toString('ascii'));
                    }
                });
            });
        });
    }
    static readFileSync(fileName) {
        return fs.readFileSync(fileName).toString('ascii');
    }
    static writeFileSync(fileName, content) {
        // LoggerUtils.info({origin: 'FileUtils', message: `Creating ${fileName}`});
        FileUtils.createFolderStructureIfNeeded(fileName);
        fs.writeFileSync(fileName, content);
    }
    static readJsonFile(fileName) {
        return new Promise((resolve, reject) => {
            fs.readFile(fileName, (error, data) => {
                if (error) {
                    reject(error);
                }
                else {
                    try {
                        resolve(JSON.parse(data.toString('ascii')));
                    }
                    catch (error) {
                        console.log(fileName);
                        reject(error);
                    }
                }
            });
        });
    }
    static createFolderIfNotExistsSync(folderName) {
        if (!fs.existsSync(folderName)) {
            fs.mkdirSync(folderName);
        }
    }
    static checkIfFolderExists(folderName) {
        return fs.existsSync(folderName);
    }
    static createFolderStructureIfNeeded(path, depth = 0) {
        const splitPath = path
            .replace(/\\/g, '/')
            .replace(/\/\//g, '/')
            .split('/');
        if (depth === splitPath.length - 1) {
            return;
        }
        else {
            FileUtils.createFolderIfNotExistsSync(splitPath.splice(0, depth + 1).join('/'));
            FileUtils.createFolderStructureIfNeeded(path, depth + 1);
        }
    }
    static renameFolder(from, to) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield new Promise((resolve, reject) => {
                fs.rename(from, to, (error) => {
                    if (error) {
                        console.log(error);
                        reject(error);
                    }
                    else {
                        resolve();
                    }
                });
            });
        });
    }
    static copyFileSync(from, to) {
        const source = FileUtils.readFileSync(from);
        FileUtils.writeFileSync(to, source);
    }
    static deleteFileSync(fileName) {
        fs.unlinkSync(fileName);
    }
    /**
     * Deletes folders recursively
     * @param path folder path
     * @param sub (used for logging purpose only)
     */
    static deleteFolderRecursiveSync(path, sub = false) {
        if (fs.existsSync(path)) {
            fs.readdirSync(path).forEach((file) => {
                const curPath = path + "/" + file;
                if (fs.lstatSync(curPath).isDirectory()) { // recurse
                    FileUtils.deleteFolderRecursiveSync(curPath, true);
                }
                else { // delete file
                    fs.unlinkSync(curPath);
                }
            });
            fs.rmdirSync(path);
        }
    }
    ;
    static openFileInFileEditor(fileName) {
        return __awaiter(this, void 0, void 0, function* () {
            yield new Promise((resolve, reject) => {
                try {
                    const cp = (0, child_process_1.exec)(`"${fileName}"`, (error, stdout, stderr) => {
                        if (error) {
                            reject(`exec error: ${error}`);
                            return;
                        }
                        cp.kill();
                        resolve();
                    });
                }
                catch (error) {
                    reject(error);
                }
            });
        });
    }
    static openFolderInExplorer() {
        return __awaiter(this, void 0, void 0, function* () {
            yield new Promise((resolve, reject) => {
                try {
                    const cp = (0, child_process_1.exec)(`start .`, (error) => {
                        if (error) {
                            reject(`exec error: ${error}`);
                            return;
                        }
                        cp.kill();
                        resolve();
                    });
                }
                catch (error) {
                    reject(error);
                }
            });
        });
    }
}
exports.FileUtils = FileUtils;

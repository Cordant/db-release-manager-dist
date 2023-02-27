"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CliFiles = void 0;
const file_utils_1 = require("../../utils/file.utils");
const database_helper_1 = require("../database/database-helper");
class CliFiles {
    static openDbDataFile() {
        file_utils_1.FileUtils.openFileInFileEditor(database_helper_1.DatabaseHelper.postgresDbDataPath);
    }
    static openFilesFolder() {
        file_utils_1.FileUtils.openFolderInExplorer();
    }
}
exports.CliFiles = CliFiles;

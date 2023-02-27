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
exports.ApplicationHelper = void 0;
const database_helper_1 = require("../database/database-helper");
class ApplicationHelper {
    static getApplications() {
        return __awaiter(this, void 0, void 0, function* () {
            const databaseObjects = yield database_helper_1.DatabaseHelper.getApplicationDatabaseObjects();
            const applications = Object.keys(databaseObjects)
                .map(databaseName => databaseName.replace(/-database$/i, ''));
            return applications;
        });
    }
    static getApplication(name) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!/-database$/.test(name)) {
                name = name + '-database';
            }
            const databaseObject = yield database_helper_1.DatabaseHelper.getApplicationDatabaseObject(name);
            return {
                name: name.replace(/-database$/, ''),
                database: databaseObject
            };
        });
    }
    static getDatabase(name) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!/-database$/.test(name)) {
                name = name + '-database';
            }
            return yield database_helper_1.DatabaseHelper.getApplicationDatabaseObject(name);
        });
    }
}
exports.ApplicationHelper = ApplicationHelper;

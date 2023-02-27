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
exports.DatabaseServer = void 0;
const application_helper_1 = require("../classes/application/application-helper");
const database_file_helper_1 = require("../classes/database/database-file-helper");
const database_repo_reader_1 = require("../classes/database/database-repo-reader");
const database_file_model_1 = require("../models/database-file.model");
const repository_utils_1 = require("../utils/repository.utils");
const database_installer_1 = require("../classes/database/database-installer");
const database_templates_1 = require("../classes/database/database-templates");
const database_tagger_1 = require("../classes/database/database-tagger");
const database_checker_1 = require("../classes/database/database-checker");
class DatabaseServer {
    static declareRoutes(app, socketUtils) {
        app.get('/databases/:name', (req, res) => __awaiter(this, void 0, void 0, function* () {
            res.send(yield application_helper_1.ApplicationHelper.getDatabase(req.params.name));
        }));
        app.get('/databases/:name/refresh', (req, res) => __awaiter(this, void 0, void 0, function* () {
            yield repository_utils_1.RepositoryUtils.readRepository({
                startPath: (yield application_helper_1.ApplicationHelper.getDatabase(req.params.name))._properties.path,
                type: 'postgres'
            }, socketUtils);
            res.send(yield application_helper_1.ApplicationHelper.getDatabase(req.params.name));
        }));
        app.get('/databases/:name/check-parameters/:environment', (req, res) => __awaiter(this, void 0, void 0, function* () {
            yield database_repo_reader_1.DatabaseRepositoryReader.checkParams({
                filter: req.params.name,
                environment: req.params.environment
            }, socketUtils);
            res.send(yield application_helper_1.ApplicationHelper.getDatabase(req.params.name));
        }));
        app.get('/databases/:name/check-code', (req, res) => __awaiter(this, void 0, void 0, function* () {
            // this one can take a whilel we do not wait
            database_checker_1.DatabaseChecker.checkCode({
                applicationName: req.params.name
            }, socketUtils);
            res.send('ongoing');
        }));
        app.get('/databases/:name/install/:version/:env', (req, res) => __awaiter(this, void 0, void 0, function* () {
            console.log('databases/:name/install/:version/:env');
            try {
                yield database_installer_1.DatabaseInstaller.installDatabase({
                    applicationName: req.params.name,
                    environment: req.params.env,
                    version: req.params.version === 'all' ? null : req.params.version
                }, socketUtils);
                res.send();
            }
            catch (error) {
                console.log(error);
                socketUtils.error({ origin: 'Server', message: JSON.stringify(error) });
            }
        }));
        app.post('/databases/:name/create-table', (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                yield database_file_helper_1.DatabaseFileHelper.createTable({
                    applicationName: req.params.name,
                    tableDetails: req.body
                }, socketUtils);
                res.send(yield application_helper_1.ApplicationHelper.getDatabase(req.params.name));
            }
            catch (error) {
                console.log(error);
                socketUtils.error({ origin: 'Server', message: JSON.stringify(error) });
            }
        }));
        app.post('/databases/:name/create-version', (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                yield database_file_helper_1.DatabaseFileHelper.createVersion({
                    applicationName: req.params.name
                }, socketUtils);
                res.send(yield application_helper_1.ApplicationHelper.getDatabase(req.params.name));
            }
            catch (error) {
                console.log(error);
                socketUtils.error({ origin: 'Server', message: JSON.stringify(error) });
            }
        }));
        app.post('/databases/:name/add-template', (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                yield database_templates_1.DatabaseTemplates.addTemplate({
                    applicationName: req.params.name,
                    template: req.body.template
                }, socketUtils);
                res.send(yield application_helper_1.ApplicationHelper.getDatabase(req.params.name));
            }
            catch (error) {
                console.log(error);
                socketUtils.error({ origin: 'Server', message: JSON.stringify(error) });
            }
        }));
        app.get('/databases/:name/create-functions', (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                yield database_file_helper_1.DatabaseFileHelper.createFunctions({
                    applicationName: req.params.name,
                    filter: req.query.filter
                }, socketUtils);
                res.send(yield application_helper_1.ApplicationHelper.getDatabase(req.params.name));
            }
            catch (error) {
                console.log(error);
                socketUtils.error({ origin: 'Server', message: JSON.stringify(error) });
            }
        }));
        app.get('/databases/:name/init', (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                yield database_repo_reader_1.DatabaseRepositoryReader.initDatabase({
                    applicationName: req.params.name
                }, socketUtils);
                res.send(yield application_helper_1.ApplicationHelper.getDatabase(req.params.name));
            }
            catch (error) {
                console.log(error);
                socketUtils.error({ origin: 'Server', message: JSON.stringify(error) });
            }
        }));
        app.get('/databases/:name/:objectType', (req, res) => __awaiter(this, void 0, void 0, function* () {
            const db = yield application_helper_1.ApplicationHelper.getDatabase(req.params.name);
            let obj = {};
            switch (req.params.objectType) {
                case 'tables':
                    obj = db.table;
                    break;
                case 'functionsta':
                    obj = db.function;
                    break;
                default:
                    break;
            }
            res.send(obj);
        }));
        app.post('/databases/:name/tables/:tableName/add-tag', (req, res) => __awaiter(this, void 0, void 0, function* () {
            yield database_tagger_1.DatabaseTagger.addTagOnTable({
                applicationName: req.params.name,
                objectName: req.params.tableName,
                tagName: req.body.tagName,
                tagValue: req.body.tagValue,
            }, socketUtils);
            res.send(yield application_helper_1.ApplicationHelper.getDatabase(req.params.name));
        }));
        app.post('/databases/:name/tables/:tableName/remove-tag', (req, res) => __awaiter(this, void 0, void 0, function* () {
            yield database_tagger_1.DatabaseTagger.removeTagFromTable({
                applicationName: req.params.name,
                objectName: req.params.tableName,
                tagName: req.body.tagName,
            }, socketUtils);
            res.send(yield application_helper_1.ApplicationHelper.getDatabase(req.params.name));
        }));
        app.post('/databases/:name/tables/:tableName/:field/add-tag', (req, res) => __awaiter(this, void 0, void 0, function* () {
            yield database_tagger_1.DatabaseTagger.addTagOnField({
                applicationName: req.params.name,
                objectName: req.params.tableName,
                fieldName: req.params.field,
                tagName: req.body.tagName,
                tagValue: req.body.tagValue,
            }, socketUtils);
            res.send(yield application_helper_1.ApplicationHelper.getDatabase(req.params.name));
        }));
        app.post('/databases/:name/tables/:tableName/:field/remove-tag', (req, res) => __awaiter(this, void 0, void 0, function* () {
            yield database_tagger_1.DatabaseTagger.removeTagFromField({
                applicationName: req.params.name,
                objectName: req.params.tableName,
                fieldName: req.params.field,
                tagName: req.body.tagName,
            }, socketUtils);
            res.send(yield application_helper_1.ApplicationHelper.getDatabase(req.params.name));
        }));
        app.get('/databases/:name/:objectType/:objectName/:version', (req, res) => __awaiter(this, void 0, void 0, function* () {
            const db = yield application_helper_1.ApplicationHelper.getDatabase(req.params.name);
            let obj = new database_file_model_1.DatabaseSubObject();
            switch (req.params.objectType) {
                case 'tables':
                    obj = db.table[req.params.objectName];
                    break;
                case 'functions':
                    obj = db.function[req.params.objectName];
                    break;
                default:
                    break;
            }
            if (req.params.version) {
                if (obj && obj.latestVersion !== req.params.version) {
                    // todo get the object in the required version
                }
            }
            res.send(obj);
        }));
        app.post('/databases/:name/:objectType/:objectName/edit', (req, res) => __awaiter(this, void 0, void 0, function* () {
            let objectType = '';
            switch (req.params.objectType) {
                case 'tables':
                    objectType = 'table';
                    break;
                case 'functions':
                    objectType = 'function';
                    break;
                default:
                    break;
            }
            yield database_file_helper_1.DatabaseFileHelper.editObject({
                applicationName: req.params.name,
                objectName: req.params.objectName,
                objectType: objectType
            }, socketUtils);
            res.send(yield application_helper_1.ApplicationHelper.getDatabase(req.params.name));
        }));
    }
}
exports.DatabaseServer = DatabaseServer;

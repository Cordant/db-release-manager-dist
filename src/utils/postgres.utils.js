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
exports.PostgresUtils = void 0;
const pg_promise_1 = __importDefault(require("pg-promise"));
class PostgresUtils {
    constructor() {
        this.connectionString = '';
        this.pgp = (0, pg_promise_1.default)();
        this.connections = {};
    }
    setConnectionString(connectionString, uiUtils) {
        if (this.connectionString !== connectionString) {
            this.connectionString = connectionString;
            if (!this.connections[this.connectionString]) {
                this.connections[this.connectionString] = this.pgp(this.connectionString);
            }
            this.db = this.connections[this.connectionString];
            uiUtils.info({
                origin: 'PostgresUtils',
                message: `Updated connection string, ${this.connectionString.replace(/\:.*?\@/gi, ':XXXXXXXXX@')}`
            });
        }
        return this;
    }
    execute(sql, data) {
        return __awaiter(this, void 0, void 0, function* () {
            if (data) {
                return this.db.any(sql, data);
            }
            else {
                return this.db.any(sql);
            }
        });
    }
    executeFunction(sql, data) {
        return new Promise((resolve, reject) => {
            if (data) {
                this.db.func(sql, data)
                    .then((data) => {
                    this.endConnection();
                    resolve(data);
                })
                    .catch((error) => {
                    console.log(sql);
                    console.log(error);
                    reject(error);
                    this.endConnection();
                });
            }
            else {
                this.db.func(sql)
                    .then((data) => {
                    this.endConnection();
                    resolve(data);
                })
                    .catch((error) => {
                    console.log(sql);
                    console.log(error);
                    reject(error);
                    this.endConnection();
                });
            }
        });
    }
    endConnection() {
        var _a, _b;
        if (this.db) {
            for (let key of Object.keys(this.connections)) {
                if (this.connections[key] === this.db) {
                    this.connections[key] = undefined;
                    (_b = (_a = this.db) === null || _a === void 0 ? void 0 : _a.$pool) === null || _b === void 0 ? void 0 : _b.end();
                }
            }
        }
    }
    endAllConnections() {
        var _a, _b;
        this.db = null;
        for (let key of Object.keys(this.connections)) {
            (_b = (_a = this.connections[key]) === null || _a === void 0 ? void 0 : _a.$pool) === null || _b === void 0 ? void 0 : _b.end();
            this.connections[key] = undefined;
        }
    }
}
exports.PostgresUtils = PostgresUtils;

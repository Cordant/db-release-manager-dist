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
exports.ServerUtils = void 0;
const axios_1 = __importDefault(require("axios"));
const path_1 = __importDefault(require("path"));
const child_process_1 = require("child_process");
class ServerUtils {
    static checkServer(check) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield axios_1.default.get('http://localhost:690/ping');
                if (response.data === 'pong') {
                    if (check) {
                        console.log('Server connected !');
                    }
                    return true;
                }
            }
            catch (error) {
                if (check) {
                    console.log('Server not connected');
                }
            }
            return false;
        });
    }
    static stopServer() {
        return __awaiter(this, void 0, void 0, function* () {
            if (yield ServerUtils.checkServer()) {
                try {
                    const response = yield axios_1.default.get('http://localhost:690/stop');
                    if (response.data === 'stopped') {
                        console.log('Server stopped !');
                    }
                }
                catch (error) {
                    console.log('Error stopping the server');
                }
            }
            else {
                console.log('Server not connected');
            }
        });
    }
    static startServer() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!(yield ServerUtils.checkServer())) {
                try {
                    const args = [
                        '/c',
                        'node',
                        path_1.default.resolve(process.argv[1], '../../../cli/build/server.js'),
                        '/b'
                    ];
                    // const child = fork(args[0]);
                    const child = (0, child_process_1.spawn)('cmd', args, {
                        detached: true,
                        stdio: 'ignore'
                    });
                    console.log('Should be started now...');
                }
                catch (error) {
                    console.log(error);
                    console.log('Error starting the server');
                }
            }
            else {
                console.log('Server already connected');
            }
        });
    }
    static somethingChanged(applicationName) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield axios_1.default.get('http://localhost:690/ping', {
                    timeout: 100
                });
                if (response.data === 'pong') {
                    yield axios_1.default.post('http://localhost:690/cli/something-changed', { applicationName });
                }
            }
            catch (_e) {
            }
        });
    }
}
exports.ServerUtils = ServerUtils;

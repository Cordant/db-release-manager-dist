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
exports.SocketUtils = void 0;
class SocketUtils {
    constructor() {
    }
    attachClient(client) {
        this.client = client;
    }
    emit(message, params) {
        if (this.client) {
            this.client.emit(message, params);
        }
    }
    log(params) {
        this.client.emit('log', params);
    }
    info(params) {
        this.client.emit('info', params);
    }
    error(params) {
        this.client.emit('error', params);
    }
    warning(params) {
        this.client.emit('warning', params);
    }
    success(params) {
        this.client.emit('success', params);
    }
    question(params) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield new Promise((resolve) => {
                this.client.on('response', (response) => {
                    resolve(response);
                });
                this.client.emit('question', params);
            });
        });
    }
    choices(params) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield new Promise((resolve) => {
                this.client.on('choice', (response) => {
                    resolve(response);
                });
                this.client.emit('choices', params);
            });
        });
    }
    startProgress(params) {
        this.client.emit('startProgress', params);
    }
    progress(params) {
        this.client.emit('progress', params);
    }
    stoprProgress() {
        this.client.emit('stopProgress');
    }
}
exports.SocketUtils = SocketUtils;

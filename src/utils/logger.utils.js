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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoggerUtils = void 0;
const colors_1 = __importDefault(require("colors"));
const readline = __importStar(require("readline"));
const ui_utils_1 = require("./ui.utils");
const inquirer = require("inquirer");
const cli_progress_1 = require("cli-progress");
let _originMaxLength = 0;
let _spaces = '';
class LoggerUtils extends ui_utils_1.UiUtils {
    static logTitle() {
        console.log(colors_1.default.red('### - Application Manager - ###'));
    }
    static log(params) {
        if (params.origin.length > _originMaxLength) {
            _originMaxLength = params.origin.length,
                _spaces = ' '.repeat(_originMaxLength);
        }
        let typeColor;
        switch (params.type) {
            case "error":
                typeColor = 'red';
                break;
            case "info":
                typeColor = 'cyan';
                break;
            case "warning":
                typeColor = 'yellow';
                break;
            case "success":
                typeColor = 'green';
                break;
            default:
                typeColor = 'grey';
        }
        const origin = `[${params.origin}${_spaces}`.slice(0, _originMaxLength + 1) + ']';
        console.log(new Date().toISOString().substr(0, 19) +
            ' - ' +
            colors_1.default.cyan(origin) +
            ' : ' +
            `${params.type ? colors_1.default[typeColor]('**' + params.type.toUpperCase() + '** ') : ''}` +
            colors_1.default[params.color || 'grey'](params.message) +
            (params.batchId ? colors_1.default.cyan(` (batch: ${params.batchId})`) : ''));
    }
    static info(params) {
        LoggerUtils.log(Object.assign(Object.assign({}, params), { type: 'info' }));
    }
    static error(params) {
        LoggerUtils.log(Object.assign(Object.assign({}, params), { type: 'error' }));
    }
    static warning(params) {
        LoggerUtils.log(Object.assign(Object.assign({}, params), { type: 'warning' }));
    }
    static success(params) {
        LoggerUtils.log(Object.assign(Object.assign({}, params), { type: 'success' }));
    }
    static question(params) {
        const origin = `[${params.origin}${_spaces}`.slice(0, _originMaxLength + 1) + ']';
        const text = new Date().toISOString().substr(0, 19) +
            ' - ' +
            colors_1.default.cyan(origin) +
            ' : ' +
            params.text + '\n > ';
        return new Promise(resolve => {
            let rl = readline.createInterface({
                input: process.stdin,
                output: process.stdout
            });
            rl.question(text, (answer) => {
                resolve(answer.trim());
                rl.close();
            });
        });
    }
    log(params) {
        if (params.origin.length > _originMaxLength) {
            _originMaxLength = params.origin.length,
                _spaces = ' '.repeat(_originMaxLength);
        }
        let typeColor;
        switch (params.type) {
            case "error":
                typeColor = 'red';
                break;
            case "info":
                typeColor = 'cyan';
                break;
            case "warning":
                typeColor = 'yellow';
                break;
            case "success":
                typeColor = 'green';
                break;
            default:
                typeColor = 'grey';
        }
        const origin = `[${params.origin}${_spaces}`.slice(0, _originMaxLength + 1) + ']';
        // [MSSQL] - Batch 60:Mark batch as FINISHED
        console.log(new Date().toISOString().substr(0, 19) +
            ' - ' +
            colors_1.default.cyan(origin) +
            ' : ' +
            `${params.type ? colors_1.default[typeColor]('**' + params.type.toUpperCase() + '** ') : ''}` +
            colors_1.default[params.color || 'grey'](params.message) +
            (params.batchId ? colors_1.default.cyan(` (batch: ${params.batchId})`) : ''));
    }
    info(params) {
        LoggerUtils.log(Object.assign(Object.assign({}, params), { type: 'info' }));
    }
    error(params) {
        LoggerUtils.log(Object.assign(Object.assign({}, params), { type: 'error' }));
    }
    warning(params) {
        LoggerUtils.log(Object.assign(Object.assign({}, params), { type: 'warning' }));
    }
    success(params) {
        LoggerUtils.log(Object.assign(Object.assign({}, params), { type: 'success' }));
    }
    question(params) {
        return __awaiter(this, void 0, void 0, function* () {
            const origin = `[${params.origin}${_spaces}`.slice(0, _originMaxLength + 1) + ']';
            const text = new Date().toISOString().substr(0, 19) +
                ' - ' +
                colors_1.default.cyan(origin) +
                ' : ' +
                params.text + '\n > ';
            return new Promise(resolve => {
                let rl = readline.createInterface({
                    input: process.stdin,
                    output: process.stdout
                });
                rl.question(text, (answer) => {
                    resolve(answer.trim());
                    rl.close();
                });
            });
        });
    }
    choices(params) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield inquirer.prompt([
                {
                    type: 'list',
                    name: params.title,
                    message: params.message,
                    choices: params.choices,
                }
            ]);
        });
    }
    startProgress(params) {
        this.bar = new cli_progress_1.Bar({
            format: `${params.title}  [{bar}] {percentage}% | ETA: {eta}s | {value}/{total}`,
            clearOnComplete: true
        }, cli_progress_1.Presets.shades_grey);
        this.bar.start(params.length, params.start);
    }
    progress(params) {
        if (this.bar) {
            this.bar.update(params);
        }
    }
    stoprProgress() {
        if (this.bar) {
            this.bar.stop();
        }
    }
}
exports.LoggerUtils = LoggerUtils;

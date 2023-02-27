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
exports.Server = void 0;
const bodyParser = __importStar(require("body-parser"));
const express_1 = __importDefault(require("express"));
const http = __importStar(require("http"));
const IO = __importStar(require("socket.io"));
const application_helper_1 = require("./classes/application/application-helper");
const database_server_1 = require("./server/database-server");
const socket_utils_1 = require("./utils/socket.utils");
class Server {
    constructor() {
        this.socketUtils = new socket_utils_1.SocketUtils();
        this.app = (0, express_1.default)();
        this.server = http.createServer(this.app);
        this.io = new IO.Server(this.server);
    }
    listen() {
        const [, , args] = process.argv;
        this.app.use((req, res, next) => {
            res.header("Access-Control-Allow-Origin", "*");
            res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
            next();
        });
        this.app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));
        this.app.use(bodyParser.json({ limit: '50mb' })); // to support JSON-encoded bodies
        this.app.get('/test', (req, res) => {
            res.send({ data: 'Yeah' });
        });
        this.app.get('/ping', (req, res) => {
            res.send('pong');
        });
        this.app.get('/stop', (req, res) => {
            this.server.close();
            res.send('stopped');
        });
        this.app.get('', (req, res) => {
            res.send('<a href="/test">test</a><br><a href="/stop">stop</a>');
        });
        this.app.get('/applications', (req, res) => __awaiter(this, void 0, void 0, function* () {
            res.send(yield application_helper_1.ApplicationHelper.getApplications());
        }));
        this.app.get('/applications/:name', (req, res) => __awaiter(this, void 0, void 0, function* () {
            res.send(yield application_helper_1.ApplicationHelper.getApplication(req.params.name));
        }));
        this.app.post('/cli/something-changed', (req, res) => __awaiter(this, void 0, void 0, function* () {
            yield this.socketUtils.emit('something-changed', req.body);
            res.send('ok');
        }));
        database_server_1.DatabaseServer.declareRoutes(this.app, this.socketUtils);
        this.io.on('connection', (client) => {
            console.log('Client connected');
            this._attachSocket(client);
        });
        const port = 690;
        this.server.listen(port, () => {
            console.log(`Listening on port ${port}`);
        });
    }
    _attachSocket(client) {
        this.socketUtils.attachClient(client);
    }
}
exports.Server = Server;
new Server().listen();

import { SocketUtils } from './utils/socket.utils';
export declare class Server {
    private app;
    private io;
    private server;
    socketUtils: SocketUtils;
    constructor();
    listen(): void;
    private _attachSocket;
}

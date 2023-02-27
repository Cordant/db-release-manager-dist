import { Express } from 'express';
import { SocketUtils } from '../utils/socket.utils';
export declare class DatabaseServer {
    static declareRoutes(app: Express, socketUtils: SocketUtils): void;
}

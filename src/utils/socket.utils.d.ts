import { LoggingParams, UiUtils } from './ui.utils';
import IO from "socket.io";
export declare class SocketUtils implements UiUtils {
    client?: IO.Socket;
    constructor();
    attachClient(client: IO.Socket): void;
    emit(message: string, params: any): void;
    log(params: LoggingParams): void;
    info(params: LoggingParams): void;
    error(params: LoggingParams): void;
    warning(params: LoggingParams): void;
    success(params: LoggingParams): void;
    question(params: {
        text: string;
        origin: string;
    }): Promise<string>;
    choices(params: {
        choices: string[];
        title: string;
        message: string;
    }): Promise<{
        [name: string]: string;
    }>;
    startProgress(params: {
        length: number;
        start: number;
        title: string;
    }): void;
    progress(params: number): void;
    stoprProgress(): void;
}

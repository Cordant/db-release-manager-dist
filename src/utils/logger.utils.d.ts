import { UiUtils, LoggingParams } from './ui.utils';
import { Bar } from "cli-progress";
export declare class LoggerUtils extends UiUtils {
    bar?: Bar;
    static logTitle(): void;
    static log(params: LoggingParams): void;
    static info(params: LoggingParams): void;
    static error(params: LoggingParams): void;
    static warning(params: LoggingParams): void;
    static success(params: LoggingParams): void;
    static question(params: {
        text: string;
        origin: string;
    }): Promise<string>;
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

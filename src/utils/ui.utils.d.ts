export declare type LoggerType = 'info' | 'warning' | 'error' | 'success';
export declare type LoggerColors = 'red' | 'green' | 'blue' | 'cyan' | 'white' | 'yellow' | 'grey';
export interface LoggingParams {
    origin: string;
    message: string;
    type?: LoggerType;
    color?: LoggerColors;
    batchId?: number;
}
export declare class UiUtils {
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

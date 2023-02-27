export declare type LambdaFunctionEventType = 's3';
export declare type LambdaFunctionEventRuleType = 'prefix' | 'suffix';
export interface LambdaFunctionEventRule {
    value: string;
    type: LambdaFunctionEventRuleType;
}
export interface LambdaFunctionEventParam {
    bucket?: string;
    event?: string;
    rules?: LambdaFunctionEventRule[];
}
export interface LambdaLayer {
    name: string;
}
export declare class LambdaFunctionEvent {
    type: LambdaFunctionEventType;
    params: LambdaFunctionEventParam;
    constructor(params?: any);
}
export declare class LambdaFunction {
    name: string;
    handler: string;
    handlerFunctionName: string;
    events: LambdaFunctionEvent[];
    layers: LambdaLayer[];
    constructor(params?: any);
}
export declare class ServerlessFile {
    fileName: string;
    serviceName: string;
    environmentVariables: {
        key: string;
        value: string;
        variableFileName?: string;
        declared: boolean;
    }[];
    functions: LambdaFunction[];
    constructor(params?: any);
}

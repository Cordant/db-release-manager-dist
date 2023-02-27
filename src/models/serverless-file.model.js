"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServerlessFile = exports.LambdaFunction = exports.LambdaFunctionEvent = void 0;
class LambdaFunctionEvent {
    constructor(params) {
        this.type = 's3';
        this.params = {};
        if (params) {
            if (params.s3) {
                this.type = 's3';
                this.params = {
                    bucket: params.s3.bucket,
                    event: params.s3.event,
                    rules: params.s3.rules.map((x) => {
                        if (x.suffix) {
                            return {
                                type: 'suffix',
                                value: x.suffix
                            };
                        }
                        if (x.prefix) {
                            return {
                                type: 'prefix',
                                value: x.prefix
                            };
                        }
                    })
                };
            }
        }
    }
}
exports.LambdaFunctionEvent = LambdaFunctionEvent;
class LambdaFunction {
    constructor(params) {
        this.name = '';
        this.handler = '';
        this.handlerFunctionName = '';
        this.events = [];
        this.layers = [];
        if (params) {
            this.name = params.functionName;
            this.handler = params.handler.split('.')[0];
            this.handlerFunctionName = params.handler.split('.')[1];
            if (params.events) {
                this.events = params.events.map((x) => new LambdaFunctionEvent(x));
            }
            if (params.layers) {
                this.layers = params.layers.map((x) => { name: x; });
            }
        }
    }
}
exports.LambdaFunction = LambdaFunction;
class ServerlessFile {
    constructor(params) {
        this.fileName = '';
        this.serviceName = '';
        this.environmentVariables = [];
        this.functions = [];
        if (params) {
            this.fileName = params.fileName;
            this.serviceName = params.service;
            if (params.provider.environment) {
                this.environmentVariables = Object.keys(params.provider.environment).map(x => {
                    return {
                        key: x,
                        value: params.provider.environment[x],
                        declared: true
                    };
                });
            }
            this.functions = Object.keys(params.functions)
                .map(x => new LambdaFunction(Object.assign(Object.assign({}, params.functions[x]), { functionName: x })));
        }
    }
}
exports.ServerlessFile = ServerlessFile;

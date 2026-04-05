import { HttpController } from '../../http/HttpController';
import { DomainModuleDescriptor } from './DomainModuleDescriptor';
import { HttpMiddleWare } from '../../http/HttpMiddleWare';

export interface DomainModule {
    bootstrap(): this;
    getMiddlewares(): HttpMiddleWare[];
    getControllers(): HttpController[];
    getDescriptor(): DomainModuleDescriptor;
}

import { HttpController } from '../../http/HttpController';
import { DomainModuleDescriptor } from './DomainModuleDescriptor';

export interface DomainModule {
    bootstrap(): this;
    getControllers(): HttpController[];
    getDescriptor(): DomainModuleDescriptor;
}

import { HttpController } from '../../http/HttpController';
import { DomainModuleDescriptor } from './DomainModuleDescriptor';
import { HttpMiddleWare } from '../../http/HttpMiddleWare';

export interface DomainModule {
    bootstrap(): this;
    /**
     * Optional startup hook, awaited by Core.start() after every module is
     * bootstrapped. For warm-up work like rehydrating in-memory state from
     * the database; implementations must not throw on recoverable failures.
     */
    start?(): Promise<void>;
    getMiddlewares(): HttpMiddleWare[];
    getControllers(): HttpController[];
    getDescriptor(): DomainModuleDescriptor;
}

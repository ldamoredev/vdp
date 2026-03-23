import { ModuleContext } from './ModuleContext';
import { DomainModule } from './DomainModule';

export type DomainModuleFactory = (context: ModuleContext) => DomainModule;

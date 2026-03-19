import { ServiceProvider } from '../base/services/ServiceProvider';

export type ServiceResolver = Pick<ServiceProvider, 'get'>;

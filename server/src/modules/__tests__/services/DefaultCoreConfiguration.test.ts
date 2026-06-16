import { describe, expect, it } from 'vitest';

import { DefaultCoreConfiguration } from '../../DefaultCoreConfiguration';

describe('DefaultCoreConfiguration', () => {
    it('registers medical records as part of health, not as a standalone module', () => {
        const config = new DefaultCoreConfiguration();

        // Active backend modules are Auth, Tasks, Wallet, and Health. Medical
        // records are a Health section, so they must not add a fifth module.
        expect(config.moduleFactories).toHaveLength(4);
    });
});

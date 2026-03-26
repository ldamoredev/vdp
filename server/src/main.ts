import 'dotenv/config';
import { AppRunner } from './AppRunner';
import { DefaultCoreConfiguration } from './modules/DefaultCoreConfiguration';
import { Core } from './modules/Core';
import { App } from './App';
import { NodeRuntimeLifecycle } from './runtime/NodeRuntimeLifecycle';

const PORT = Number(process.env.PORT) || 4000;
const HOST = '0.0.0.0';

async function main() {
    const core = new Core(new DefaultCoreConfiguration());
    const app = new App(core);
    const runner = new AppRunner(app, new NodeRuntimeLifecycle());

    await runner.run(PORT, HOST);
}

main();

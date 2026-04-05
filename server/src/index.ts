import 'dotenv/config';
import { Server } from './Server';
import { DefaultCoreConfiguration } from './modules/DefaultCoreConfiguration';
import { Core } from './modules/Core';
import { App } from './App';

const PORT = Number(process.env.PORT) || 4000;
const HOST = '0.0.0.0';

async function index() {
    const core = new Core(new DefaultCoreConfiguration());
    const app = new App(core);
    const runner = new Server(app);

    await runner.run(PORT, HOST);
}

index();

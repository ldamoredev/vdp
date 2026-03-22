import 'dotenv/config';
import { DefaultCoreConfiguration } from './modules/DefaultCoreConfiguration';
import { Core } from './modules/Core';
import { App } from './App';

const PORT = Number(process.env.PORT) || 4001;

async function main() {
    let logger: { error(error: unknown): void } | null = null;

    const core = new Core(new DefaultCoreConfiguration());
    const server = new App(core);

    try {
        logger = server.app.log;

        process.once('SIGINT', () => {
            server.stop().finally(() => process.exit(0));
        });

        process.once('SIGTERM', () => {
            server.stop().finally(() => process.exit(0));
        });

        await server.start({ port: PORT, host: '0.0.0.0' });
        console.log(`\n🚀 VDP Server listening on port ${PORT}`);
        console.log(`   Health: http://localhost:${PORT}/api/health`);
        console.log(`   Wallet API: http://localhost:${PORT}/api/v1/`);
        console.log('');
    } catch (err) {
        logger?.error(err);
        server.stop();
        process.exit(1);
    }
}

main();

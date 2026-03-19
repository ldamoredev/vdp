import 'dotenv/config';
import { App } from './App';
import { Core } from './modules/Core';

const PORT = Number(process.env.PORT) || 4001;

async function main() {
  const server = new App(new Core());

  try {
    await server.listen({ port: PORT, host: "0.0.0.0" });
    console.log(`\n🚀 VDP Server listening on port ${PORT}`);
    console.log(`   Health: http://localhost:${PORT}/api/health`);
    console.log(`   Wallet API: http://localhost:${PORT}/api/v1/`);
    console.log("");
  } catch (err) {
    server.app.log.error(err);
    process.exit(1);
  }
}

main();

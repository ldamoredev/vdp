import "dotenv/config";
import { buildApp } from "./app.js";

const PORT = Number(process.env.PORT) || 4001;

async function main() {
  const app = await buildApp();

  try {
    await app.listen({ port: PORT, host: "0.0.0.0" });
    console.log(`\n🚀 VDP Server listening on port ${PORT}`);
    console.log(`   Health: http://localhost:${PORT}/api/health`);
    console.log(`   Wallet API: http://localhost:${PORT}/api/v1/`);
    console.log("");
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

main();

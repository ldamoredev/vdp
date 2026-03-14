import "dotenv/config";
import { buildApp } from "./app";

const PORT = Number(process.env.PORT) || 4001;

async function main() {
  const app = await buildApp();

  try {
    await app.listen({ port: PORT, host: "0.0.0.0" });
    console.log(`Wallet backend listening on port ${PORT}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

main();

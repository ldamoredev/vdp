import { Core } from "@/core/Core";
import { HealthModule } from "@/core/app/health/HealthModule";
import { TasksModule } from "@/core/app/tasks/TasksModule";
import { WalletModule } from "@/core/app/wallet/WalletModule";

/**
 * App composition root: builds the Core and registers every feature module's
 * handlers on the bus. The frontend analogue of the backend's
 * DefaultCoreConfiguration — add each module here as it is migrated.
 */
export function createAppCore(): Core {
  return new Core().use(new HealthModule()).use(new TasksModule()).use(new WalletModule());
}

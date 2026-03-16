export { request, chatStream } from "./client";
export { tasksApi } from "./tasks";
export { walletApi } from "./wallet";
export { healthApi } from "./health";

// Convenience namespace
export const api = {
  tasks: {} as typeof import("./tasks").tasksApi,
  wallet: {} as typeof import("./wallet").walletApi,
  health: {} as typeof import("./health").healthApi,
};

// Lazily assign to avoid circular imports
import { tasksApi } from "./tasks";
import { walletApi } from "./wallet";
import { healthApi } from "./health";
api.tasks = tasksApi;
api.wallet = walletApi;
api.health = healthApi;

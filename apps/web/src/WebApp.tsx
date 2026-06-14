import { RouterProvider } from "react-router/dom";

import { Providers } from "@/lib/providers";
import { ThemeProvider } from "@/lib/theme";
import { CoreProvider } from "./CoreProvider";
import { TasksEventsProvider } from "./TasksEventsProvider";
import { router } from "./routes";

export function WebApp() {
  return (
    <ThemeProvider>
      <CoreProvider>
        <TasksEventsProvider>
          <Providers>
            <RouterProvider router={router} />
          </Providers>
        </TasksEventsProvider>
      </CoreProvider>
    </ThemeProvider>
  );
}

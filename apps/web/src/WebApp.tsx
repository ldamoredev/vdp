import { RouterProvider } from "react-router/dom";

import { Providers } from "@/lib/providers";
import { ThemeProvider } from "@/lib/theme";
import { CoreProvider } from "./CoreProvider";
import { router } from "./routes";

export function WebApp() {
  return (
    <ThemeProvider>
      <CoreProvider>
        <Providers>
          <RouterProvider router={router} />
        </Providers>
      </CoreProvider>
    </ThemeProvider>
  );
}

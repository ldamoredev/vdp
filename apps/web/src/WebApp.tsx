import { RouterProvider } from "react-router/dom";

import { Providers } from "@/lib/providers";
import { ThemeProvider } from "@/lib/theme";
import { router } from "./routes";

export function WebApp() {
  return (
    <ThemeProvider>
      <Providers>
        <RouterProvider router={router} />
      </Providers>
    </ThemeProvider>
  );
}

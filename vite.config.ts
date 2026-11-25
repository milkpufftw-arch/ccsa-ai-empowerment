import { defineConfig, type Plugin, type ViteDevServer } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

function localLibrary(): Plugin {
  function configure(server: Pick<ViteDevServer, "middlewares">) {
    // Vite does not execute Vercel functions. Browser tests can intercept the same route.
    server.middlewares.use("/api/library", (req, res) => {
      res.statusCode = (req as { method?: string }).method === "GET" ? 204 : 405;
      res.end();
    });
  }
  return {
    name: "local-library-fallback",
    configureServer: configure,
    configurePreviewServer: configure,
  };
}

export default defineConfig({ plugins: [react(), tailwindcss(), localLibrary()] });

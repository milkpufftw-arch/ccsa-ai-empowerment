import { defineConfig, type Plugin, type ViteDevServer } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

function localSnapshots(): Plugin {
  function configure(server: Pick<ViteDevServer, "middlewares">) {
    // Vite does not execute Vercel functions. Browser tests can intercept the same route.
    for (const path of ["/api/library", "/api/content"]) {
      server.middlewares.use(path, (req, res) => {
        res.statusCode = (req as { method?: string }).method === "GET" ? 204 : 405;
        res.end();
      });
    }
  }
  return {
    name: "local-snapshot-fallback",
    configureServer: configure,
    configurePreviewServer: configure,
  };
}

export default defineConfig({ plugins: [react(), tailwindcss(), localSnapshots()] });

import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

const repoName = process.env.GITHUB_REPOSITORY?.split("/")[1];

export default defineConfig({
  base: repoName ? `/${repoName}/` : "/",
  plugins: [vue()],
  server: {
    host: "0.0.0.0",
    port: 5176,
  },
});

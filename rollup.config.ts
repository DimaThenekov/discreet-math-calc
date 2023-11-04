import { defineConfig } from "rollup";
import typescript from "@rollup/plugin-typescript";
import { dts } from "rollup-plugin-dts";

export default defineConfig([
  {
    input: "./index.ts",
    output: {
      dir: "dist",
      format: "es",
      sourcemap: "inline",
    },
    plugins: [typescript()],
  },
  {
    input: "./index.ts",
    output: [{ file: "dist/index.d.ts", format: "es" }],
    plugins: [dts()],
  },
]);

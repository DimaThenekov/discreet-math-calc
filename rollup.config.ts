import { defineConfig } from "rollup";
import typescript from "@rollup/plugin-typescript";
import { dts } from "rollup-plugin-dts";

export default defineConfig([
  {
    input: "./index.ts",
    output: [
      {
        dir: "dist/target/esm",
        format: "es",
      },
      {
        dir: "dist/target/commonjs",
        format: "commonjs",
      },
    ],
    plugins: [typescript()],
  },
  {
    input: "./index.ts",
    output: [{ file: "dist/target/esm/index.d.ts", format: "es" },
             { file: "dist/target/commonjs/index.d.ts", format: "commonjs"}],
    plugins: [dts()],
  },
]);

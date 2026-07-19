import { cpSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const standalone = join(root, ".next/standalone");
if (!existsSync(standalone)) {
  console.warn("skip copy-standalone: .next/standalone missing");
  process.exit(0);
}

mkdirSync(join(standalone, ".next"), { recursive: true });
cpSync(join(root, ".next/static"), join(standalone, ".next/static"), { recursive: true });
if (existsSync(join(root, "public"))) {
  cpSync(join(root, "public"), join(standalone, "public"), { recursive: true });
}
console.log("standalone static/public copied");

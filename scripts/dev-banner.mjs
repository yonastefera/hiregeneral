import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const teal = "\x1b[36m";
const navy = "\x1b[34m";
const orange = "\x1b[38;5;208m";
const muted = "\x1b[90m";
const red = "\x1b[31m";
const reset = "\x1b[0m";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

const nextBin =
  process.platform === "win32"
    ? path.join(projectRoot, "node_modules", ".bin", "next.cmd")
    : path.join(projectRoot, "node_modules", ".bin", "next");

const logo = `${teal}
██╗  ██╗██╗██████╗ ███████╗
██║  ██║██║██╔══██╗██╔════╝
███████║██║██████╔╝█████╗  
██╔══██║██║██╔══██╗██╔══╝  
██║  ██║██║██║  ██║███████╗
╚═╝  ╚═╝╚═╝╚═╝  ╚═╝╚══════╝

${navy} ██████╗ ███████╗███╗   ██╗███████╗██████╗  █████╗ ██╗     
██╔════╝ ██╔════╝████╗  ██║██╔════╝██╔══██╗██╔══██╗██║     
██║  ███╗█████╗  ██╔██╗ ██║█████╗  ██████╔╝███████║██║     
██║   ██║██╔══╝  ██║╚██╗██║██╔══╝  ██╔══██╗██╔══██║██║     
╚██████╔╝███████╗██║ ╚████║███████╗██║  ██║██║  ██║███████╗
 ╚═════╝ ╚══════╝╚═╝  ╚═══╝╚══════╝╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝
${reset}`;

console.log(logo);
console.log(`${teal}✓ HireGeneral development server starting.${reset}`);
console.log(`${orange}Local app will be available from Next.js below.${reset}`);
console.log(
  `${muted}Search smarter. Hire faster. Move with general.${reset}\n`,
);

const dev = spawn(nextBin, ["dev"], {
  stdio: "inherit",
  cwd: projectRoot,
});

dev.on("close", (code) => {
  if (code !== 0) {
    console.error(`${red}✗ Development server stopped with an error.${reset}`);
  }

  process.exit(code ?? 0);
});

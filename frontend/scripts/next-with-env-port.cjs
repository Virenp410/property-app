const { spawn } = require("node:child_process");
const { URL } = require("node:url");
const { config } = require("dotenv");

config({ path: ".env" });

const parsePortFromUrl = (value) => {
  try {
    return new URL(String(value)).port || "";
  } catch {
    return "";
  }
};

const mode = process.argv[2];
const passthroughArgs = process.argv.slice(3);
const fallbackPort = parsePortFromUrl(process.env.NEXT_PUBLIC_APP_URL);
const port = String(fallbackPort || process.env.PORT || "3000");
const nextBin = require.resolve("next/dist/bin/next");

const child = spawn(
  process.execPath,
  [nextBin, mode, "-p", port, ...passthroughArgs],
  { stdio: "inherit", env: process.env }
);

child.on("exit", (code) => {
  process.exit(code ?? 0);
});

import https from "node:https";
import { createWriteStream, unlinkSync, readFileSync } from "node:fs";
import { execSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const APP_NAME = "Poke macOS Gate";
const DMG_ASSET = "Poke.macOS.Gate.dmg";
const INSTALL_PATH = `/Applications/${APP_NAME}.app`;
const REPO = "f/poke-gate";

function getPackageVersion() {
  const pkgPath = join(dirname(fileURLToPath(import.meta.url)), "..", "package.json");
  const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
  return pkg.version;
}

function httpGet(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { "User-Agent": "poke-gate" } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return httpGet(res.headers.location).then(resolve, reject);
      }
      resolve(res);
    }).on("error", reject);
  });
}

function downloadFile(url, dest, version) {
  return new Promise((resolve, reject) => {
    const follow = (followUrl) => {
      https.get(followUrl, { headers: { "User-Agent": "poke-gate" } }, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          return follow(res.headers.location);
        }
        if (res.statusCode !== 200) {
          reject(new Error(`Download failed: HTTP ${res.statusCode}`));
          return;
        }

        const total = parseInt(res.headers["content-length"], 10) || 0;
        let downloaded = 0;
        const file = createWriteStream(dest);

        res.on("data", (chunk) => {
          downloaded += chunk.length;
          if (total > 0) {
            const pct = Math.round((downloaded / total) * 100);
            const dlMB = (downloaded / 1024 / 1024).toFixed(1);
            const totalMB = (total / 1024 / 1024).toFixed(1);
            process.stdout.write(`\rDownloading ${APP_NAME} v${version}... ${pct}% (${dlMB}/${totalMB} MB)`);
          }
        });

        res.pipe(file);

        file.on("finish", () => {
          file.close(() => {
            console.log("");
            resolve();
          });
        });

        file.on("error", (err) => {
          file.close();
          reject(err);
        });
      }).on("error", reject);
    };
    follow(url);
  });
}

function run(cmd) {
  return execSync(cmd, { encoding: "utf-8", stdio: ["pipe", "pipe", "pipe"] }).trim();
}

export async function downloadMacOSApp() {
  const version = getPackageVersion();
  const tag = `v${version}`;
  const dmgUrl = `https://github.com/${REPO}/releases/download/${tag}/${DMG_ASSET}`;

  console.log(`Poke Gate macOS installer (${tag})`);
  console.log("");

  const res = await httpGet(`https://api.github.com/repos/${REPO}/releases/tags/${tag}`);
  const chunks = [];
  for await (const chunk of res) chunks.push(chunk);
  const release = JSON.parse(Buffer.concat(chunks).toString());

  if (!release.assets || !release.assets.find((a) => a.name === DMG_ASSET)) {
    console.error(`No DMG found for ${tag}. The release may not have finished building yet.`);
    process.exit(1);
  }

  const dmgPath = join(tmpdir(), `poke-gate-${version}.dmg`);

  try {
    await downloadFile(dmgUrl, dmgPath, version);

    console.log("Mounting DMG...");
    const mountOutput = run(`hdiutil attach "${dmgPath}" -nobrowse`);
    const mountMatch = mountOutput.match(/\/Volumes\/.+/);
    if (!mountMatch) {
      throw new Error("Failed to detect mount point from hdiutil output.");
    }
    const mountPoint = mountMatch[0].trim();
    const appSource = `${mountPoint}/${APP_NAME}.app`;

    console.log("Stopping running instances...");
    try { run(`pkill -f "${APP_NAME}"`); } catch {}
    await new Promise((r) => setTimeout(r, 1000));

    console.log(`Installing to ${INSTALL_PATH}...`);
    try { run(`rm -rf "${INSTALL_PATH}"`); } catch {}
    run(`cp -R "${appSource}" "${INSTALL_PATH}"`);

    console.log("Clearing quarantine...");
    run(`xattr -cr "${INSTALL_PATH}"`);

    console.log("Unmounting DMG...");
    try { run(`hdiutil detach "${mountPoint}" -quiet`); } catch {}

    console.log("");
    console.log(`Poke macOS Gate v${version} installed successfully.`);
    console.log("");
    console.log("Launching...");
    try { run(`open "${INSTALL_PATH}"`); } catch {}
  } finally {
    try { unlinkSync(dmgPath); } catch {}
  }
}

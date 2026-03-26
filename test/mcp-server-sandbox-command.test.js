import assert from "node:assert/strict";
import test from "node:test";

import { buildSandboxWrappedCommand } from "../src/mcp-server.js";

test("buildSandboxWrappedCommand wraps command with sandbox-exec", () => {
  const wrapped = buildSandboxWrappedCommand("ffmpeg -i in.mkv out.mp4");

  assert.equal(wrapped.includes("/usr/bin/sandbox-exec -p"), true);
  assert.equal(wrapped.includes("/bin/zsh -lc"), true);
  assert.equal(wrapped.includes("ffmpeg -i in.mkv out.mp4"), true);
});

test("buildSandboxWrappedCommand escapes single quotes", () => {
  const wrapped = buildSandboxWrappedCommand("echo 'hello'");

  assert.equal(wrapped.includes("'\"'\"'"), true);
});

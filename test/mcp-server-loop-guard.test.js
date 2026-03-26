import assert from "node:assert/strict";
import test from "node:test";

import {
  prepareRunCommandAttempt,
  recordRunCommandOutcome,
  resetRunCommandLoopGuard,
} from "../src/mcp-server.js";

const sessionId = "session-1";
const cleanArgs = { command: "while ps -p 58675 58676 > /dev/null 2>&1; do sleep 5; done", cwd: "~" };

test("run_command guard suppresses in-flight duplicates", () => {
  resetRunCommandLoopGuard();

  const first = prepareRunCommandAttempt(sessionId, cleanArgs, 1_000);
  const second = prepareRunCommandAttempt(sessionId, cleanArgs, 1_001);

  assert.equal(first.suppressed, false);
  assert.equal(second.suppressed, true);
  assert.equal(second.reason, "already_running");
});

test("run_command guard suppresses repeats after failure and clears after success", () => {
  resetRunCommandLoopGuard();

  const initial = prepareRunCommandAttempt(sessionId, cleanArgs, 2_000);
  assert.equal(initial.suppressed, false);

  recordRunCommandOutcome(sessionId, cleanArgs, { exitCode: 1 }, 2_010);

  const afterFailure = prepareRunCommandAttempt(sessionId, cleanArgs, 2_020);
  assert.equal(afterFailure.suppressed, true);
  assert.equal(afterFailure.reason, "recent_failure");

  const afterCooldown = prepareRunCommandAttempt(sessionId, cleanArgs, 2_010 + 60_000 + 1);
  assert.equal(afterCooldown.suppressed, false);

  recordRunCommandOutcome(sessionId, cleanArgs, { exitCode: 0 }, 62_020);
  const afterSuccess = prepareRunCommandAttempt(sessionId, cleanArgs, 62_021);
  assert.equal(afterSuccess.suppressed, false);
});

test("run_command guard scopes suppression to the same command and cwd", () => {
  resetRunCommandLoopGuard();

  const first = prepareRunCommandAttempt(sessionId, cleanArgs, 3_000);
  assert.equal(first.suppressed, false);

  recordRunCommandOutcome(sessionId, cleanArgs, { exitCode: 1 }, 3_010);

  const differentCwd = prepareRunCommandAttempt(sessionId, { ...cleanArgs, cwd: "/tmp" }, 3_020);
  assert.equal(differentCwd.suppressed, false);

  const differentSession = prepareRunCommandAttempt("session-2", cleanArgs, 3_020);
  assert.equal(differentSession.suppressed, false);
});

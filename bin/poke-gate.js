#!/usr/bin/env node

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";
import { createInterface } from "node:readline";

const CONFIG_DIR = process.env.XDG_CONFIG_HOME || join(homedir(), ".config");
const CONFIG_PATH = join(CONFIG_DIR, "poke-gate", "config.json");

function loadConfig() {
  try {
    return JSON.parse(readFileSync(CONFIG_PATH, "utf-8"));
  } catch {
    return {};
  }
}

function saveConfig(config) {
  mkdirSync(join(CONFIG_DIR, "poke-gate"), { recursive: true });
  writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
}

function loadPokeCredentials() {
  try {
    const creds = JSON.parse(readFileSync(join(CONFIG_DIR, "poke", "credentials.json"), "utf-8"));
    if (creds.token) return creds.token;
  } catch {}
  return null;
}

function resolveToken() {
  if (process.env.POKE_API_KEY) return process.env.POKE_API_KEY;
  const config = loadConfig();
  if (config.apiKey) return config.apiKey;
  const pokeCreds = loadPokeCredentials();
  if (pokeCreds) return pokeCreds;
  return null;
}

function ask(question) {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function onboarding() {
  console.log();
  console.log("  poke-gate — expose your machine to Poke");
  console.log();
  console.log("  Your Poke agent will be able to run commands,");
  console.log("  read/write files, and access system info on this machine.");
  console.log();
  console.log("  ⚠  This grants full shell access. Only run on trusted networks.");
  console.log();
  console.log("  To get started, either:");
  console.log();
  console.log("  Option 1: Run 'npx poke login' (recommended)");
  console.log("  Option 2: Paste an API key from https://poke.com/kitchen/api-keys");
  console.log();

  const key = await ask("  API key (or press Enter if you ran poke login): ");

  if (!key) {
    const pokeCreds = loadPokeCredentials();
    if (pokeCreds) {
      console.log();
      console.log("  Found poke login credentials! Starting...");
      console.log();
      return pokeCreds;
    }
    console.log();
    console.log("  No credentials found. Run: npx poke login");
    console.log();
    process.exit(1);
  }

  saveConfig({ apiKey: key });
  console.log();
  console.log("  Saved! Starting poke-gate...");
  console.log();

  return key;
}

async function main() {
  let token = resolveToken();

  if (!token) {
    token = await onboarding();
  }

  process.env.POKE_API_KEY = token;
  await import("../src/app.js");
}

main();

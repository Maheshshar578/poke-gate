# Security

::: danger Full shell access
Poke Gate grants **full shell access** to your Poke agent. Understand the implications before running it.
:::

## What the agent can do

When Poke Gate is running, your Poke agent can:

- **Run any command** with your user's permissions (`run_command`)
- **Read any file** your user can access (`read_file`, `read_image`)
- **Write any file** your user can access (`write_file`)
- **List any directory** (`list_directory`)
- **Take screenshots** of your screen (`take_screenshot`)
- **See system info** — hostname, memory, uptime (`system_info`)

## What protects you

- **Authentication** — only your Poke agent (authenticated via your Poke OAuth session) can reach the tunnel. No one else can send tool calls.
- **Tunnel isolation** — the MCP server only listens on `127.0.0.1` (localhost). It's not exposed to the network. The tunnel is the only way to reach it.
- **No persistent access** — when you quit Poke Gate (Ctrl-C or Quit from menu bar), the tunnel closes and the connection is deleted. Your machine is no longer reachable.
- **Connection cleanup** — old connections are deleted before new ones are created, preventing stale tunnels.

## Best practices

1. **Only run on trusted machines** — don't run Poke Gate on shared or public computers.
2. **Quit when not needed** — close the app when you don't need remote access.
3. **Review agent scripts** — before installing a community agent, read the code. Agents run with your full user permissions.
4. **Keep env files secure** — `.env` files in `~/.config/poke-gate/agents/` may contain API tokens. Don't commit them to git.
5. **Use verbose mode** — run with `--verbose` to see what tools are being called in real time.

## Reporting issues

If you discover a security vulnerability, please email [security@fka.dev](mailto:security@fka.dev) instead of opening a public issue.

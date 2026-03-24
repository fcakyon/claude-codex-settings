---
name: setup
description: "Configure and troubleshoot the Supabase MCP integration including OAuth authentication, project configuration, and RLS permissions. Use when encountering 'Supabase MCP error', 'Supabase auth failed', 'Supabase OAuth error', 'Supabase not working', or when setting up Supabase integration for the first time."
---

# Supabase Tools Setup

## Setup Workflow

1. Run `/supabase-tools:setup` to launch the configuration wizard
2. Authenticate via OAuth when prompted by the Supabase dashboard
3. Verify your `project_ref` is correct in the generated config
4. Test the connection by running `mcp__supabase__list_tables`

## Troubleshooting

| Error | Cause | Fix |
|-------|-------|-----|
| OAuth failed | Expired or revoked token | Re-authenticate via Supabase dashboard |
| Project not found | Wrong project reference | Verify `project_ref` in config matches your Supabase project URL |
| Permission denied | Missing RLS policies | Check RLS policies on the affected tables |
| Connection timeout | Network or config issue | Restart Claude Code after config changes |

## Disabling Supabase

If you don't need Supabase, disable via `/mcp` command to prevent errors.

---
name: azure-usage
description: "Query and manage Azure resources via MCP tools including Storage, Key Vault, Cosmos DB, AKS, and Monitor. Use when the user asks to list storage accounts, manage Key Vault secrets, query Cosmos DB documents, check AKS clusters, run Log Analytics queries, or interact with any Azure service through the Azure MCP server."
---

# Azure MCP Best Practices

## Tool Selection

Match the task to the correct MCP tool pattern:

| Task                 | Tool                   | Example                             |
| -------------------- | ---------------------- | ----------------------------------- |
| List resources       | `mcp__azure__*_list`   | Storage accounts, Key Vault secrets |
| Get resource details | `mcp__azure__*_get`    | Container details, database info    |
| Create resources     | `mcp__azure__*_create` | New secrets, storage containers     |
| Query data           | `mcp__azure__*_query`  | Log Analytics, Cosmos DB            |

## Common Operations

### Storage

```
storage_accounts_list          # List storage accounts
storage_blobs_list             # List blobs in container
storage_blobs_upload           # Upload file to blob
```

### Key Vault

```
keyvault_secrets_list          # List secrets
keyvault_secrets_get           # Get secret value
keyvault_secrets_set           # Create/update secret
```

### Cosmos DB

```
cosmosdb_databases_list        # List databases
cosmosdb_containers_list       # List containers
cosmosdb_query                 # Query documents
```

### AKS

```
aks_clusters_list              # List AKS clusters
aks_nodepools_list             # List node pools
```

### Monitor

```
monitor_logs_query             # Query Log Analytics
```

## Authentication

Azure MCP uses Azure Identity SDK. Authenticate using one of:

1. `az login` (Azure CLI - recommended)
2. VS Code Azure extension
3. Environment variables (service principal)

## Reference

- [Azure MCP Server](https://github.com/microsoft/mcp/tree/main/servers/Azure.Mcp.Server)
- [Supported Services (40+)](https://learn.microsoft.com/azure/developer/azure-mcp-server/)

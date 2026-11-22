# Dependencies and schemas

These exact versions come from the reference implementations' Go modules and npm lockfile. Check SDK changes before upgrading the set.

| Dependency | Pin | Use |
| --- | --- | --- |
| `github.com/modelcontextprotocol/go-sdk` | `v1.8.0` | `/mcp` for the server, tools and resources, `/auth` for bearer middleware and token context, `/oauthex` for OAuth metadata and challenge helpers |
| `github.com/google/jsonschema-go` | `v0.4.3` | `/jsonschema` for typed tool schemas |
| `@modelcontextprotocol/ext-apps` | `2.0.4` | App bridge and React hooks |
| `@modelcontextprotocol/client` | `2.4.0` | Peer dependency for ext-apps 2.x and remote test clients |
| `vite-plugin-singlefile` | `2.3.4` | Inline the build into the view's HTML |

Install into the Go module and Vite app respectively. Resolve the React, Vite and Zod peer ranges against the app's own lockfile. ext-apps 2.x uses Zod 4.2 or newer.

```sh
go get github.com/modelcontextprotocol/go-sdk@v1.8.0 github.com/google/jsonschema-go@v0.4.3
npm install --save-exact @modelcontextprotocol/ext-apps@2.0.4 @modelcontextprotocol/client@2.4.0
npm install --save-dev --save-exact vite-plugin-singlefile@2.3.4
```

## Go server

Given a server and OAuth verifier, mount the same handler at the canonical and legacy paths. The verifier checks the grant before returning `auth.TokenInfo` with its scopes and expiration. Use `auth.TokenInfoFromContext(ctx)` in tool handlers. Keep the SDK's localhost protection unless the proxy topology needs the override described in the [transport guide](protocol-and-transport.md).

```go
// Imports: net/http, github.com/modelcontextprotocol/go-sdk/auth,
// github.com/modelcontextprotocol/go-sdk/mcp.
func mountMCP(mux *http.ServeMux, server *mcp.Server, verify auth.TokenVerifier, publicOrigin string) {
    transport := mcp.NewStreamableHTTPHandler(func(*http.Request) *mcp.Server {
        return server
    }, &mcp.StreamableHTTPOptions{Stateless: true, JSONResponse: true})
    protected := auth.RequireBearerToken(verify, &auth.RequireBearerTokenOptions{
        ResourceMetadataURL: publicOrigin + "/.well-known/oauth-protected-resource/mcp",
    })(transport)

    handler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        origins := r.Header.Values("Origin")
        if len(origins) > 1 || (len(origins) == 1 && origins[0] != publicOrigin) {
            http.Error(w, "Forbidden origin", http.StatusForbidden)
            return
        }
        protected.ServeHTTP(w, r)
    })
    for _, path := range []string{"/mcp", "/legacy/mcp"} {
        mux.Handle(path, handler)
    }
}
```

Create typed data with `jsonschema.For[Profile](nil)` from `github.com/google/jsonschema-go/jsonschema`. Handle schema generation errors when constructing the server. Use the schema as `mcp.Tool.OutputSchema` and publish the corresponding object in `mcp.CallToolResult.StructuredContent`. For profile data, return the stable account ID derived from grant context:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "id": {"type": "string", "minLength": 1, "pattern": "\\S"},
    "name": {"type": "string"},
    "email": {"type": "string"},
    "nickname": {"type": "string"}
  },
  "required": ["id"],
  "additionalProperties": false
}
```

Use `auth.ProtectedResourceMetadataHandler` with `oauthex.ProtectedResourceMetadata` for the fields supported by the pinned SDK. Add standards fields absent from the SDK through your metadata response type. `oauthex.AuthServerMeta` models the authorization server document. The authorization server owns consent, client registration and token persistence.

## Vite widget

Use a small `widget.html` entry pointing at the widget's React module, then run `vite build --config vite.widget.config.ts` and package `dist-widget/widget.html` with the server.

```ts
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { viteSingleFile } from 'vite-plugin-singlefile'

export default defineConfig({
  plugins: [react(), viteSingleFile()],
  publicDir: false,
  build: { outDir: 'dist-widget', rollupOptions: { input: 'widget.html' } },
})
```

Set the tool and resource metadata in their respective wire objects:

```json
{
  "_meta": {
    "ui": {"resourceUri": "ui://example/report-a1b2.html"},
    "ui/resourceUri": "ui://example/report-a1b2.html"
  }
}
```

```json
{
  "uri": "ui://example/report-a1b2.html",
  "mimeType": "text/html;profile=mcp-app",
  "text": "<!doctype html><title>Report</title>",
  "_meta": {
    "ui": {
      "csp": {"connectDomains": [], "resourceDomains": []},
      "prefersBorder": true
    }
  }
}
```

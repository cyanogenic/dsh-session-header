# Model request session header

English | [简体中文](README.zh.md)

A Host-only bundle for DeepSeek Harness. It adds the owning Session id of every
inference call to that call's model request headers.

## Behavior

- Listens to the `llm-pi-ai/request-headers` waterfall, which the
  `@deepseek-ai/dsh-llm-pi-ai` adapter dispatches once per inference call with
  the frozen routing metadata `{ provider, model, baseURL, sessionId, purpose }`.
- When `sessionId` is present, sets the configured header to that exact id
  before continuing the waterfall, so later listeners and Harness attribution
  still run.
- The default header name is `X-Session-ID`. HTTP field names are
  case-insensitive, so the value travels as `x-session-id` on the wire.
- Discovery calls and any call without a Session id carry no header.

The header is prepared by the adapter that builds the real outgoing request, so
it is sent for every request routed through pi-ai providers, including retries
and replay. Concurrent subagents each carry their own Session id, not the root
session's id. Other LLM adapters expose no header extension point and are not
covered.

## Configuration

The bundle inserts the row `llm-session-header` with `headerName: X-Session-ID`.
Override it from the profile's own patch layer; the override replaces the row's
complete config:

```yaml
- id: llm-session-header
  config:
    headerName: X-Session-ID
```

| Key | Default | Meaning |
|---|---|---|
| `headerName` | `X-Session-ID` | HTTP field name used for the Session id; must be an RFC 9110 token. Unknown keys and invalid names fail activation. |

The value is always the Session id verbatim (`String(request.sessionId)`).

Config projection: the schema is a hand-written StandardSchemaV1 validator, so
the Loader reports this row's Config status as `unsupported` and the Settings
page offers no generated form. Edit the YAML override above instead.

## Install

The package is published as `@cyanogenic/dsh-session-header`. It has no build
step and no runtime dependencies; install it as a bundle through the Host plugin
manager (the profile's `pnpm` must be on the Host PATH):

```
plugin_manager install_bundle target=@cyanogenic/dsh-session-header
```

Or use it as an ordinary dependency:

```
pnpm add @cyanogenic/dsh-session-header
```

Installing adds `@cyanogenic/dsh-session-header` to the profile's bundle list;
the row is live profile-wide after the manager reports `application: applied`.
Remove the bundle through the same manager to stop the header injection.

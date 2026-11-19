# 模型请求会话标识头

[English](README.md) | 简体中文

一个 DeepSeek Harness 的 Host-only bundle：把每次推理调用所属的会话 ID 注入该次调用的模型请求头。

## 行为

- 监听 `llm-pi-ai/request-headers` 瀑布事件。`@deepseek-ai/dsh-llm-pi-ai` 适配器在每次推理调用前派发该事件，携带本次调用冻结的路由元数据 `{ provider, model, baseURL, sessionId, purpose }`。
- 当 `sessionId` 存在时，在继续瀑布之前把配置的请求头设为该 ID；后续监听器与 Harness 归因头仍会正常执行。
- 默认请求头名为 `X-Session-ID`。HTTP 头名大小写不敏感，实际发送时在线路上是 `x-session-id`。
- 模型发现等没有会话 ID 的调用不会携带该头。

请求头由构建真实出站请求的适配器生成，因此所有走 pi-ai provider 的请求（包括重试与重放）都会携带。并发子代理各自携带自己的会话 ID，而不是根会话的 ID。其他 LLM 适配器没有请求头扩展点，不在覆盖范围内。

## 配置

bundle 插入 `llm-session-header` 行，默认 `headerName: X-Session-ID`。可以在 profile 自己的 patch 层覆盖（覆盖会替换整行 config）：

```yaml
- id: llm-session-header
  config:
    headerName: X-Session-ID
```

| 键 | 默认值 | 含义 |
|---|---|---|
| `headerName` | `X-Session-ID` | 用于承载会话 ID 的 HTTP 头名；必须是 RFC 9110 token。未知键和非法头名会导致激活失败。 |

头的值始终是原样的会话 ID（`String(request.sessionId)`）。

配置投影：schema 是手写的 StandardSchemaV1 校验器，因此 Loader 把该行的 Config 状态显示为 `unsupported`，设置页不会生成表单。请用上面的 YAML 覆盖来修改。

## 安装

包名 `@cyanogenic/dsh-session-header`，无构建步骤、无运行时依赖。通过 Host 插件管理器安装为 bundle（profile 的 `pnpm` 需在 Host PATH 上）：

```
plugin_manager install_bundle target=@cyanogenic/dsh-session-header
```

或作为普通依赖使用：

```
pnpm add @cyanogenic/dsh-session-header
```

安装会把 `@cyanogenic/dsh-session-header` 加入 profile 的 bundle 列表；管理器返回 `application: applied` 后，该行在整个 profile 内生效。通过同一个管理器移除 bundle 即可停止注入。

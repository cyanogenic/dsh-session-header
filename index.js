/**
 * Adds the exact Session id of the prepared model call to that call's
 * request-owned headers.
 *
 * The pi-ai adapter freezes the routing metadata of every inference request
 * (provider, model, endpoint, purpose, and the owning Session id) and asks
 * `llm-pi-ai/request-headers` listeners to prepare the outgoing headers.
 * Model discovery deliberately does not dispatch that event, and a call with
 * no Session (for example a standalone probe) simply carries no id, so the
 * header is present exactly when a Session owns the request.
 *
 * @module @cyanogenic/dsh-session-header
 */

/** Plugin name shown in Loader diagnostics. */
export const name = 'llm-session-header'

/** No Service is required: the extension point is an Event. */
export const inject = []

/** Header used when the profile row does not configure one. */
const DEFAULT_HEADER_NAME = 'X-Session-ID'

/** RFC 9110 `token` production, the only valid shape for an HTTP field name. */
const HEADER_NAME_PATTERN = /^[!#$%&'*+\-.^_`|~0-9A-Za-z]+$/

/**
 * Minimal StandardSchemaV1 config validator, so this bundle needs no runtime
 * dependency on a schema library.
 */
export const Config = {
  '~standard': {
    version: 1,
    vendor: 'dsh-session-header',
    validate(value) {
      const candidate = value ?? {}
      if (typeof candidate !== 'object' || Array.isArray(candidate)) {
        return { issues: [{ message: 'config must be an object' }] }
      }
      const unknown = Object.keys(candidate).filter((key) => key !== 'headerName')
      if (unknown.length > 0) {
        return { issues: [{ message: `unknown config key(s): ${unknown.join(', ')}` }] }
      }
      const headerName = candidate.headerName ?? DEFAULT_HEADER_NAME
      if (typeof headerName !== 'string' || !HEADER_NAME_PATTERN.test(headerName)) {
        return { issues: [{ message: 'headerName must be a valid HTTP header name (RFC 9110 token)' }] }
      }
      return { value: { headerName: headerName.toLowerCase() } }
    },
  },
}

/**
 * Register the header listener for the lifetime of the owning plugin context.
 * @param ctx - plugin context.
 * @param config - validated config: `{ headerName }`.
 */
export function apply(ctx, config) {
  const headerName = config?.headerName ?? DEFAULT_HEADER_NAME

  ctx.on('llm-pi-ai/request-headers', (request, headers, next) => {
    if (request.sessionId !== undefined) {
      headers.set(headerName, String(request.sessionId))
    }
    return next()
  })
}
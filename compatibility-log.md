# Compatibility Log

Running log of version-compatibility findings per the Agent Verification Protocol.

## Payload CMS + Next.js 16

Date checked: 2026-08-19
Source: https://payloadcms.com/docs/getting-started/installation
Finding: Payload's supported Next.js 16 range is 16.2.6+ only — 15.5 through
16.1.x is explicitly unsupported. Turbopack (default in Next 16) previously
broke Payload outright because @payloadcms/next unconditionally injected a
webpack config; fixed as of Payload 3.73.0, but the fix requires both
libraries to be recent enough. Cache Components support is partial — usable,
but the embedded admin panel can show a brief gray flash on hard refresh.
Action taken: Pin next@16.2.6+ and payload@3.73.0+ explicitly in package.json
before scaffolding. Do not let a scaffolding tool install "latest" without
checking these floors first.

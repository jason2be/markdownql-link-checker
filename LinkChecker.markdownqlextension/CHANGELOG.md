# Changelog

## 1.1.1

- Publish the completed reliability, recovery, filtering, and revision-bound navigation work as an independent extension release.

## 1.1.0

- Bound remote checks to one overall deadline and use host-owned, redirect-safe HTTP probing.
- Fall back from unsupported `HEAD` requests to a size-limited `GET` without exposing response bodies.
- Add explicit partial-result counts, local filtering, recoverable refresh, and revision-bound issue navigation.

## 1.0.0

- Add the first independently implemented behavior migration, inspired by MarkEdit Link Checker.
- Check anchors, local resources, WikiLinks, reference definitions, and HTTP(S) targets on demand.
- Present broken and unverifiable results in a host-rendered declarative utility window.

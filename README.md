# Link Checker

`com.markdownql.link-checker` is an MIT-licensed first-party extension for MarkdownQL. It is MarkdownQL's first explicitly documented behavior migration: the public behavior of another editor extension was studied, then independently implemented against the MarkdownQL Extension SDK without copying upstream source code.

## Features

- Run on demand from **Extensions → Check Links** or with `⌘⇧L`.
- Check heading anchors, relative files and images, WikiLinks, reference-style links, and HTTP(S) targets.
- Ignore links inside inline and fenced code.
- Distinguish broken targets from targets that cannot be verified.
- Bound remote checks to one overall deadline with redirect-safe probing and size-limited `GET` fallback.
- Report complete or partial results with local filtering and recoverable refresh.
- Navigate issue rows back to their source range only while the document revision still matches.
- Publish no command, surface, scan, or network work while disabled.

The JavaScript runtime has no direct filesystem or network access. It requests the bounded `document.links.check` host capability; MarkdownQL Core owns document authorization, local-folder containment, HTTP(S) probing, cancellation, and scope revocation.

## Release

- Extension version: `1.1.1`
- Release tag: `v1.1.1`
- Minimum MarkdownQL version: `5.0.0`
- SDK contract: `2.0-preview.2`
- Validation SDK: [`markdownql-extension-sdk` `v1.0.2`](https://github.com/jason2be/markdownql-extension-sdk/tree/v1.0.2)
- Runtime package: `LinkChecker.markdownqlextension`

## Validate

```sh
git clone --branch v1.0.2 https://github.com/jason2be/markdownql-extension-sdk.git
swift run --package-path markdownql-extension-sdk \
  markdownql-extension-validate LinkChecker.markdownqlextension
```

A successful validation prints an empty diagnostics array.

## Behavior reference and clean-room boundary

The behavior reference is [`akurach/markedit-link-checker`](https://github.com/akurach/markedit-link-checker) at commit [`1ae9051d3f3546d3abae33f94deb9f52aa05d756`](https://github.com/akurach/markedit-link-checker/tree/1ae9051d3f3546d3abae33f94deb9f52aa05d756), upstream version `0.1.0`.

When reviewed on 2026-08-21, that repository contained neither a `LICENSE`/`COPYING` file nor a package license declaration. No upstream TypeScript or other source code was copied or adapted. The implementation in this repository is original MarkdownQL extension code released under MIT.

The extension intentionally uses a result window rather than MarkEdit's editor underlines. Source navigation is now implemented through an opaque, revision-bound host contract; native editor, filesystem, and network objects remain unavailable to the extension.

## Repository layout

The `.markdownqlextension` package is a child of the repository so repository documentation and CI files do not become undeclared runtime payloads.

## License

Original code in this repository is available under the [MIT License](LICENSE).

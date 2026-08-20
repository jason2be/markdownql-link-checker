# Link Checker

Link Checker is MarkdownQL's first behavior-migrated Extension. It checks heading anchors, local files and images, WikiLinks, reference-style links, and HTTP(S) links only after the user runs **Check Links**.

## Reference and provenance

The product behavior was independently reimplemented with reference to [akurach/markedit-link-checker](https://github.com/akurach/markedit-link-checker) at commit `1ae9051d3f3546d3abae33f94deb9f52aa05d756` (upstream version `0.1.0`). The referenced repository did not contain a license file or a package license declaration when reviewed on 2026-08-21. No upstream TypeScript or other source code is copied into this package.

The JavaScript package is published independently under the MIT License at [jason2be/markdownql-link-checker](https://github.com/jason2be/markdownql-link-checker). The Swift host capability remains part of MarkdownQL Core and is not included in the extension repository.

## Security and lifecycle

The isolated JavaScript runtime has no filesystem or network access. It requests one bounded host capability, `document.links.check`; the host checks the current document snapshot, targets inside the authorized document folder, and HTTP(S) targets. Disabled packages publish no menu or utility surface and perform no scan or network request.

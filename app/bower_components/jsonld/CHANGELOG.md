# jsonld ChangeLog

## [Unreleased]

## [0.4.6] - 2016-03-02

### Added
- Add `headers` and `request` option for node doc loader.

### Changed
- Include local tests.

## [0.4.5] - 2016-01-19

### Fixed
- N-Quads comments pattern.
- Local tests.

## [0.4.4] - 2016-01-08

### Fixed
- Document cache in default node document loader is broken; disable
  until HTTP caching is implemented.

## [0.4.3] - 2016-01-05

### Fixed
- N-Quads may contain comments.

## [0.4.2] - 2015-10-12

### Added
- Add inputFormat and algorithm options to normalize.

### Changed
- Add support for normalization test suite.
- Support URDNA2015 normalization algorithm.
- Add async scheduling of normalization algorithms.

### Fixed
- Ignore null values in language maps.

## [0.4.1] - 2015-09-12

### Changed
- Ignore jsonld-request and pkginfo for browserify.

## [0.4.0] - 2015-09-12

### Breaking Changes
- "request" extension moved to [jsonld-request][]. This was done to simplify
  the core JSON-LD processing library. In particular, the extension pulled in
  RDFa processing code and related dependencies. The old method of using this
  exension of `jsonld.use('request')` is deprecated in favor of using the new
  module directly.
- The `jsonld` tool moved to [jsonld-cli][]. This was also done to simplify the
  core JSON-LD processing library and because it uses the [jsonld-request][]
  module.

## [0.3.26] - 2015-09-01

## Before 0.3.26

- See git history for changes.

[jsonld-cli]: https://github.com/digitalbazaar/jsonld-cli
[jsonld-request]: https://github.com/digitalbazaar/jsonld-request

[Unreleased]: https://github.com/digitalbazaar/jsonld/compare/0.4.6...HEAD
[0.4.6]: https://github.com/digitalbazaar/jsonld/compare/0.4.5...0.4.6
[0.4.5]: https://github.com/digitalbazaar/jsonld/compare/0.4.4...0.4.5
[0.4.4]: https://github.com/digitalbazaar/jsonld/compare/0.4.3...0.4.4
[0.4.3]: https://github.com/digitalbazaar/jsonld/compare/0.4.2...0.4.3
[0.4.2]: https://github.com/digitalbazaar/jsonld/compare/0.4.1...0.4.2
[0.4.1]: https://github.com/digitalbazaar/jsonld/compare/0.4.0...0.4.1
[0.4.0]: https://github.com/digitalbazaar/jsonld/compare/0.3.26...0.4.0
[0.3.26]: https://github.com/digitalbazaar/jsonld/compare/0.3.25...0.3.26

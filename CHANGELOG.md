# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.998.2] - 2025-11-29

### Changed

- Updated Flow module documentation to remove AsyncGraph references due to race condition concerns
- Clarified custom operator usage with `predSatisfied` method and `OpAdapter` for trading-core compatibility

### Added

- Sub-module deep import support via package.json exports (`/indicators`, `/primitive`, `/aggregation`, `/heuristics`, `/flow`)

## [0.996.0] - 2025-11-24

### Changed

- Refactored Graph to use sync-only execution model for improved performance
- Implemented heuristics pattern matching for enhanced analysis capabilities
- Integrated trading-core facilities for better compatibility and resource utilization
- Miscellaneous breaking API changes to improve consistency and maintainability

## [0.99.0] - 2025-11-17

### Added

- Graph reactive state management system with automatic dependency tracking
- Registry for managing Graph instances with JSON persistence
- Batch operations for efficient state updates
- Comprehensive test suite for Graph functionality
- Performance benchmarks and profiling tools

## [0.9.2] - 2025-11-15

### Added

- First public release on npm as `@junduck/trading-indi`

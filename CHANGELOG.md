# Changelog

## Unpublished
- **Localization**: Added translations for all VS Code supported languages (zh-cn, zh-tw, fr, de, it, es, ja, ko, pt-br, tr, pl, cs, hu).
- **Bugfix**: Removed duplicate `-ferror-limit=0` flag from generated `.clangd` config (already present in baseFlags).

## 1.0.0
- **Major Architecture Shift**: Migrated from Microsoft C/C++ to **clangd** for superior MQL intellisense and performance.
- **Performance Overhaul**: Converted blocking synchronous I/O to asynchronous operations across the extension.
- **Compilation Database**: Added automatic generation of `compile_commands.json` for precise per-file clangd configuration.
- **Centralized Diagnostics**: Compiler errors and warnings now appear directly in the VS Code **Problems** tab.
- **Improved UI Responsiveness**: Optimized color providers and completion items to prevent high CPU load on large documents.
- **Reliability**: Added a Mocha unit testing suite for core logic.

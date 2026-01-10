# Changelog

## Unpublished
- **Localization**: Added translations for all VS Code supported languages (zh-cn, zh-tw, fr, de, it, es, ja, ko, pt-br, tr, pl, cs, hu).
- **Bugfix**: Removed duplicate `-ferror-limit=0` flag from generated `.clangd` config (already present in baseFlags).

## 1.0.8
- **Keyboard Shortcuts**: Added keyboard shortcuts for common commands:
  - `Ctrl+Alt+M`: Create MQL configuration
  - `Ctrl+Alt+O`: Open in MetaEditor
  - `Ctrl+Alt+C`: Create function comment
  - `Ctrl+Alt+I`: Insert MQH include

## 1.0.7
- **MQL5 Help**: Direct links to online documentation pages in the language of the user's VS Code.
- **Offline Help**: New command `MQL: Get the MQL4/MQL5 offline help` opens local CHM files from MetaTrader Terminal with keyword anchor (Windows/macOS/Linux). No help files are shipped with the extension.

## 1.0.0
- **Major Architecture Shift**: Migrated from Microsoft C/C++ to **clangd** for superior MQL intellisense and performance.
- **Performance Overhaul**: Converted blocking synchronous I/O to asynchronous operations across the extension.
- **Compilation Database**: Added automatic generation of `compile_commands.json` for precise per-file clangd configuration.
- **Centralized Diagnostics**: Compiler errors and warnings now appear directly in the VS Code **Problems** tab.
- **Improved UI Responsiveness**: Optimized color providers and completion items to prevent high CPU load on large documents.
- **Reliability**: Added a Mocha unit testing suite for core logic.

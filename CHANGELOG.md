# Changelog

## 1.0.10

### Configuration
- **Portable Mode Support**: Added `Portable4` and `Portable5` settings to enable MetaTrader's `/portable` switch for compilation and opening files in MetaEditor. This is useful for portable MetaTrader installations that store data in the terminal folder instead of AppData.

## 1.0.9

### QuickFixes
- **Spelling Suggestions**: Detects misspelled MQL function names and offers "Did you mean 'X'?" fixes.
- **Open Documentation**: Error 199 (wrong parameters count) - opens MQL5 docs for the function.
- **Declare Variable**: Error 256 (undeclared identifier) - offers to declare as input parameter or local variable.
- **Add Return Statement**: Errors 117/121 (missing return) - inserts appropriate return statement.
- **Entry Point Skeletons**: Errors 209/356 (missing entry point) - inserts OnCalculate/OnTick/OnStart templates.
- **Enum Suggestions**: Error 262 (cannot convert to enum) - suggests common enum values for indicator/trading functions.
- **Include Fix**: clangd "unknown type name" - adds `#ifdef __clang__` include directive.

### IntelliSense
- Suppress `this.` member access diagnostics - MQL allows `this.member` syntax without pointer semantics.
- Added function overloads for MQL4 legacy trading functions, series Copy functions, and Object/Chart getter functions.
- Added missing MQL5 constants and functions - extended `ENUM_DEAL_REASON` values, Database/SQLite API, and Economic Calendar API.

### Snippets
- Added 20+ MQL5 code snippets for common patterns:
  - Event handlers: `OnInit`, `OnDeinit`, `OnTick`, `OnStart`, `OnCalculate`, `OnTimer`, `OnChartEvent`, `OnTrade`, `OnTradeTransaction`
  - Trading: `OrderSend` with `MqlTradeRequest`, indicator handle creation
  - Data: `CopyRates`/`CopyBuffer` with error handling
  - Declarations: input parameters, properties, classes, enums, comments

### Configuration
- **Improved clangd config**: Better organized suppressions by category with explanatory comments.
- **Diagnostics**: Clickable error codes in Problems panel now link to MQL5 documentation.
- **Localization**: Added translations for all VS Code supported languages (zh-cn, zh-tw, fr, de, it, es, ja, ko, pt-br, tr, pl, cs, hu).

### Bugfixes
- Removed duplicate `-ferror-limit=0` flag from generated `.clangd` config.
- Fixed MQL4/MQL5 version define handling in mixed workspaces - version defines are now set per-file based on extension.

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

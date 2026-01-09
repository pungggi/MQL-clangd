# Changelog

## 1.0.0
- **Major Architecture Shift**: Migrated from Microsoft C/C++ to **clangd** for superior MQL intellisense and performance.
- **Performance Overhaul**: Converted blocking synchronous I/O to asynchronous operations across the extension.
- **Compilation Database**: Added automatic generation of `compile_commands.json` for precise per-file clangd configuration.
- **Centralized Diagnostics**: Compiler errors and warnings now appear directly in the VS Code **Problems** tab.
- **Improved UI Responsiveness**: Optimized color providers and completion items to prevent high CPU load on large documents.
- **Reliability**: Added a Mocha unit testing suite for core logic.
- **Automatic Migration**: Automated workspace configuration for users upgrading to the 1.0.0 milestone.

## 0.1.0
- Switched C++ IntelliSense engine from Microsoft C/C++ to clangd for improved performance and accuracy.
- Initial release
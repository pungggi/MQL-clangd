> **Note**: This is a fork of the [MQL Tools](https://github.com/L-I-V/MQL-Tools) by **L-I-V**. This edition adds **clangd** support and significant performance optimizations.
>
> 📋 **[View Changelog](CHANGELOG.md)** for the latest updates and improvements.

---

### 🔄 Differences from MQL Tools

| Feature | MQL Tools | MQL Clangd |
|---------|-----------|------------|
| IntelliSense Engine | Microsoft C++ | **clangd** |
| Performance | Synchronous I/O | **Async I/O** |
| `compile_commands.json` | ❌ | ✅ |
| Diagnostics in Problems tab | ❌ | ✅ |
| Multi-root workspace support | ❌ | ✅ |
| Direct MQL5 doc links | ❌ | ✅ |
| Offline CHM help | ❌ | ✅ |

---

### 🚀 IntelliSense & Semantic Support
This extension now uses **clangd** to provide state-of-the-art IntelliSense, code completion, and navigation for MQL4/5. 

*   **Why clangd?** It provides faster, more accurate semantic analysis and better support for complex MQL projects compared to the default Microsoft C++ engine.
*   **Automatic Configuration**: When you run the `"MQL: Create configuration"` command, the extension automatically configures `clangd` with the correct include paths and compiler flags for your MQL version (MQL4 or MQL5).
*   **Conflict Prevention**: To ensure the best experience, this extension automatically disables the Microsoft C++ "IntelliSense Engine" (while keeping the extension installed for other features) to prevent duplicate errors and completion items.

---

### 🛠 Quick Setup Guide: 

1.  **Installation**:
    *   Install this **MQL Clangd** extension from the VS Code Marketplace.
    *   *Note: The **clangd** extension will be automatically installed as a required dependency.*

2.  **Open your project**:
    *   Open your MQL project folder (e.g., your `MQL5` or `MQL4` folder).
    *   **Pro Tip**: Ensure your folder name contains "MQL4" or "MQL5" for automatic version detection.

3.  **Basic Configuration**:
    *   Open Settings (`Ctrl+,`) and search for `MQL Clangd`.
    *   Provide the path to your **MetaEditor** executable (essential for compilation).

4.  **Initialize IntelliSense**:
    *   Press `Ctrl+Shift+P` and run the command: `"MQL: Create configuration"`.
    *   This one-time setup configures `clangd` to recognize your MQL code and libraries.

5.  **Bonus: Icons**:
    *   If you wish, set custom icons for MQL files. Press `Ctrl+Shift+P`, select `"MQL: Add icons to the theme"`, and choose your preferred MQL-supported theme.

---

### 💡 Important Notes:
*   **Multi-root workspaces**: The configuration tool supports multi-root workspaces and will prioritize settings for the currently active file's folder.
*   **Settings Merge**: The extension is built to be "clean" - it merges MQL flags with your existing `clangd.fallbackFlags` rather than overwriting them.
*   **Compiler Flags**: We automatically inject `-xc++` and `-std=c++17` along with version-specific defines (`__MQL4__`/`__MQL5__`) to help clangd understand MQL syntax.
*   **Third-party Libraries**: If you use libraries like `JAson.mqh` and clangd reports "Unknown type" errors, you have two options:

    **Option A** - Add to settings (global, affects all files):
    ```json
    {
        "mql_tools.Clangd.ForcedIncludes": [
            "Include/JAson.mqh"
        ]
    }
    ```

    **Option B** - Add conditional include in your code (per-file):
    ```mql5
    #ifdef __clang__
    #include <JAson.mqh>
    #endif
    ```
    This include is only seen by clangd and ignored by MetaEditor.



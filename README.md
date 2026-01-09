> **Note**: This is a fork of the [MQL Tools](https://github.com/L-I-V/MQL-Tools) by **L-I-V**. This edition adds **clangd** support and significant performance optimizations.
>
> 📋 **[View Changelog](CHANGELOG.md)** for the latest updates and improvements.

# MQL Tools for VS Code

A comprehensive VS Code extension for MQL4/MQL5 development with modern IntelliSense powered by **clangd**.

## ✨ Key Features

- 🧠 **Smart IntelliSense** - Powered by clangd for accurate code completion and navigation
- ⚡ **Fast Compilation** - Direct MetaEditor integration with error parsing
- 🎨 **Syntax Highlighting** - Full MQL4/MQL5 syntax support
- 📚 **Comprehensive API** - 1000+ MQL functions with documentation
- 🔧 **Auto-Configuration** - One-click setup for your MQL environment

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

## Core Features

### 1. Checking the syntax of mqh/mq4/mq5 files (without compilation).

### 2. Compilation of mq4/mq5 files.

### 3. Compilation of mq4/mq5 files using script.
The script opens the file "mq4/mq5" in the "MetaEditor" and clicks the "Compile" button, thus MT4/MT5 is automatically updated. (`The idea is taken` [from here](https://www.mql5.com/en/blogs/post/719548/page2#comment_16501434)).

![](https://raw.githubusercontent.com/L-I-V/MQL-Tools/master/images/Mql_comp.jpg)

### 4. Opening the MQL help.
To find the word you need in the MQL help, put the cursor on it or highlight it and then press F1.

### 5. In the explorer context menu, added items:
- "Open in 'MetaEditor'"
- "Show/hide ex4/ex5 files"
- "Insert MQH as #include"

    ![](https://raw.githubusercontent.com/L-I-V/MQL-Tools/master/images/InsertInclude+.gif)

- "Insert the file name 'mq4/mq5' in 'mqh'"

    (When working with the "mqh" file, in order not to switch to the "mq4/mq5" file window during compilation, you should write the name of the "mq4/mq5" file on the first line. Example: //###<Experts/Examples/MACD Sample.mq5>).

    ![](https://raw.githubusercontent.com/L-I-V/MQL-Tools/master/images/InsertMQH.gif)


### 6. Creating a comment for a function.
![](https://raw.githubusercontent.com/L-I-V/MQL-Tools/master/images/CreateComment.gif)

### 7. Visualizing and modify mql colors.

![](https://raw.githubusercontent.com/L-I-V/MQL-Tools/master/images/ColorsMql+.jpg)

### 8. Autocomplete of entering names of variables, constants and MQL5 functions.

### 9. Displaying information about mql5 function when hovers show the mouse cursor over its name.

### 10. MQL syntax highlighting.

---

### 🚀 IntelliSense & Semantic Support
This extension now uses **clangd** to provide state-of-the-art IntelliSense, code completion, and navigation for MQL4/5. 

*   **Why clangd?** It provides faster, more accurate semantic analysis and better support for complex MQL projects compared to the default Microsoft C++ engine.
*   **Automatic Configuration**: When you run the `"MQL: Create configuration"` command, the extension automatically configures `clangd` with the correct include paths and compiler flags for your MQL version (MQL4 or MQL5).
*   **Conflict Prevention**: To ensure the best experience, this extension automatically disables the Microsoft C++ "IntelliSense Engine" (while keeping the extension installed for other features) to prevent duplicate errors and completion items.

---

### 🛠 Quick Setup Guide: 

1.  **Installation**:
    *   Install this **MQL Tools** extension from the VS Code Marketplace.
    *   *Note: The **clangd** extension will be automatically installed as a required dependency.*

2.  **Open your project**:
    *   Open your MQL project folder (e.g., your `MQL5` or `MQL4` folder).
    *   **Pro Tip**: Ensure your folder name contains "MQL4" or "MQL5" for automatic version detection.

3.  **Basic Configuration**:
    *   Open Settings (`Ctrl+,`) and search for `MQL Tools`.
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

---

### 📋 Available Commands

| Command | Description |
|---------|-------------|
| `MQL: Create configuration` | Configure clangd for your MQL project |
| `MQL: Compile` | Compile the current file with MetaEditor |
| `MQL: Compile with script` | Compile using AutoHotkey script |
| `MQL: Syntax check` | Check syntax without full compilation |
| `MQL: Add icons to the theme` | Add MQL file icons to your theme |
| `MQL: Open in MetaEditor` | Open current file in MetaEditor |

---

### ⚙️ Extension Settings

| Setting | Description | Default |
|---------|-------------|---------|
| `mql_tools.MetaEditor.Path` | Path to MetaEditor64.exe | Auto-detected |
| `mql_tools.Clangd.ForcedIncludes` | Additional includes for clangd | `[]` |
| `mql_tools.Clangd.AdditionalFlags` | Extra compiler flags | `[]` |
| `mql_tools.Compilation.ShowWarnings` | Show warnings in Problems panel | `true` |

---

### 🔧 Troubleshooting

**clangd not finding includes?**
- Run `MQL: Create configuration` again
- Check that your workspace folder contains "MQL4" or "MQL5" in the path

**Duplicate IntelliSense suggestions?**
- The extension automatically disables Microsoft C++ IntelliSense
- If issues persist, disable the C/C++ extension manually

**Compilation errors not showing?**
- Ensure MetaEditor path is correctly configured
- Check the Output panel (View → Output → MQL Tools)

---

### 📦 What's New in This Fork

- **clangd Integration**: Modern IntelliSense with semantic analysis
- **compile_commands.json**: Per-file compiler flags for accurate diagnostics
- **MQL4/MQL5 Detection**: Automatic version detection from folder names
- **Economic Calendar API**: Full support for calendar functions
- **Database Functions**: SQLite database API support
- **Extended Enums**: All MQL5 constants including DEAL_REASON, SYMBOL_SECTOR, etc.

---

### 🤝 Contributing

Contributions are welcome! Please feel free to submit issues and pull requests.

---

### 📄 License

This project is licensed under the MIT License - see the original [MQL Tools](https://github.com/L-I-V/MQL-Tools) repository for details.

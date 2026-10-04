# Security Policy

## Reporting Security Issues

If you discover a security vulnerability in FocusContract, please report it via GitHub Private Vulnerability Reporting or email the maintainers directly. Please do not open public issues for sensitive security vulnerabilities until they have been addressed.

## Architecture and Process Safety

FocusContract strictly adheres to non-invasive process management principles:

1. **No Code Injection & No Memory Access:**
   FocusContract does **NOT** inject DLLs, inspect memory, install kernel drivers, hook API functions, or modify target executables.
2. **Standard OS Facilities Only:**
   Process discovery uses standard Windows APIs (`tasklist` / native Windows toolhelp snapshots). Foreground window detection queries the Windows window manager (`active-win`). Process closing uses standard `taskkill` calls (`WM_CLOSE` graceful top-level window closure followed by `taskkill /F /T` if unresponsive after 3 seconds).
3. **Electron Security Posture:**
   - `contextIsolation: true`
   - `nodeIntegration: false`
   - `sandbox: true`
   - Strict Content Security Policy (CSP)
   - Strongly-typed IPC bridges with runtime validation using `zod`
4. **Honest Self-Regulation Scope:**
   FocusContract is a self-regulation tool, not a malware/parental control sandbox. It does not tamper with system files or run rootkits. Users can terminate the process via Task Manager or edit the local store if they choose to bypass it.

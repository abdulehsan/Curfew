# Curfew Architecture

Curfew is built on strict engineering principles ensuring deterministic behavior, cross-platform extensibility, and testability.

```
                      +---------------------------------------+
                      |             Electron Main             |
                      |                                       |
                      |  +---------------------------------+  |
                      |  |       Engine Orchestrator       |  |
                      |  |                                 |  |
                      |  |   +--------------------------+  |  |
                      |  |   |    Pure State Machine    |  |  |
                      |  |   |  (No OS/Electron imports)|  |  |
                      |  |   +--------------------------+  |  |
                      |  +---------------------------------+  |
                      |         |                      |      |
                      |   Platform Providers      Store (JSON)|
                      |  (Win32 / Interfaces)                 |
                      +---------------------------------------+
                                        | (Typed IPC + Zod)
                      +---------------------------------------+
                      |         Renderer (React App)          |
                      |       Dashboard & Grace Overlay       |
                      +---------------------------------------+
```

## 1. Pure State Machine (`src/main/engine/stateMachine.ts`)
The core strike and budget transition logic is an immutable, pure state machine. It takes the current state, an event, and configuration, returning the next state and any side effects (e.g. notify, kill).
- Zero OS or Electron imports.
- Injected interfaces:
  - `Clock`: Returns `now(): number` and `today(): string (YYYY-MM-DD)`.
  - `ProcessProvider`: Returns list of running processes with PIDs and names.
  - `WindowProvider`: Returns current foreground window title and process name.
  - `IdleProvider`: Returns system idle time in milliseconds.
  - `ProcessKiller`: Executes graceful `WM_CLOSE` and forced termination.

## 2. Platform Layer (`src/main/platform/`)
Platform specific implementations reside in `src/main/platform/windows/`:
- `activeWindow.ts`: Dynamic import of `active-win` to inspect the foreground process.
- `processList.ts`: Native process query via `tasklist.exe` (execFile safe).
- `killer.ts`: Graceful `WM_CLOSE` (`taskkill /PID <pid>`), wait 3s, then force `taskkill /F /PID <pid> /T`.
- `idle.ts`: System idle query via Electron `powerMonitor.getSystemIdleTime()`.
- `autostart.ts`: Windows login item management via `app.setLoginItemSettings()`.

## 3. IPC Architecture & Security
- Preload scripts expose an immutable `window.api` bridge with strictly whitelisted channels.
- Main process IPC handlers validate every inbound request payload with `zod`.
- Renderer never directly accesses Node.js, Electron internals, or the file system.
- State updates are broadcast via push notifications (`IPC_CHANNELS.STATE_UPDATED`) to all open windows.

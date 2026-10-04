# Anti-Cheat Compatibility & Safety

## Non-Invasive Design Guarantee

Curfew is designed from the ground up to be 100% compliant with anti-cheat software (such as Riot Vanguard, Easy Anti-Cheat, BattlEye, Valve Anti-Cheat, and Ricochet).

### How Curfew Interacts with Games
- **Window Identification:** Uses the Windows Win32 API (`GetForegroundWindow`, `GetWindowTextW`) via the standard `active-win` library to see which window currently has focus.
- **Process Listing:** Periodically queries the OS process table using standard Windows process enumerations (`tasklist.exe` / Windows API).
- **Process Termination:** When curfew is enforced, Curfew issues standard OS termination commands via `taskkill.exe /PID <pid>`.

### What Curfew NEVER Does
- ❌ **No DLL Injection:** Never injects code or loads DLLs into other processes.
- ❌ **No Memory Reading or Writing:** Does not open process handles with `PROCESS_VM_READ` or `PROCESS_VM_WRITE`.
- ❌ **No Kernel Drivers:** Does not load or install any kernel-mode drivers or filter drivers.
- ❌ **No Hooking:** Does not install global keyboard hooks, mouse hooks, or API detours.
- ❌ **No Screen Capture / Memory Scraping:** Does not capture game pixels or read game data structures.

## Verified Compatibility

| Game / Platform | Anti-Cheat System | Interaction Mechanism | Verified Status |
| :--- | :--- | :--- | :--- |
| **Valorant** | Riot Vanguard (kernel driver) | Foreground window title + `VALORANT-Win64-Shipping.exe` PID lookup | Compatible & Safe |
| **Steam Games (e.g. CS2, Dota 2, TF2)** | Valve Anti-Cheat (VAC) | Foreground window title + executable PID lookup | Compatible & Safe |
| **Apex Legends / Fortnite** | Easy Anti-Cheat / BattlEye | Foreground window title + executable PID lookup | Compatible & Safe |
| **Call of Duty** | Ricochet Anti-Cheat | Foreground window title + executable PID lookup | Compatible & Safe |

> [!NOTE]
> For games with dedicated launchers (such as Riot Games launcher `RiotClientServices.exe`), Curfew lets you choose between tracking the launcher or tracking the actual game binary (`VALORANT-Win64-Shipping.exe`). We recommend tracking the game binary directly.

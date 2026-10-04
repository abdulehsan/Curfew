# Manual QA Testing Checklist

This checklist documents manual testing procedures for FocusContract across real-world games, browsers, and Windows lifecycle events.

## Test Matrix

### 1. Valorant (Riot Vanguard & Launcher Separation)
- [ ] Launch `RiotClientServices.exe` (Riot Client). Ensure FocusContract does not prematurely deduct time if only tracking the game.
- [ ] In FocusContract Target List, select `VALORANT-Win64-Shipping.exe`.
- [ ] Launch Valorant into practice range or custom lobby.
- [ ] Verify FocusContract detects `VALORANT-Win64-Shipping.exe` as active foreground window and starts deducting time.
- [ ] Alt-Tab to desktop or browser; verify time deduction pauses immediately.
- [ ] When budget reaches zero, verify strike prompt overlay appears without minimizing or interrupting game fullscreen.
- [ ] Exhaust 3 strikes; verify the 100-second Save Progress Grace overlay appears on screen.
- [ ] Confirm Windows notifications fire at 100s, 30s, and 10s.
- [ ] At 0s, verify Valorant receives `WM_CLOSE` and exits safely without triggering Vanguard crash alerts.

### 2. Steam Game (Counter-Strike 2 / Dota 2 / Steam Client)
- [ ] Add Steam game binary (e.g. `cs2.exe`) to target list.
- [ ] Run game. Verify live tracking badge transitions to `TRACKING` and timer decreases.
- [ ] Request strike extension (+5 minutes); verify strikes increment (1/3) and time adds properly.
- [ ] Close game voluntarily during GRACE period; verify app immediately transitions to `LOCKED`.
- [ ] Attempt to restart `cs2.exe` while in `LOCKED`; verify FocusContract terminates it within 1000ms.

### 3. Web Browser Target (`chrome.exe` / `msedge.exe`)
- [ ] Add `chrome.exe` or `msedge.exe` via Targets manager.
- [ ] Verify the UI displays the browser alert: *"Warning: Closing a web browser will close all open tabs and windows!"*
- [ ] Run browser in foreground; verify time decrements.
- [ ] Let budget expire and grace finish; verify browser closes gracefully.

### 4. System Idle & AFK Protection
- [ ] Set Idle Threshold in Settings to 30 seconds.
- [ ] Keep target game active in foreground.
- [ ] Leave mouse/keyboard completely untouched for 35 seconds.
- [ ] Verify status transitions to Standby ("System idle threshold exceeded - time deduction paused").
- [ ] Move mouse; verify tracking resumes without wiping any extra time.

### 5. Windows Sleep, Resume & Reboot Persistence
- [ ] Start session with 45 minutes remaining. Play for 2 minutes (remaining: 43 mins).
- [ ] Put Windows to Sleep (`powercfg /hibernate` or Start Menu -> Sleep).
- [ ] Wake PC after 10 minutes.
- [ ] Verify remaining time is clamped (`delta <= 5000ms`) and still ~43 minutes (sleep duration did NOT wipe the budget).
- [ ] Verify `focuscontract-config.json` in AppData retains accurate remaining time and strike counts across PC restart.

### 6. Midnight Daily Reset
- [ ] Lock out app (State: `LOCKED`, Strikes: 3/3).
- [ ] Change system date to tomorrow's date.
- [ ] Verify on the next tick, state cleanly resets to `IDLE_BUDGET`, strikes reset to 0/3, and full daily budget is restored.
- [ ] Roll system date backward to yesterday.
- [ ] Verify clock rollback protection prevents resetting from `LOCKED`.

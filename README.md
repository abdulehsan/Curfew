# Curfew 🎯

> **Intent-based accountability tool for Windows.** Set a daily budget for gaming and distraction apps. Run out of time? Get 3 strikes with extensions, followed by an unmistakable 100-second save-your-progress grace period before gentle shutdown. No surprise mid-match kills.

[![CI](https://github.com/abdulehsan/Curfew/actions/workflows/ci.yml/badge.svg)](https://github.com/abdulehsan/Curfew/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Platform: Windows](https://img.shields.io/badge/Platform-Windows%2010%2F11-0078D6.svg)](https://microsoft.com)

---

## What is Curfew?

Unlike brutal blockers that forcefully terminate your game in the middle of a competitive ranked match or un-saved boss battle, Curfew respects your focus and intent:

1. **Daily Time Budget:** Allocate your preferred gaming time per day (e.g., 60 minutes).
2. **Three Strikes:** When your budget hits zero, an overlay appears offering an extension (up to 30 mins). You have 3 strikes total.
3. **100s Save-Your-Progress Grace Countdown:** Once all 3 strikes are exhausted, you receive a clear, persistent 100-second countdown overlay and Windows notifications at 100s, 30s, and 10s.
4. **Gentle Enforcement:** After the countdown, the app sends a standard `WM_CLOSE` to let the game exit cleanly. If unresponsive after 3 seconds, it terminates the process tree and enters `LOCKED` until tomorrow.

---

## Honest Self-Regulation & Limits

Curfew is designed for **consenting adults practicing digital self-discipline**, not adversarial parental surveillance:
- **Task Manager / Process Killers:** A user with administrative access can terminate Curfew or uninstall it.
- **Clock Rollbacks:** The engine guards against system clock rollbacks (lockouts will not reset if the clock is dialed backwards).
- **Configuration Files:** The local configuration can be edited directly if desired.
- **SmartScreen Notice:** Unsigned community builds will trigger Windows SmartScreen warnings. You can click *"More info" -> "Run anyway"*. We are actively pursuing open-source code signing via SignPath.

See [docs/ANTI_CHEAT.md](docs/ANTI_CHEAT.md) for full anti-cheat verification details (Valorant, Steam, Vanguard, VAC safe).

---

## Installation & Download

Download the latest installer or portable executable from the [GitHub Releases](https://github.com/abdulehsan/Curfew/releases) page:
- `Curfew-Setup-<version>.exe` (Full NSIS Installer with autostart support)
- `Curfew-<version>-portable.exe` (Standalone portable executable)

---

## Development Setup

```bash
# Clone the repository
git clone https://github.com/abdulehsan/Curfew.git
cd Curfew

# Install dependencies (Node 20+, pnpm 9+)
pnpm install

# Run development mode
pnpm dev

# Run unit tests and coverage
pnpm test
pnpm test:coverage

# Build release binaries
pnpm build:win
```

## Contributing
Please see [CONTRIBUTING.md](CONTRIBUTING.md) and [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).

## License
[MIT](LICENSE) © Curfew Contributors

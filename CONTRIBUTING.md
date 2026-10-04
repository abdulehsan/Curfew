# Contributing to FocusContract

Thank you for your interest in contributing to FocusContract!

## Development Setup

1. **Prerequisites:**
   - Node.js >= 20.x
   - pnpm >= 9.x
   - Windows 10/11 build environment

2. **Clone & Install:**
   ```bash
   git clone https://github.com/FocusContract/focuscontract.git
   cd focuscontract
   pnpm install
   ```

3. **Running Dev Mode:**
   ```bash
   pnpm dev
   ```

4. **Running Tests:**
   ```bash
   pnpm test
   pnpm test:coverage
   ```

5. **Linting and Typechecking:**
   ```bash
   pnpm lint
   pnpm typecheck
   ```

## Branch Naming & Commits

- We enforce [Conventional Commits](https://www.conventionalcommits.org/):
  - `feat: add process picker filtering`
  - `fix: prevent race condition on graceful exit`
  - `docs: update anti-cheat details`
  - `test: add unit tests for midnight reset`
- Branch naming convention:
  - `feature/your-feature-name`
  - `fix/issue-description`
  - `docs/doc-updates`

## Pull Request Checklist

1. Strict TypeScript: no `any` annotations.
2. All unit tests pass with 90%+ engine coverage.
3. ESLint and Prettier passes cleanly.
4. Keep the core logic pure: never import Electron or OS-specific code into `src/main/engine/`.

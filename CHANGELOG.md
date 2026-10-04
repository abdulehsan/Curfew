# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-10-05

### Added
- Pure state machine architecture with deterministic strike engine and time tracking.
- Grace period countdown overlay (100 seconds) with progress-saving alert.
- Process termination ladder (`WM_CLOSE` followed by force kill).
- Dark-mode React dashboard and overlay window.
- Electron security hardening (`contextIsolation`, strict CSP, sandboxing, Zod IPC validation).
- Anti-cheat compliance documentation and verification for Valorant, Steam, etc.
- Windows NSIS installer and portable packaging configuration.

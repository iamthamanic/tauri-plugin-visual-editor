# Feature: packages/inspector-app: settings persistence

<!-- seeded by ecc-runner from issue #13 -->

## Intent
From GitHub issue #13: Persistent settings: theme, shortcut, overlay color, cropPadding, screenshotDir.

## Happy Path
- [x] Settings dialog in inspector app
- [x] Persist to disk across sessions
- [x] Session-only state NOT persisted (selections, captures, issue)
- [x] screenshotDir modes: appData, project (needs projectRoot), temp, absolutePath

## Edge Cases
- [ ] Invalid cropPadding rejected with German error
- [ ] absolutePath without path rejected

## Regression
- [ ] Inspector panel still hydrates via getState + push

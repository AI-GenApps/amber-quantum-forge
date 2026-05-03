# 01 — Prerequisites

Install the following tools before setting up the project.

## Required

### Bun ≥1.1

```bash
curl -fsSL https://bun.sh/install | bash
```

### Node.js ≥20

Required by some tools that don't use Bun's runtime. Install via [nvm](https://github.com/nvm-sh/nvm) or [Homebrew](https://brew.sh):

```bash
brew install node
```

### Firebase CLI

```bash
bun add -g firebase-tools
```

### EAS CLI (Expo Application Services)

```bash
bun add -g eas-cli
```

## Required for iOS (epic 05+)

### Xcode 26.2+

Install from the Mac App Store. iOS 17 minimum deployment target.

### XcodeGen

```bash
brew install xcodegen
```

### SwiftLint

```bash
brew install swiftlint
```

### swift-format

```bash
brew install swift-format
```

## Notes

- **No Ruby, no CocoaPods.** This project uses SPM (Swift Package Manager) exclusively for iOS dependencies.
- All JS/TS dependency management uses **Bun only**. Never use `npm` or `yarn`.

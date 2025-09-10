# Publication Guide for trace-pretty

## Steps to Publish to npm

### 1. Prerequisites
```bash
# Make sure you're logged into npm
npm whoami
# If not logged in:
npm login
```

### 2. Prepare for Publication
```bash
# Clean build
npm run prepare

# Test the CLI works
echo "Error: Test" | node dist/cli/index.js

# Test all examples
npm run test:advanced
npm run test:cli
```

### 3. Version Management
```bash
# Bump version (choose one)
npm version patch  # 1.0.0 -> 1.0.1
npm version minor  # 1.0.0 -> 1.1.0  
npm version major  # 1.0.0 -> 2.0.0

# Or manually edit package.json version
```

### 4. Publish to npm
```bash
# Publish with public access
npm publish --access public

# Or use the script
npm run publish:npm
```

### 5. Verify Publication
```bash
# Check package exists
npm view trace-pretty

# Test global installation
npm install -g trace-pretty
trace-pretty --version

# Test npx usage
npx trace-pretty --help
```

## Usage After Publication

Once published, users can:

```bash
# Global install
npm install -g trace-pretty

# Use anywhere
npm test | trace-pretty
node app.js 2>&1 | trace-pretty --project-root $(pwd)

# Or use with npx (no install needed)
npm test | npx trace-pretty
```

## Package Details

- **Package Name**: `trace-pretty`
- **Binary Command**: `trace-pretty`
- **Main Entry**: `dist/index.js`
- **CLI Entry**: `dist/cli/index.js`
- **Files Included**: `dist/**/*`, `CLI_USAGE.md`, `README.md`

## Registry Information

After publication, the package will be available at:
- npm: https://npmjs.com/package/trace-pretty
- CLI usage: `npx trace-pretty`
- Installation: `npm i -g trace-pretty`

## Troubleshooting

### Package Name Conflict
If `trace-pretty` is taken, update package.json:
```json
{
  "name": "@yourusername/trace-pretty"
}
```

Then publish scoped:
```bash
npm publish --access public
```

### CLI Not Working
Make sure `dist/cli/index.js` has execute permissions:
```bash
chmod +x dist/cli/index.js
```

### Version Issues
Use semantic versioning:
- **Patch** (1.0.1): Bug fixes
- **Minor** (1.1.0): New features, backward compatible
- **Major** (2.0.0): Breaking changes
#!/usr/bin/env bash
#
# Installs git hooks for the VDP monorepo.
# Run automatically via `pnpm install` (prepare script).

HOOKS_DIR="$(git rev-parse --show-toplevel)/.git/hooks"
SCRIPTS_DIR="$(cd "$(dirname "$0")" && pwd)"

# commit-msg hook
cat > "$HOOKS_DIR/commit-msg" << 'EOF'
#!/usr/bin/env bash
"$(git rev-parse --show-toplevel)/scripts/validate-commit-msg.sh" "$1"
EOF

chmod +x "$HOOKS_DIR/commit-msg"

echo "Git hooks installed."

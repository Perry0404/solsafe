@echo off
cd /d "c:\Users\HP SPECTRE X360 13\Downloads\solsafe-main (1)\solsafe-main"

echo Resolving merge conflict - keeping YOUR version of README...
git checkout --ours README.md

echo Staging all changes...
git add -A

echo Committing changes...
git commit -m "chore: Resolve merge conflict (keep local README), cleanup repo structure, add overflow-checks to Cargo.toml"

echo Pushing to GitHub...
git push origin main --force-with-lease

echo.
echo Done! Repository updated successfully.
pause

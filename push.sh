@echo off
echo 🔄 Auto pushing...

git add .
git commit -m "auto update"
git push

echo ✅ Done!
pause
# Development Workflow
To prevent merge conflicts:
1. Always pull latest main before starting work
   git checkout main && git pull origin main
2. Create a fresh branch for each step
   git checkout -b step-N-description
3. Make changes and commit
4. Merge to main immediately when done
   git checkout main && git merge step-N-description
5. Never leave branches open while Base44
   also pushes to the repo

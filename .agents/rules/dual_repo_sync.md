---
description: Always commit and push changes to both repositories (Hitarth-Saparia and Siddhi11-star)
globs: *
---

# Dual Repository Commit and Push Rule

Whenever the user asks to commit and push code:
1. Verify commits are created with descriptive messages.
2. Push to both remotes:
   - Primary: `https://github.com/Hitarth-Saparia/llm-judge-eval-system.git`
   - Secondary: `https://github.com/Siddhi11-star/llm-evaluation-platform.git`
3. Git remotes are already configured such that `git push origin <branch>` pushes to both URLs.
   Always verify pushing to both:
   `git push origin main`
   and if needed:
   `git push siddhi main`

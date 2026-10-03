# Skill Builder – GitHub Skill Gap Analyzer

A full-stack React + Express application that analyzes public GitHub profiles/repositories and produces evidence-based skill insights, potential gaps, project recommendations, and a learning roadmap.

## Stack
- React + Vite
- Tailwind CSS
- Express + Node.js
- GitHub REST API
- MongoDB-ready data layer
- Optional OpenAI-compatible AI endpoint

## Run
1. Copy `server/.env.example` to `server/.env`.
2. Add `GITHUB_TOKEN` (optional but recommended for API limits).
3. Add `AI_API_KEY` only if you want AI-generated narrative recommendations.
4. Run `npm run install-all`.
5. Run `npm run dev`.
6. Open the Vite URL shown in the terminal.

The app works without an AI key: deterministic recommendations are generated from GitHub evidence.

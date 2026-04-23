# Real Estate CRM Project Guide

This document provides context and commands for development in this repository.

## Commands

### Backend
- Run backend dev server: `npm run dev` (in `backend/`)
- Run backend tests: `npm test` (in `backend/`)
- Build backend: `npm run build` (in `backend/`)

### Frontend
- Run frontend dev server: `npm run dev` (in `frontend/`)
- Build frontend: `npm run build` (in `frontend/`)
- Run frontend tests: `npm test` (in `frontend/`)

### General
- Full project dev: `npm run dev` (from root if configured, otherwise run separately)

## Project Structure
- `backend/`: Node.js/Express server with PostgreSQL/Sequelize.
- `frontend/`: React application with Vite, Tailwind CSS, and Chart.js.
- `render.yaml`: Deployment configuration for Render.

## Coding Style
- **Backend**: Use ES Modules. Follow RESTful API conventions. Use JSend-style for JSON responses.
- **Frontend**: Use functional components with hooks. Use Tailwind CSS for styling. Use standard React coding patterns.
- **General**: Preference for clear, descriptive variable names and concise functions.

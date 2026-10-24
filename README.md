# Wind Forecast Accuracy Dashboard — Frontend

A React and TypeScript dashboard for analyzing UK wind generation forecast accuracy against actual generation data for January 2026.

The application connects to a FastAPI backend that retrieves historical data from the Elexon BMRS API, evaluates day-ahead forecasts, and provides accuracy metrics for analysis.

## Live Demo

- **Live Dashboard:** https://wind-forecast-dashboard-frontend.vercel.app
- **Backend API:** https://wind-forecast-dashboard-backend.onrender.com
- **API Documentation:** https://wind-forecast-dashboard-backend.onrender.com/docs
- **Backend Health Check:** https://wind-forecast-dashboard-backend.onrender.com/api/health

## Overview

Energy companies rely on wind generation forecasts to support electricity purchasing and operational planning. Understanding forecast errors helps identify how closely predicted generation matches actual generation.

This dashboard presents forecast accuracy results through a web interface, making it easier to inspect performance, compare forecasts with actual generation, and understand the impact of forecast errors.

## Features

- **Forecast Accuracy Analysis:** Retrieve forecast evaluation results from the backend.
- **Accuracy Metrics:** Display Mean Absolute Error (MAE), Root Mean Squared Error (RMSE), and forecast bias when returned by the API.
- **Actual Wind Generation:** Access historical wind generation data for January 2026.
- **Day-Ahead Forecast Evaluation:** Analyze forecasts selected using a configurable decision cutoff.
- **Matched and Missing Periods:** Present coverage information returned by the backend.
- **API Integration:** Communicate with the FastAPI service through Axios.
- **Loading and Error Handling:** Handle API requests and communicate request failures to the user.
- **Production Deployment:** Host the frontend on Vercel and connect it to the deployed backend.

## Tech Stack

- **React** — user interface
- **TypeScript** — static typing
- **Vite** — development server and production build
- **Axios** — HTTP client for API requests
- **SCSS/CSS** — styling, as used in the application
- **Vercel** — frontend hosting
- **Docker and Nginx** — optional containerized deployment

## Architecture

```text
User
  |
  v
React + TypeScript Dashboard
  |
  | Axios HTTP requests
  v
FastAPI Backend (Render)
  |
  | Elexon BMRS API
  v
Historical Wind Actuals and Forecasts
  |
  v
Forecast Selection and Accuracy Analysis
  |
  v
JSON Response to Dashboard
```

The frontend focuses on displaying analysis results and handling user interactions. Data retrieval, forecast selection, and metric calculations are handled by the backend.

## Getting Started

### Prerequisites

- Node.js 22 or another version compatible with the project dependencies
- npm
- Git

### 1. Clone the repository

```bash
git https://github.com/Madesh-cse/wind-forecast-dashboard-frontend
cd wind-forecast-dashboard-frontend
```

Replace the placeholder with your actual frontend GitHub repository URL.

### 2. Install dependencies

```bash
npm install
```

If the repository includes a committed `package-lock.json`, you can use `npm ci` for a clean, reproducible installation.

### 3. Configure the API URL

Create a `.env.local` file in the frontend root directory:

```dotenv
VITE_API_URL=http://127.0.0.1:8000
```

This points the frontend to a locally running backend.

For production, configure the following environment variable in Vercel:

```dotenv
VITE_API_URL=https://wind-forecast-dashboard-backend.onrender.com
```

**Important:** Vite exposes variables prefixed with `VITE_` to browser-side code. Never put API secrets, passwords, or private credentials in these variables.

### 4. Start the development server

```bash
npm run dev
```

Vite will display the local development URL in the terminal. The default is usually:

http://localhost:5173

Ensure the backend is running and its CORS configuration allows the frontend's development origin.

### 5. Build for production

```bash
npm run build
```

Vite generates the production assets in the `dist/` directory.

To preview the production build locally:

```bash
npm run preview
```

## Environment Variables

| Variable | Purpose | Example |
|---|---|---|
| `VITE_API_URL` | Base URL for the FastAPI backend | `https://wind-forecast-dashboard-backend.onrender.com` |

Vite reads environment variables during the build. After changing `VITE_API_URL` in Vercel, redeploy the frontend to apply the new value.

## Backend Integration

The frontend uses Axios to communicate with the backend.

Example API client:

```typescript
import axios from "axios";

const api = axios.create({
  baseURL:
    import.meta.env.VITE_API_URL ||
    "http://127.0.0.1:8000",
  timeout: 60000,
});

export default api;
```

### Available backend endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/health` | Check backend health |
| GET | `/api/wind/actuals` | Retrieve actual wind generation |
| GET | `/api/wind/analysis?cutoff=12:00` | Retrieve forecast accuracy analysis |

The backend defaults to a day-ahead decision cutoff of 12:00 Europe/London time. Refer to the backend README for details of forecast selection, metric calculations, and data validation.

## Deployment

### Vercel

1. Import the frontend repository into Vercel.
2. Configure the project with the Vite framework preset.
3. Set the root directory to `./` when the frontend files are at the repository root.
4. Add the environment variable `VITE_API_URL` with the deployed Render backend URL.
5. Deploy and verify the live dashboard.

### Docker

The repository includes a Dockerfile and Nginx configuration for containerized deployment, if these files are present in your checkout.

Build the image:

```bash
docker build \
  --build-arg VITE_API_URL=https://wind-forecast-dashboard-backend.onrender.com \
  -t wind-forecast-dashboard-frontend .
```

Run the container:

```bash
docker run --rm -p 8080:80 wind-forecast-dashboard-frontend
```

Open http://localhost:8080.

The API URL is embedded during the Vite build, so provide the correct value when building the image.

## Troubleshooting

### CORS errors

If the browser reports a CORS error, verify that the deployed frontend origin is included in the backend's `CORS_ORIGINS` environment variable in Render.

### API request failures

- Check that the backend health endpoint responds successfully.
- Verify the `VITE_API_URL` value.
- Check the browser's developer console and network panel.
- Remember that a sleeping free backend instance may take longer to respond after inactivity.

### Environment variable changes are not reflected

Restart the local development server after changing local environment variables. For production, trigger a new Vercel deployment.

## Related Repository

**Backend repository:** <YOUR_BACKEND_GITHUB_REPOSITORY_URL>

The backend repository contains the FastAPI application, Elexon API integrations, forecast evaluation logic, automated tests, and backend deployment configuration.

## AI Assistance Disclosure

AI tools were used to assist with development, debugging, and documentation. The implementation and application behavior should be reviewed and validated by the project author.

## License

Add a license if you intend to distribute this project under specific reuse terms. No license is implied by this README alone.

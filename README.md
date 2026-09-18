# Darukaa.Earth 🌍

## Full-Stack Geospatial Data Analytics Platform

Darukaa.Earth is a full-stack geospatial data analytics platform designed for managing and visualizing geographical sites associated with carbon and biodiversity projects.

The platform provides project and site management, interactive map-based site creation, geospatial calculations, satellite imagery visualization, and dashboard-level statistics through a modern web interface.

---

## 🚀 Features

### 🔐 User Authentication

* User registration
* User login
* JWT-based authentication
* Protected project and site APIs

### 📁 Project Management

* Create projects
* View projects
* Edit projects
* Delete projects
* Project status management
* Project type and description

### 📍 Site Management

* Create geographical sites
* Draw site boundaries interactively on a map
* Automatic polygon area calculation
* View saved sites
* Edit sites
* Delete sites
* Associate multiple sites with projects

### 🗺️ Geospatial Visualization

* Interactive map interface
* Polygon-based site boundaries
* Automatically zoom to selected site
* Street map visualization
* Satellite imagery visualization
* Site boundary visualization

### 📊 Geospatial Analytics

For each selected site, the application displays:

* Area in square meters
* Perimeter
* Number of boundary points
* Centroid latitude and longitude
* Interactive site boundary map

### 📈 Dashboard

The dashboard provides quick statistics including:

* Total Projects
* Total Sites
* Active Projects
* Active Sites
* Total Area
* Project/site statistics

---

# 🏗️ System Architecture

The application follows a client-server architecture.

```text
                    ┌──────────────────────┐
                    │      User / Admin    │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │   React Frontend     │
                    │                      │
                    │ • Dashboard          │
                    │ • Project Management │
                    │ • Site Management     │
                    │ • Interactive Maps    │
                    └──────────┬───────────┘
                               │
                         REST API / JWT
                               │
                               ▼
                    ┌──────────────────────┐
                    │   FastAPI Backend    │
                    │                      │
                    │ • Authentication     │
                    │ • Projects API       │
                    │ • Sites API          │
                    │ • Geospatial Logic   │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │   PostgreSQL / DB    │
                    │                      │
                    │ • Users              │
                    │ • Projects           │
                    │ • Sites              │
                    │ • Geometry           │
                    └──────────────────────┘
```

---

# 🛠️ Technology Stack

## Frontend

* React
* Vite
* JavaScript
* CSS
* React Leaflet
* Leaflet
* OpenStreetMap
* Satellite map tiles

## Backend

* Python
* FastAPI
* REST APIs
* JWT Authentication

## Database

* PostgreSQL
* Geospatial data support

## Development Tools

* Git
* GitHub
* GitHub Actions
* npm
* Python virtual environment

---

# 📂 Project Structure

```text
darukaa-earth/
│
├── backend/
│   ├── main.py
│   ├── database.py
│   ├── requirements.txt
│   └── ...
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── App.css
│   │   └── index.css
│   │
│   ├── package.json
│   ├── package-lock.json
│   └── ...
│
├── .gitignore
├── README.md
└── ...
```

---

# 🗄️ Database Schema

The application uses a relational database to manage users, projects, and geographical sites.

## Users

Stores authentication and user information.

| Field    | Description                           |
| -------- | ------------------------------------- |
| id       | Unique user identifier                |
| name     | User name                             |
| email    | User email                            |
| password | Password/hash used for authentication |

## Projects

Stores project information.

| Field        | Description               |
| ------------ | ------------------------- |
| id           | Unique project identifier |
| name         | Project name              |
| description  | Project description       |
| project_type | Type of project           |
| status       | Project status            |
| user_id      | Project owner             |

## Sites

Stores geographical site information.

| Field       | Description            |
| ----------- | ---------------------- |
| id          | Unique site identifier |
| project_id  | Associated project     |
| name        | Site name              |
| description | Site description       |
| area        | Calculated area        |
| geometry    | Polygon geometry       |
| status      | Site status            |

### Relationship

```text
User
 │
 └───< Projects
          │
          └───< Sites
```

One user can manage multiple projects, and each project can contain multiple geographical sites.

---

# 🗺️ Geospatial Data Flow

When creating a site:

```text
User clicks on map
        ↓
Latitude / Longitude points collected
        ↓
Polygon created
        ↓
Area calculated
        ↓
Coordinates converted to GeoJSON
        ↓
Site sent to backend
        ↓
Site stored in database
        ↓
Saved geometry displayed on map
```

Leaflet represents coordinates as:

```text
[latitude, longitude]
```

GeoJSON represents coordinates as:

```text
[longitude, latitude]
```

The frontend converts the coordinates before sending the polygon to the backend.

---

# 📊 Site Analytics

When a user selects a site, the application calculates/displays geospatial information such as:

### Area

The polygon area is displayed in square meters.

### Perimeter

The boundary length is displayed in meters.

### Boundary Points

The number of polygon vertices is displayed.

### Centroid

The geographical center of the selected site is displayed as:

```text
Latitude, Longitude
```

The selected site's polygon is automatically fitted to the map viewport.

---

# 💻 Local Setup

## 1. Clone the Repository

```bash
git clone https://github.com/surya57k/darukaa-earth.git
cd darukaa-earth
```

---

# Backend Setup

## 2. Create a Python Virtual Environment

Windows:

```bash
python -m venv venv
```

Activate it:

```bash
venv\Scripts\activate
```

Linux/macOS:

```bash
python3 -m venv venv
source venv/bin/activate
```

---

## 3. Install Backend Dependencies

```bash
cd backend
pip install -r requirements.txt
```

---

## 4. Configure Environment Variables

Create a `.env` file in the backend directory.

Example:

```env
DATABASE_URL=your_database_connection_string
SECRET_KEY=your_secret_key
```

Do not commit real secrets or passwords to GitHub.

---

## 5. Start the Backend

From the backend directory:

```bash
uvicorn main:app --reload
```

The API will normally be available at:

```text
http://127.0.0.1:8000
```

FastAPI documentation:

```text
http://127.0.0.1:8000/docs
```

---

# Frontend Setup

## 6. Install Frontend Dependencies

Open another terminal:

```bash
cd frontend
npm install
```

---

## 7. Start the Frontend

```bash
npm run dev
```

The Vite development server will normally run at:

```text
http://localhost:5173
```

---

# 🔑 Authentication

The application uses JWT-based authentication.

After successful login:

```text
User Login
    ↓
Backend validates credentials
    ↓
JWT access token returned
    ↓
Token stored by frontend
    ↓
Token sent with protected API requests
```

Protected requests use:

```text
Authorization: Bearer <access_token>
```

---

# 🔌 API Overview

The backend exposes REST endpoints for the main application operations.

### Authentication

```text
POST /auth/register
POST /auth/login
```

### Projects

```text
GET    /projects
POST   /projects
PUT    /projects/{id}
DELETE /projects/{id}
```

### Sites

```text
GET    /sites
POST   /sites
PUT    /sites/{id}
DELETE /sites/{id}
```

The exact API schema can also be inspected through the FastAPI Swagger documentation.

---

# 🧪 Testing the Application

The following workflow should be tested before submission:

```text
Register
   ↓
Login
   ↓
Create Project
   ↓
Select Project
   ↓
Draw Site Boundary
   ↓
Calculate Area
   ↓
Create Site
   ↓
View Site
   ↓
View Geospatial Analytics
   ↓
Switch Street / Satellite View
   ↓
Edit Site
   ↓
Delete Site
   ↓
Edit Project
   ↓
Delete Project
   ↓
Verify Dashboard Statistics
```

---

# 🔄 CI/CD

GitHub Actions can be used to automate project validation and deployment.

The intended pipeline is:

```text
Developer
    ↓
Git Commit
    ↓
GitHub Repository
    ↓
GitHub Actions
    ↓
Install Dependencies
    ↓
Lint / Quality Checks
    ↓
Build / Test
    ↓
Deploy
    ↓
Public Application URL
```

The CI/CD workflow should automatically validate the application whenever changes are pushed to the repository.

---

# 🚀 Deployment

The application is intended to be deployed as a publicly accessible web application.

Recommended deployment structure:

```text
                    Public User
                         │
                         ▼
                ┌─────────────────┐
                │ React Frontend  │
                │   Deployment    │
                └────────┬────────┘
                         │
                         ▼
                ┌─────────────────┐
                │ FastAPI Backend │
                │   Deployment    │
                └────────┬────────┘
                         │
                         ▼
                ┌─────────────────┐
                │   PostgreSQL    │
                │    Database     │
                └─────────────────┘
```

### Live Demo

```text
Live Demo: [ADD DEPLOYED FRONTEND URL]
```

### Backend API

```text
Backend API: [ADD DEPLOYED BACKEND URL]
```

---

# 🔐 Security Notes

* Never commit `.env` files.
* Never commit database passwords.
* Never commit JWT secret keys.
* Use environment variables for deployment credentials.
* Use HTTPS for the deployed application.
* Keep private repository access restricted to authorized reviewers.

---

# 🎥 Prototype Demonstration

A video demonstration of the working prototype is included with the hackathon submission.

The demonstration covers:

* Authentication
* Project creation
* Site creation
* Interactive polygon drawing
* Area calculation
* Project/site editing
* Project/site deletion
* Dashboard statistics
* Geospatial analytics
* Site visualization
* Satellite imagery

---

# 📌 Current Project Status

The prototype currently provides:

* ✅ User authentication
* ✅ Project management
* ✅ Site management
* ✅ Interactive geographical site creation
* ✅ Polygon area calculation
* ✅ Project editing/deletion
* ✅ Site editing/deletion
* ✅ Dashboard statistics
* ✅ Site analytics
* ✅ Street map visualization
* ✅ Satellite imagery visualization
* ✅ Selected-site automatic map zoom
* ✅ REST API integration

---

# 👨‍💻 Author

**Surya Vardhan Chintala**

B.Tech – Computer Science & Engineering

GitHub:

https://github.com/surya57k

---

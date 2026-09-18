
import { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Polygon,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "./App.css";

const API_URL = "http://127.0.0.1:8000";

const DEFAULT_CENTER = [16.5062, 80.6480];

/* =========================================================
   MAP FITTER
========================================================= */

function FitSiteBounds({ geometry }) {
  const map = useMap();

  useEffect(() => {
    if (geometry && geometry.length >= 3) {
      map.fitBounds(geometry, {
        padding: [30, 30],
      });
    }
  }, [geometry, map]);

  return null;
}

/* =========================================================
   MAP CLICK HANDLER
========================================================= */

function MapClickHandler({ setPoints }) {
  const map = useMap();

  useEffect(() => {
    const handleClick = (e) => {
      const newPoint = [
        e.latlng.lat,
        e.latlng.lng,
      ];

      setPoints((current) => [
        ...current,
        newPoint,
      ]);
    };

    map.on("click", handleClick);

    return () => {
      map.off("click", handleClick);
    };
  }, [map, setPoints]);

  return null;
}

/* =========================================================
   MAP LAYER SWITCHER
========================================================= */

function MapLayers({ satellite }) {
  if (satellite) {
    return (
      <>
        <TileLayer
          attribution="Tiles &copy; Esri"
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
        />

        <TileLayer
          attribution="Labels &copy; Esri"
          url="https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"
          opacity={0.9}
        />
      </>
    );
  }

  return (
    <TileLayer
      attribution="&copy; OpenStreetMap contributors"
      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
    />
  );
}

/* =========================================================
   APP
========================================================= */

function App() {
  const [mode, setMode] = useState("login");

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  const [projects, setProjects] = useState([]);
  const [sites, setSites] = useState([]);

  const [selectedProject, setSelectedProject] =
    useState(null);

  const [selectedSite, setSelectedSite] =
    useState(null);

  const [projectForm, setProjectForm] = useState({
    name: "",
    description: "",
    project_type: "",
    status: "active",
  });

  const [siteForm, setSiteForm] = useState({
    name: "",
    description: "",
    status: "active",
  });

  const [geometry, setGeometry] = useState([]);
  const [area, setArea] = useState(0);

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] =
    useState("success");

  const [loading, setLoading] = useState(false);

  const [satelliteMode, setSatelliteMode] =
    useState(false);

  const token =
    localStorage.getItem("access_token");

  /* =========================================================
     MESSAGE HELPER
  ========================================================= */

  const showMessage = (
    text,
    type = "success"
  ) => {
    setMessage(text);
    setMessageType(type);
  };

  /* =========================================================
     FORM HANDLERS
  ========================================================= */

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleProjectChange = (e) => {
    setProjectForm({
      ...projectForm,
      [e.target.name]: e.target.value,
    });
  };

  const handleSiteChange = (e) => {
    setSiteForm({
      ...siteForm,
      [e.target.name]: e.target.value,
    });
  };

  /* =========================================================
     GET PROJECTS
  ========================================================= */

  const getProjects = async (accessToken) => {
    const response = await fetch(
      `${API_URL}/projects`,
      {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.detail ||
          "Failed to fetch projects"
      );
    }

    setProjects(
      Array.isArray(data) ? data : []
    );
  };

  /* =========================================================
     GET SITES
  ========================================================= */

  const getSites = async (accessToken) => {
    const response = await fetch(
      `${API_URL}/sites`,
      {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.detail ||
          "Failed to fetch sites"
      );
    }

    setSites(
      Array.isArray(data) ? data : []
    );
  };

  /* =========================================================
     LOAD DATA
  ========================================================= */

  useEffect(() => {
    const savedToken =
      localStorage.getItem("access_token");

    if (!savedToken) return;

    Promise.all([
      getProjects(savedToken),
      getSites(savedToken),
    ]).catch((error) => {
      console.error(error);

      localStorage.removeItem(
        "access_token"
      );

      showMessage(
        "Session expired. Please login again.",
        "error"
      );
    });
  }, []);

  /* =========================================================
     DASHBOARD SUMMARY
  ========================================================= */

  const totalProjects = projects.length;

  const activeProjects = projects.filter(
    (project) =>
      String(project.status).toLowerCase() ===
      "active"
  ).length;

  const totalSites = sites.length;

  const activeSites = sites.filter(
    (site) =>
      String(site.status).toLowerCase() ===
      "active"
  ).length;

  const totalArea = sites.reduce(
    (total, site) =>
      total + Number(site.area || 0),
    0
  );

  /* =========================================================
     AREA CALCULATION
  ========================================================= */

  const calculateArea = (points) => {
    if (points.length < 3) {
      return 0;
    }

    const earthRadius = 6371000;

    let calculatedArea = 0;

    for (
      let i = 0;
      i < points.length;
      i++
    ) {
      const current = points[i];

      const next =
        points[
          (i + 1) % points.length
        ];

      const lat1 =
        (current[0] * Math.PI) / 180;

      const lat2 =
        (next[0] * Math.PI) / 180;

      const lon1 =
        (current[1] * Math.PI) / 180;

      const lon2 =
        (next[1] * Math.PI) / 180;

      calculatedArea +=
        (lon2 - lon1) *
        (2 +
          Math.sin(lat1) +
          Math.sin(lat2));
    }

    calculatedArea = Math.abs(
      (calculatedArea *
        earthRadius *
        earthRadius) /
        2
    );

    return Math.round(
      calculatedArea
    );
  };

  /* =========================================================
     POLYGON CHANGE
  ========================================================= */

  const handlePolygonChange = (
    points
  ) => {
    setGeometry(points);

    setArea(
      calculateArea(points)
    );
  };

  /* =========================================================
     LOGIN / REGISTER
  ========================================================= */

  const handleSubmit = async (e) => {
    e.preventDefault();

    setMessage("");
    setLoading(true);

    try {
      const endpoint =
        mode === "login"
          ? `${API_URL}/auth/login`
          : `${API_URL}/auth/register`;

      const body =
        mode === "login"
          ? {
              email: form.email,
              password: form.password,
            }
          : {
              name: form.name,
              email: form.email,
              password: form.password,
            };

      const response =
        await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
            Accept:
              "application/json",
          },
          body: JSON.stringify(body),
        });

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail ||
            "Something went wrong"
        );
      }

      if (mode === "login") {
        localStorage.setItem(
          "access_token",
          data.access_token
        );

        await getProjects(
          data.access_token
        );

        await getSites(
          data.access_token
        );

        showMessage(
          "Login successful!"
        );

        setForm({
          name: "",
          email: "",
          password: "",
        });
      } else {
        showMessage(
          "Registration successful! Please login."
        );

        setMode("login");

        setForm({
          name: "",
          email: form.email,
          password: "",
        });
      }
    } catch (error) {
      console.error(error);

      showMessage(
        error.message,
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  /* =========================================================
     CREATE PROJECT
  ========================================================= */

  const createProject = async (e) => {
    e.preventDefault();

    const accessToken =
      localStorage.getItem(
        "access_token"
      );

    if (!accessToken) {
      showMessage(
        "Please login first.",
        "error"
      );
      return;
    }

    try {
      setLoading(true);

      const response =
        await fetch(
          `${API_URL}/projects`,
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
              Accept:
                "application/json",
              Authorization:
                `Bearer ${accessToken}`,
            },
            body: JSON.stringify(
              projectForm
            ),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail ||
            "Failed to create project"
        );
      }

      showMessage(
        "Project created successfully!"
      );

      setProjectForm({
        name: "",
        description: "",
        project_type: "",
        status: "active",
      });

      await getProjects(
        accessToken
      );
    } catch (error) {
      console.error(error);

      showMessage(
        error.message,
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  /* =========================================================
     CREATE SITE
  ========================================================= */

  const createSite = async (e) => {
    e.preventDefault();

    const accessToken =
      localStorage.getItem(
        "access_token"
      );

    if (!accessToken) {
      showMessage(
        "Please login first.",
        "error"
      );
      return;
    }

    if (!selectedProject) {
      showMessage(
        "Please select a project.",
        "error"
      );
      return;
    }

    if (geometry.length < 3) {
      showMessage(
        "Please draw at least 3 points on the map.",
        "error"
      );
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      /*
       * Leaflet:
       * [latitude, longitude]
       *
       * GeoJSON:
       * [longitude, latitude]
       */

      const coordinates =
        geometry.map(
          ([lat, lng]) => [
            lng,
            lat,
          ]
        );

      /*
       * Close polygon
       */

      const first =
        coordinates[0];

      const last =
        coordinates[
          coordinates.length - 1
        ];

      if (
        first[0] !== last[0] ||
        first[1] !== last[1]
      ) {
        coordinates.push(first);
      }

      const siteData = {
        project_id:
          Number(
            selectedProject.id
          ),

        name:
          siteForm.name,

        description:
          siteForm.description,

        area:
          Number(area),

        geometry: {
          type: "Polygon",
          coordinates: [
            coordinates,
          ],
        },

        status:
          siteForm.status,
      };

      console.log(
        "Creating site:",
        siteData
      );

      const response =
        await fetch(
          `${API_URL}/sites`,
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
              Accept:
                "application/json",
              Authorization:
                `Bearer ${accessToken}`,
            },
            body: JSON.stringify(
              siteData
            ),
          }
        );

      const data =
        await response.json();

      console.log(
        "Create site response:",
        data
      );

      if (!response.ok) {
        throw new Error(
          data.detail ||
            "Failed to create site"
        );
      }

      showMessage(
        "Site created successfully!"
      );

      setSiteForm({
        name: "",
        description: "",
        status: "active",
      });

      setGeometry([]);
      setArea(0);

      await getSites(
        accessToken
      );
    } catch (error) {
      console.error(
        "Create site error:",
        error
      );

      showMessage(
        error.message,
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  /* =========================================================
     VIEW SITE
  ========================================================= */

  const viewSite = (site) => {
    let savedPoints = [];

    if (
      site.geometry &&
      site.geometry.coordinates &&
      site.geometry.coordinates[0]
    ) {
      savedPoints =
        site.geometry.coordinates[0]
          .map(([lng, lat]) => [
            lat,
            lng,
          ]);
    }

    setSelectedSite({
      ...site,
      mapGeometry: savedPoints,
    });

    /*
     * Scroll automatically to selected
     * site analytics section.
     */

    setTimeout(() => {
      const element =
        document.getElementById(
          "selected-site"
        );

      if (element) {
        element.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    }, 100);
  };

  /* =========================================================
     LOGOUT
  ========================================================= */

  const logout = () => {
    localStorage.removeItem(
      "access_token"
    );

    setProjects([]);
    setSites([]);
    setSelectedProject(null);
    setSelectedSite(null);
    setGeometry([]);
    setArea(0);

    showMessage(
      "Logged out successfully."
    );
  };

  /* =========================================================
     LOGIN PAGE
  ========================================================= */

  if (!token) {
    return (
      <div className="app">
        <div className="auth-container">

          <div className="brand">

            <div className="brand-icon">
              🌍
            </div>

            <h1>
              Darukaa.Earth
            </h1>

            <p>
              Geospatial Data Analytics Platform
            </p>

          </div>

          <div className="auth-card">

            <div className="tabs">

              <button
                className={
                  mode === "login"
                    ? "active"
                    : ""
                }
                onClick={() => {
                  setMode("login");
                  setMessage("");
                }}
              >
                Login
              </button>

              <button
                className={
                  mode === "register"
                    ? "active"
                    : ""
                }
                onClick={() => {
                  setMode(
                    "register"
                  );
                  setMessage("");
                }}
              >
                Register
              </button>

            </div>

            <form
              onSubmit={
                handleSubmit
              }
            >

              {mode ===
                "register" && (
                <div className="form-group">

                  <label>
                    Name
                  </label>

                  <input
                    type="text"
                    name="name"
                    value={
                      form.name
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="Enter your name"
                    required
                  />

                </div>
              )}

              <div className="form-group">

                <label>
                  Email
                </label>

                <input
                  type="email"
                  name="email"
                  value={
                    form.email
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="Enter your email"
                  required
                />

              </div>

              <div className="form-group">

                <label>
                  Password
                </label>

                <input
                  type="password"
                  name="password"
                  value={
                    form.password
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="Enter your password"
                  required
                />

              </div>

              <button
                type="submit"
                className="submit-btn"
                disabled={loading}
              >
                {loading
                  ? "Please wait..."
                  : mode === "login"
                  ? "Login"
                  : "Create Account"}
              </button>

            </form>

            {message && (
              <div
                className={`message ${messageType}`}
              >
                {message}
              </div>
            )}

          </div>

        </div>
      </div>
    );
  }

  /* =========================================================
     DASHBOARD
  ========================================================= */

  return (
    <div className="app dashboard">

      {/* =====================================================
          TOP BAR
      ===================================================== */}

      <header className="topbar">

        <div className="topbar-brand">

          <div className="brand-icon">
            🌍
          </div>

          <div>
            <h1>
              Darukaa.Earth
            </h1>

            <p>
              Geospatial Data Analytics Platform
            </p>
          </div>

        </div>

        <button
          className="logout-btn"
          onClick={logout}
        >
          Logout
        </button>

      </header>

      <main className="dashboard-content">

        {/* ===================================================
            WELCOME
        =================================================== */}

        <section className="welcome-section">

          <h2>
            Dashboard
          </h2>

          <p>
            Monitor projects, sites and
            geospatial information from
            one place.
          </p>

        </section>

        {/* ===================================================
            MESSAGE
        =================================================== */}

        {message && (
          <div
            className={`message ${messageType}`}
          >
            {message}
          </div>
        )}

        {/* ===================================================
            DASHBOARD SUMMARY
        =================================================== */}

        <section className="stats-grid">

          <div className="stat-card">

            <div className="stat-icon">
              📁
            </div>

            <div>
              <span>
                Total Projects
              </span>

              <strong>
                {totalProjects}
              </strong>
            </div>

          </div>

          <div className="stat-card">

            <div className="stat-icon">
              ✅
            </div>

            <div>
              <span>
                Active Projects
              </span>

              <strong>
                {activeProjects}
              </strong>
            </div>

          </div>

          <div className="stat-card">

            <div className="stat-icon">
              📍
            </div>

            <div>
              <span>
                Total Sites
              </span>

              <strong>
                {totalSites}
              </strong>
            </div>

          </div>

          <div className="stat-card">

            <div className="stat-icon">
              🟢
            </div>

            <div>
              <span>
                Active Sites
              </span>

              <strong>
                {activeSites}
              </strong>
            </div>

          </div>

          <div className="stat-card">

            <div className="stat-icon">
              📐
            </div>

            <div>
              <span>
                Total Area
              </span>

              <strong>
                {totalArea.toLocaleString()}
                <small
                  style={{
                    fontSize: "11px",
                    marginLeft: "4px",
                  }}
                >
                  m²
                </small>
              </strong>
            </div>

          </div>

        </section>

        {/* ===================================================
            CREATE PROJECT
        =================================================== */}

        <section className="panel">

          <div className="panel-header">

            <div>
              <h2>
                Create Project
              </h2>

              <p>
                Add a new geospatial project.
              </p>
            </div>

          </div>

          <form
            onSubmit={
              createProject
            }
          >

            <div className="form-grid">

              <div className="form-group">

                <label>
                  Project Name
                </label>

                <input
                  type="text"
                  name="name"
                  value={
                    projectForm.name
                  }
                  onChange={
                    handleProjectChange
                  }
                  placeholder="Enter project name"
                  required
                />

              </div>

              <div className="form-group">

                <label>
                  Project Type
                </label>

                <input
                  type="text"
                  name="project_type"
                  value={
                    projectForm.project_type
                  }
                  onChange={
                    handleProjectChange
                  }
                  placeholder="e.g. Agriculture"
                  required
                />

              </div>

              <div className="form-group full-width">

                <label>
                  Description
                </label>

                <textarea
                  name="description"
                  value={
                    projectForm.description
                  }
                  onChange={
                    handleProjectChange
                  }
                  placeholder="Enter project description"
                />

              </div>

              <div className="form-group">

                <label>
                  Status
                </label>

                <select
                  name="status"
                  value={
                    projectForm.status
                  }
                  onChange={
                    handleProjectChange
                  }
                >

                  <option value="active">
                    Active
                  </option>

                  <option value="inactive">
                    Inactive
                  </option>

                </select>

              </div>

              <div className="form-actions">

                <button
                  type="submit"
                  className="submit-btn"
                  disabled={loading}
                >
                  {loading
                    ? "Creating..."
                    : "Create Project"}
                </button>

              </div>

            </div>

          </form>

        </section>

        {/* ===================================================
            PROJECTS
        =================================================== */}

        <section className="panel">

          <div className="panel-header">

            <div>
              <h2>
                Your Projects
              </h2>

              <p>
                Select a project to create
                sites inside it.
              </p>
            </div>

            <span className="count-badge">
              {projects.length} Projects
            </span>

          </div>

          {projects.length === 0 ? (

            <div className="empty-state">

              <div className="empty-icon">
                📁
              </div>

              <h3>
                No projects yet
              </h3>

              <p>
                Create your first project
                above.
              </p>

            </div>

          ) : (

            <div className="cards-grid">

              {projects.map(
                (project) => (

                  <div
                    className={
                      `project-card ${
                        selectedProject?.id ===
                        project.id
                          ? "selected"
                          : ""
                      }`
                    }
                    key={
                      project.id
                    }
                  >

                    <div className="card-top">

                      <div className="card-icon">
                        📁
                      </div>

                      <span
                        className={`status-badge ${
                          String(
                            project.status
                          ).toLowerCase() ===
                          "active"
                            ? "active"
                            : "inactive"
                        }`}
                      >
                        {
                          project.status
                        }
                      </span>

                    </div>

                    <h3>
                      {project.name}
                    </h3>

                    <p>
                      {
                        project.description ||
                        "No description"
                      }
                    </p>

                    <div className="meta-row">

                      <span>
                        Type
                      </span>

                      <strong>
                        {
                          project.project_type
                        }
                      </strong>

                    </div>

                    <div className="meta-row">

                      <span>
                        Project ID
                      </span>

                      <strong>
                        {
                          project.id
                        }
                      </strong>

                    </div>

                    <div className="card-actions">

                      <button
                        type="button"
                        className="primary-small"
                        onClick={() =>
                          setSelectedProject(
                            project
                          )
                        }
                      >
                        Select Project
                      </button>

                    </div>

                  </div>

                )
              )}

            </div>

          )}

        </section>

        {/* ===================================================
            CREATE SITE
        =================================================== */}

        <section className="panel">

          <div className="panel-header">

            <div>
              <h2>
                Create Site
              </h2>

              <p>
                Draw a boundary on the map
                to create a site.
              </p>
            </div>

          </div>

          {!selectedProject ? (

            <div className="empty-state">

              <div className="empty-icon">
                🗺️
              </div>

              <h3>
                Select a project first
              </h3>

              <p>
                Choose a project above
                before drawing a site.
              </p>

            </div>

          ) : (

            <>

              <div
                className="selected-site-info"
                style={{
                  marginBottom: "20px",
                }}
              >

                <div>

                  <span>
                    Selected Project
                  </span>

                  <strong>
                    {
                      selectedProject.name
                    }
                  </strong>

                </div>

                <div>

                  <span>
                    Project ID
                  </span>

                  <strong>
                    {
                      selectedProject.id
                    }
                  </strong>

                </div>

              </div>

              <p className="map-help">
                🖱️ Click on the map to
                add boundary points.
                Add at least 3 points to
                create a polygon.
              </p>

              {/* MAP */}

              <div className="map-container">

                <MapContainer
                  center={
                    DEFAULT_CENTER
                  }
                  zoom={13}
                  scrollWheelZoom={
                    true
                  }
                  style={{
                    height: "450px",
                    width: "100%",
                  }}
                >

                  <MapLayers
                    satellite={
                      satelliteMode
                    }
                  />

                  <MapClickHandler
                    setPoints={
                      setGeometry
                    }
                  />

                  {geometry.length >=
                    3 && (
                    <Polygon
                      positions={
                        geometry
                      }
                    />
                  )}

                </MapContainer>

              </div>

              {/* MAP CONTROLS */}

              <div
                style={{
                  display: "flex",
                  gap: "10px",
                  marginBottom: "18px",
                  flexWrap: "wrap",
                }}
              >

                <button
                  type="button"
                  className={
                    !satelliteMode
                      ? "primary-small"
                      : "secondary-small"
                  }
                  onClick={() =>
                    setSatelliteMode(
                      false
                    )
                  }
                >
                  🗺️ Street
                </button>

                <button
                  type="button"
                  className={
                    satelliteMode
                      ? "primary-small"
                      : "secondary-small"
                  }
                  onClick={() =>
                    setSatelliteMode(
                      true
                    )
                  }
                >
                  🛰️ Satellite
                </button>

                <button
                  type="button"
                  className="secondary-small"
                  onClick={() => {
                    setGeometry([]);
                    setArea(0);
                  }}
                >
                  ↩ Clear Boundary
                </button>

              </div>

              {/* MAP INFO */}

              <div className="map-info">

                <div>

                  <span>
                    Boundary Points
                  </span>

                  <strong>
                    {
                      geometry.length
                    }
                  </strong>

                </div>

                <div>

                  <span>
                    Calculated Area
                  </span>

                  <strong>
                    {
                      area.toLocaleString()
                    }{" "}
                    m²
                  </strong>

                </div>

                <div>

                  <span>
                    Map Mode
                  </span>

                  <strong>
                    {satelliteMode
                      ? "Satellite"
                      : "Street"}
                  </strong>

                </div>

              </div>

              {/* SITE FORM */}

              <form
                onSubmit={
                  createSite
                }
                style={{
                  marginTop: "22px",
                }}
              >

                <div className="form-grid">

                  <div className="form-group">

                    <label>
                      Site Name
                    </label>

                    <input
                      type="text"
                      name="name"
                      value={
                        siteForm.name
                      }
                      onChange={
                        handleSiteChange
                      }
                      placeholder="Enter site name"
                      required
                    />

                  </div>

                  <div className="form-group">

                    <label>
                      Status
                    </label>

                    <select
                      name="status"
                      value={
                        siteForm.status
                      }
                      onChange={
                        handleSiteChange
                      }
                    >

                      <option value="active">
                        Active
                      </option>

                      <option value="inactive">
                        Inactive
                      </option>

                    </select>

                  </div>

                  <div className="form-group full-width">

                    <label>
                      Description
                    </label>

                    <textarea
                      name="description"
                      value={
                        siteForm.description
                      }
                      onChange={
                        handleSiteChange
                      }
                      placeholder="Enter site description"
                    />

                  </div>

                  <div className="form-actions">

                    <button
                      type="submit"
                      className="submit-btn"
                      disabled={
                        loading
                      }
                    >
                      {loading
                        ? "Creating..."
                        : "Create Site"}
                    </button>

                  </div>

                </div>

              </form>

            </>

          )}

        </section>

        {/* ===================================================
            YOUR SITES
        =================================================== */}

        <section className="panel">

          <div className="panel-header">

            <div>
              <h2>
                Your Sites
              </h2>

              <p>
                View site boundaries and
                geospatial analytics.
              </p>
            </div>

            <span className="count-badge">
              {sites.length} Sites
            </span>

          </div>

          {sites.length === 0 ? (

            <div className="empty-state">

              <div className="empty-icon">
                📍
              </div>

              <h3>
                No sites yet
              </h3>

              <p>
                Create a site using the
                map above.
              </p>

            </div>

          ) : (

            <div className="cards-grid">

              {sites.map(
                (site) => (

                  <div
                    className={
                      `site-card ${
                        selectedSite?.id ===
                        site.id
                          ? "selected"
                          : ""
                      }`
                    }
                    key={
                      site.id
                    }
                  >

                    <div className="card-top">

                      <div className="card-icon">
                        📍
                      </div>

                      <span
                        className={`status-badge ${
                          String(
                            site.status
                          ).toLowerCase() ===
                          "active"
                            ? "active"
                            : "inactive"
                        }`}
                      >
                        {
                          site.status
                        }
                      </span>

                    </div>

                    <h3>
                      {site.name}
                    </h3>

                    <p>
                      {
                        site.description ||
                        "No description"
                      }
                    </p>

                    <div className="meta-row">

                      <span>
                        Site ID
                      </span>

                      <strong>
                        {
                          site.id
                        }
                      </strong>

                    </div>

                    <div className="meta-row">

                      <span>
                        Project ID
                      </span>

                      <strong>
                        {
                          site.project_id
                        }
                      </strong>

                    </div>

                    <div className="meta-row">

                      <span>
                        Area
                      </span>

                      <strong>
                        {Number(
                          site.area ||
                            0
                        ).toLocaleString()}{" "}
                        m²
                      </strong>

                    </div>

                    <div className="card-actions">

                      <button
                        type="button"
                        className="primary-small"
                        onClick={() =>
                          viewSite(
                            site
                          )
                        }
                      >
                        👁 View Site
                      </button>

                      {selectedSite?.id ===
                        site.id && (
                        <button
                          type="button"
                          className="secondary-small"
                          onClick={() =>
                            setSelectedSite(
                              null
                            )
                          }
                        >
                          Close
                        </button>
                      )}

                    </div>

                  </div>

                )
              )}

            </div>

          )}

        </section>

        {/* ===================================================
            SELECTED SITE ANALYTICS
        =================================================== */}

        {selectedSite && (
          <section
            id="selected-site"
            className="panel selected-site-panel"
          >

            <div className="panel-header">

              <div>

                <h2>
                  📍 Site Analytics
                </h2>

                <p>
                  Detailed geospatial
                  information for{" "}
                  <strong>
                    {
                      selectedSite.name
                    }
                  </strong>
                </p>

              </div>

              <button
                type="button"
                className="secondary-small"
                onClick={() =>
                  setSelectedSite(
                    null
                  )
                }
              >
                Close
              </button>

            </div>

            {/* SITE INFORMATION */}

            <div className="selected-site-info">

              <div>

                <span>
                  Site ID
                </span>

                <strong>
                  {
                    selectedSite.id
                  }
                </strong>

              </div>

              <div>

                <span>
                  Project ID
                </span>

                <strong>
                  {
                    selectedSite.project_id
                  }
                </strong>

              </div>

              <div>

                <span>
                  Area
                </span>

                <strong>
                  {Number(
                    selectedSite.area ||
                      0
                  ).toLocaleString()}{" "}
                  m²
                </strong>

              </div>

              <div>

                <span>
                  Status
                </span>

                <strong>
                  {
                    selectedSite.status
                  }
                </strong>

              </div>

            </div>

            {/* GEOSPATIAL ANALYTICS */}

            <div
              style={{
                marginBottom: "20px",
              }}
            >

              <h3
                style={{
                  marginBottom:
                    "15px",
                }}
              >
                Geospatial Analytics
              </h3>

              <div className="selected-site-info">

                <div>

                  <span>
                    📐 Area
                  </span>

                  <strong>
                    {Number(
                      selectedSite.area ||
                        0
                    ).toLocaleString()}{" "}
                    square meters
                  </strong>

                </div>

                <div>

                  <span>
                    🔹 Boundary Points
                  </span>

                  <strong>
                    {selectedSite.mapGeometry
                      ?.length || 0}{" "}
                    points
                  </strong>

                </div>

                <div>

                  <span>
                    📍 Centroid
                  </span>

                  <strong>
                    {selectedSite.mapGeometry &&
                    selectedSite
                      .mapGeometry
                      .length >= 3
                      ? (() => {
                          const points =
                            selectedSite.mapGeometry;

                          const lat =
                            points.reduce(
                              (
                                sum,
                                point
                              ) =>
                                sum +
                                point[0],
                              0
                            ) /
                            points.length;

                          const lng =
                            points.reduce(
                              (
                                sum,
                                point
                              ) =>
                                sum +
                                point[1],
                              0
                            ) /
                            points.length;

                          return `${lat.toFixed(
                            5
                          )}, ${lng.toFixed(
                            5
                          )}`;
                        })()
                      : "N/A"}
                  </strong>

                </div>

                <div>

                  <span>
                    🗺️ Map Type
                  </span>

                  <strong>
                    {satelliteMode
                      ? "Satellite"
                      : "Street"}
                  </strong>

                </div>

              </div>

            </div>

            {/* SITE BOUNDARY */}

            <h3
              style={{
                marginBottom:
                  "12px",
              }}
            >
              Site Boundary
            </h3>

            <p className="map-help">
              Automatically zoomed to the
              selected site.
            </p>

            {selectedSite.mapGeometry &&
            selectedSite.mapGeometry.length >=
              3 ? (

              <>

                <div className="map-container">

                  <MapContainer
                    center={
                      selectedSite
                        .mapGeometry[0]
                    }
                    zoom={13}
                    scrollWheelZoom={
                      true
                    }
                    style={{
                      height: "500px",
                      width: "100%",
                    }}
                  >

                    <MapLayers
                      satellite={
                        satelliteMode
                      }
                    />

                    <Polygon
                      positions={
                        selectedSite.mapGeometry
                      }
                    />

                    <FitSiteBounds
                      geometry={
                        selectedSite.mapGeometry
                      }
                    />

                  </MapContainer>

                </div>

                {/* SATELLITE / STREET TOGGLE */}

                <div
                  style={{
                    display: "flex",
                    gap: "10px",
                    marginTop: "12px",
                    flexWrap: "wrap",
                  }}
                >

                  <button
                    type="button"
                    className={
                      !satelliteMode
                        ? "primary-small"
                        : "secondary-small"
                    }
                    onClick={() =>
                      setSatelliteMode(
                        false
                      )
                    }
                  >
                    🗺️ Street
                  </button>

                  <button
                    type="button"
                    className={
                      satelliteMode
                        ? "primary-small"
                        : "secondary-small"
                    }
                    onClick={() =>
                      setSatelliteMode(
                        true
                      )
                    }
                  >
                    🛰️ Satellite
                  </button>

                </div>

              </>

            ) : (

              <div className="empty-state">

                <div className="empty-icon">
                  ⚠️
                </div>

                <h3>
                  No valid geometry
                </h3>

                <p>
                  This site does not have
                  valid saved polygon
                  geometry.
                </p>

              </div>

            )}

          </section>
        )}

      </main>

    </div>
  );
}

export default App;

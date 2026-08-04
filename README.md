# WealthWise: Personal Expense Tracker

A clean, responsive, and production-ready **Personal Expense Tracker** application built with a FastAPI backend and a clean Vanilla JavaScript/CSS frontend. The application persists data in a SQLite database via SQLAlchemy ORM and is containerized with Docker.

---

## Features

- **Dashboard Summary**: Real-time widgets showing total spending in Indian Rupees (₹), total transactions count, and the top spending category.
- **Spending by Category**: Muted progress bars showing the percentage breakdown of spending across categories (Food, Shopping, Travel, Bills, Entertainment, Other).
- **Expense Log**: Professional tabular display of all transactions, showing date, title, category (with distinct badges), amount, and notes.
- **Full CRUD operations**: Create new expenses, edit any details inline by reloading them into the form, or delete expenses with automatic real-time dashboard updates.
- **RESTful API**: Self-documenting FastAPI backend with automatic schema validation and response serialization.
- **Docker Ready**: Easy, configuration-free deployment using Docker containerization.
- **Continuous Integration**: Pre-configured GitHub Actions pipeline validating code integrity and Docker builds.

---

## Tech Stack

- **Backend**: Python 3.10+, FastAPI, Uvicorn
- **Database / ORM**: SQLite, SQLAlchemy ORM
- **Frontend**: HTML5, Vanilla CSS3 (clean slate/white theme, modern margins, responsive grids), Vanilla JavaScript (Fetch API)
- **Containerization**: Docker
- **CI/CD**: GitHub Actions

---

## Getting Started

Follow these step-by-step instructions to run the application locally or via Docker.

### Local Installation

1. **Clone or navigate to the project directory**:
   ```bash
   cd "Personal Expense Tracker"
   ```

2. **Create a virtual environment**:
   ```bash
   python -m venv venv
   ```

3. **Activate the virtual environment**:
   * **Windows (PowerShell)**:
     ```powershell
     .\venv\Scripts\Activate.ps1
     ```
   * **Windows (Command Prompt)**:
     ```cmd
     venv\Scripts\activate.bat
     ```
   * **macOS / Linux**:
     ```bash
     source venv/bin/activate
     ```

4. **Install backend dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

5. **Start the FastAPI application**:
   ```bash
   uvicorn backend.main:app --reload
   ```

6. **Open your browser** and navigate to:
   * **Web Application UI**: [http://localhost:8000](http://localhost:8000)
   * **API Docs (Swagger)**: [http://localhost:8000/docs](http://localhost:8000/docs)

---

### Docker Deployment

You can build and run the application in a sandboxed Docker container using the commands below:

1. **Build the Docker image**:
   ```bash
   docker build -t expense-tracker .
   ```

2. **Run the Docker container**:
   ```bash
   docker run -p 8000:8000 expense-tracker
   ```

3. **Access the application**:
   * Open your web browser and navigate to [http://localhost:8000](http://localhost:8000).

---

## Render Deployment

This application is configured for seamless deployment on **Render.com** (as a Web Service) using the root `render.yaml` blueprint configuration or manually via the Render dashboard.

### Option A: Manual Setup (Render Free Tier)

1. Create a new **Web Service** on Render and connect your GitHub repository.
2. Select **Python** as the Environment.
3. Configure the following settings:
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn backend.main:app --host 0.0.0.0 --port $PORT`
4. Click **Deploy**. Render will automatically provision a URL for your application.
   > [!NOTE]
   > On the Free Tier, the SQLite database is ephemeral and will reset when the service restarts or spins down due to inactivity.

### Option B: Persistent Disk Setup (Render Paid Tier)

To persist your database across restarts and deployments:
1. Create a new **Web Service** using the Python environment.
2. In the service's **Advanced Settings**:
   - Add a **Disk**:
     - **Name**: `expense-data`
     - **Mount Path**: `/var/data`
     - **Size**: `1 GB`
   - Add an **Environment Variable**:
     - **Key**: `DATABASE_DIR`
     - **Value**: `/var/data`
3. Deploy the service. The SQLite database `expenses.db` will now be safely stored on the persistent disk at `/var/data/expenses.db`.

### Option C: Docker-based Deployment

You can also deploy the application using the included `Dockerfile`:
1. Create a new **Web Service** and choose **Docker** as the runtime.
2. Add a persistent disk at `/var/data` and configure `DATABASE_DIR=/var/data` under the environment variables if persistence is required.
3. Deploy the service. Render will build and run the Docker container, dynamically mapping the external port using the `$PORT` environment variable handled in the Dockerfile command wrapper.

---

## API Documentation

The backend exposes the following RESTful API routes:

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/expenses` | Create a new expense transaction. |
| `GET` | `/expenses` | Retrieve a list of all expenses (newest first). |
| `PUT` | `/expenses/{id}` | Update the details of an existing expense record. |
| `DELETE` | `/expenses/{id}` | Delete a specific expense transaction. |
| `GET` | `/summary` | Get aggregated dashboard metrics (total spend, count, and category breakdown). |
| `GET` | `/health` | API health check status endpoint. |

---

## Project Structure

```text
Personal Expense Tracker/
├── .github/
│   └── workflows/
│       └── ci.yml             # GitHub Actions CI pipeline
├── backend/
│   ├── crud.py                # Database query/insert/update/delete helpers
│   ├── database.py            # SQLite connection engine & Session setup
│   ├── main.py                # FastAPI app entry point & route mappings
│   ├── models.py              # SQLAlchemy database ORM model
│   └── schemas.py             # Pydantic schemas for request validation
├── frontend/
│   ├── index.html             # UI layout structures
│   ├── script.js              # Vanilla JS logic & Fetch API networking
│   └── style.css              # Premium responsive glassmorphic style
├── Dockerfile                 # Docker configuration
├── .gitignore                 # Files excluded from git tracking
├── requirements.txt           # Python backend dependencies
└── README.md                  # Project documentation
```

---

## License

This project is open-source and available under the [MIT License](LICENSE).

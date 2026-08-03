# WealthWise: Personal Expense Tracker

A beautiful, lightweight, and production-ready **Personal Expense Tracker** application built with a FastAPI backend and a responsive Vanilla JavaScript/CSS frontend. The application persists data in a SQLite database via SQLAlchemy ORM and is fully containerized with Docker.

---

## Features

- **Dashboard Summary**: Real-time widgets showing total spending, total transactions count, and the top spending category.
- **Spending by Category**: Curated, responsive color-coded progress bars showing the percentage breakdown of spending across categories (Food, Shopping, Travel, Bills, Entertainment, Other).
- **Expense Log**: Interactive tabular display of all transactions, showing date, title, category (with distinct badges), amount, and notes.
- **Full CRUD operations**: Create new expenses, edit any details inline by reloading them into the form, or delete expenses with automatic real-time dashboard updates.
- **RESTful API**: Self-documenting FastAPI backend with automatic schema validation and response serialization.
- **Dockerized Ready**: Easy, configuration-free deployment using Docker containerization.
- **Continuous Integration**: Pre-configured GitHub Actions pipeline validating code integrity and Docker builds.

---

## Tech Stack

- **Backend**: Python 3.10+, FastAPI, Uvicorn
- **Database / ORM**: SQLite, SQLAlchemy ORM
- **Frontend**: HTML5, Vanilla CSS3 (custom variables, modern grids, responsive flexboxes), Vanilla JavaScript (Fetch API)
- **Containerization**: Docker
- **CI/CD**: GitHub Actions

---

## Getting Started

You can run this project locally on your machine or inside a Docker container.

### Option 1: Run Locally using Uvicorn

1. **Clone the repository**:
   ```bash
   git clone <your-repository-url>
   cd "Personal Expense Tracker"
   ```

2. **Create and activate a virtual environment** (optional but recommended):
   ```bash
   python -m venv venv
   # On Windows (CMD/PowerShell)
   .\venv\Scripts\activate
   # On macOS/Linux
   source venv/bin/activate
   ```

3. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Start the FastAPI server**:
   ```bash
   uvicorn backend.main:app --reload
   ```

5. **Access the application**:
   - Web App UI: [http://localhost:8000](http://localhost:8000)
   - Interactive Swagger API Documentation: [http://localhost:8000/docs](http://localhost:8000/docs)

---

### Option 2: Run using Docker

The application has been fully containerized so you can run it without installing Python or any system packages.

1. **Build the Docker image**:
   ```bash
   docker build -t expense-tracker .
   ```

2. **Run the Docker container**:
   ```bash
   docker run -d -p 8000:8000 --name wealthwise expense-tracker
   ```

3. **Access the application**:
   - Open your browser and navigate to [http://localhost:8000](http://localhost:8000).

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

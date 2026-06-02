# ProductSearch 🚀

![ProductSearch Banner](https://img.shields.io/badge/ProductSearch-Discover_SaaS_Ideas-indigo?style=for-the-badge)
![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi)
![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=next.js&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)
![Gemini AI](https://img.shields.io/badge/Gemini_AI-1A73E8?style=for-the-badge&logo=google&logoColor=white)

ProductSearch is an AI-powered SaaS idea discovery platform. It automatically scans top social networks and developer communities (Reddit, HackerNews, ProductHunt, LinkedIn, IndieHackers), clusters trending discussions, and uses Google Gemini AI to synthesize highly validated SaaS product opportunities.

## ✨ Features

- **Automated Social Listening**: Daily pipelines fetch trending posts, discussions, and pain points across major platforms.
- **AI Idea Generation**: Uses Gemini AI to extract concrete SaaS opportunities, including target audience, core features, and monetization strategies.
- **Smart Scoring**: Automatically ranks generated ideas based on market demand, competitor gaps, and virality.
- **PostgreSQL Full-Text Search**: Instant, highly-relevant search across thousands of AI-generated ideas using advanced `tsvector` matching.
- **Modern Dashboard UI**: Built with Next.js 16, React 19, and Tailwind CSS 4, featuring smooth micro-animations (Framer Motion) and a premium dark-mode aesthetic.
- **Automated Scheduling**: Backend powered by APScheduler to run extraction pipelines entirely hands-free.

## 🛠️ Tech Stack

### Backend
- **Framework**: FastAPI
- **Database**: PostgreSQL (via `asyncpg` + SQLAlchemy AsyncORM)
- **AI**: Google GenAI (`google-genai`)
- **Clustering**: Scikit-Learn (for topic modeling and grouping signals)
- **Task Scheduling**: APScheduler
- **Validation**: Pydantic v2

### Frontend
- **Framework**: Next.js 16 (App Router)
- **Styling**: Tailwind CSS 4
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Authentication**: NextAuth.js

---

## 🚀 Getting Started

### Prerequisites
- Python 3.10+
- Node.js 20+
- PostgreSQL instance running locally or via Docker
- Google Gemini API Key

### Backend Setup

1. **Navigate to the backend directory:**
   ```bash
   cd backend
   ```

2. **Create a virtual environment and install dependencies:**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

3. **Configure Environment Variables:**
   Create a `.env` file based on `.env.example` and add your database credentials and API keys.
   ```env
   DATABASE_URL=postgresql+asyncpg://user:password@localhost:5432/productsearch
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

4. **Run Migrations & Start the Server:**
   ```bash
   alembic upgrade head
   uvicorn app.main:app --reload --port 8000
   ```
   *The backend will be available at `http://localhost:8000` with Swagger UI at `/docs`.*

### Frontend Setup

1. **Navigate to the frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```
   *The frontend will be available at `http://localhost:3000`.*

---

## 🎯 Keyword Filtering Strategy

To ensure we extract genuine user pain points and high-value SaaS opportunities, ProductSearch utilizes targeted keyword filtering during the data ingestion phase. By looking for specific complaint-oriented phrases across social platforms, we filter out the noise and focus directly on what users actually need.

**High-Signal Keywords & Phrases Used for Filtering:**

* **Frustration & Pain Points:**
  - `"frustrating"` / `"so frustrated"`
  - `"i hate"` / `"anyone else hate"`
  - `"this sucks"`
  - `"so annoying"` / `"drives me crazy"`
  - `"pulling my hair out"`
  - `"pain point"`
  - `"biggest problem"`

* **Inefficiency & Manual Work:**
  - `"manual process"`
  - `"wasted hours"` / `"spent hours manually"`
  - `"there has to be a better way"`

* **Missing Tools & Software Gaps:**
  - `"no tools"` / `"no ai tools"` / `"no software"`
  - `"why is there no"`
  - `"can't find a good"` / `"cant find a good"`
  - `"no good solution"`
  - `"dying for a solution"`

* **Search & Discovery Queries:**
  - `"anyone know a tool"`
  - `"is there an app"` / `"is there an app for"` / `"is there a tool"`
  - `"looking for a tool"`

* **Feature & Solution Requests:**
  - `"i wish"`
  - `"there should be an app"`
  - `"i'm struggling with"` / `"im struggling with"`
  - `"need something that"`
  - `"would pay for"`
  - `"wish someone would build"` / `"someone should build"`
  - `"how do you handle"`


This approach helps uncover highly validated ideas backed by real user struggles before they are even synthesized by our AI models.

## 🏗️ Architecture & Pipelines

1. **Data Ingestion**: Specific crawlers hit platform APIs (Reddit, HN, etc.) to fetch trending data.
2. **Keyword Filtering**: Signals are filtered using pain-point keywords (like "frustrating", "no tools") to isolate strong product opportunities.
3. **Normalization & Clustering**: Data is cleaned into a standard schema and clustered using TF-IDF / K-Means (via Scikit-learn) to identify overarching "pain points".
4. **AI Generation**: Clustered data is fed into a highly-tuned Gemini prompt to extract a single cohesive SaaS solution.
5. **Storage & Search**: Stored in PostgreSQL with `JSONB` for features and `tsvector` columns for ultra-fast full-text querying.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

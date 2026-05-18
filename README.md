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

## 🏗️ Architecture & Pipelines

1. **Data Ingestion**: Specific crawlers hit platform APIs (Reddit, HN, etc.) to fetch trending data.
2. **Normalization & Clustering**: Data is cleaned into a standard schema and clustered using TF-IDF / K-Means (via Scikit-learn) to identify overarching "pain points".
3. **AI Generation**: Clustered data is fed into a highly-tuned Gemini prompt to extract a single cohesive SaaS solution.
4. **Storage & Search**: Stored in PostgreSQL with `JSONB` for features and `tsvector` columns for ultra-fast full-text querying.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

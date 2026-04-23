# ResumeAI Pro

A professional, AI-powered resume builder built with React Native (Expo). Create, edit, and optimize your resume using a custom DSL and high-performance AI models.

## 🚀 Features

- **✦ AI-Powered Import**: Upload a plain text resume and let AI convert it into our professional DSL format instantly.
- **✦ Real-time Preview**: See your changes reflected immediately in a premium, stylized resume layout.
- **✦ Skill Insertion**: Add new skills effortlessly; the AI finds the best spot in your resume to include them naturally.
- **✦ ATS Scoring**: Paste a job description and get an instant match score with keywords and suggestions.
- **✦ Growth Roadmap**: Generate a 3-step career growth plan based on your current skills and target role.
- **✦ Magic Rewrite**: Surgically enhances your experience bullets using Groq (Llama 3.1) to sound more professional and achievement-oriented.
- **✦ Version Control**: Keep track of different versions of your resume for different job applications.

## 🛠️ Technology Stack

- **Framework**: React Native / Expo (Router v2)
- **Styling**: NativeWind (Tailwind CSS)
- **State Management**: React Hooks & Context
- **AI Engine**: Groq (Llama 3.1 8B Instant)
- **Storage**: Local-first with AsyncStorage
- **Deployment**: Web, iOS, Android

## 📦 Getting Started

1. **Clone the Repo**: `git clone ...`
2. **Install Dependencies**: `npm install`
3. **Set your API Key**: Navigate to `Settings` within the app and paste your Groq API Key.
4. **Run the App**: `npm run web` (or `npm run android` / `ios`)

## 📄 DSL Syntax Reference

The app uses a custom DSL for resume structure:

```latex
\resumestart
\name{John Doe}
\role{Senior Software Engineer}
\contact{john@example.com} \contact{linkedin.com/in/johndoe}

\summary{Experienced engineer with a focus on scalable web systems...}

\section{Experience}
\job{Lead Developer}{Tech Corp}{2021 -- Present}
\bullet{Architected a microservices platform handling 1M+ req/day.}

\section{Skills}
\skillgroup{Languages}{TypeScript, Go, Python}
\skillgroup{Tools}{Docker, K8s, AWS}

\resumeend
```

## 🔐 Privacy

All resume data is stored locally on your device. AI processing is performed via Groq's secure API using your personal API key.

## 📄 License

MIT

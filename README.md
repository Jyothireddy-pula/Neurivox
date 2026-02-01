# Neurivox | OS  
### Your web, upgraded with AI

**Neurivox | OS** is a browser-based AI workspace that brings research, writing, coding, and automation into a single, focused interface.  
Instead of switching between tools and tabs, Neurivox lets you think, build, and create in one place.

Built with **React, TypeScript, and Vite**, it’s designed to be modular, extensible, and ready for advanced AI workflows.

---


## 🚀 What Neurivox Does

Neurivox turns the browser into an intelligent work environment:

- Research and summarize content  
- Write, rewrite, and refine text  
- Understand and improve code  
- Experiment with agent-style automation  
- Keep AI workflows organized and fast  

The focus is on **clarity, speed, and control**, not feature overload.

---

## ✨ Core Features

### 🔍 Research
- Summarize web pages and long content  
- Extract key points and structured insights  

### ✍️ Writing
- Rewrite, paraphrase, and translate  
- Improve tone, clarity, and grammar  
- Generate emails, blogs, and short-form content  

### 💻 Code Assistance
- Explain and debug code snippets  
- Generate test cases and suggestions  

### 🧠 Prompt & Agent Tools
- Central prompt editor  
- Task-based prompt execution  
- Early-stage agent and workflow concepts  

### 🔐 Privacy First
- API keys stored locally  
- Permission-based usage  
- Custom LLM gateway support  

---

## 🧩 Feature Status

| Feature | Status |
|------|------|
| Prompt editor | ✅ Implemented |
| Research & writing tools | ✅ Implemented |
| Code assistance | ✅ Implemented |
| Event-based architecture | ✅ Implemented |
| Multi-agent workflows | 🚧 In progress |
| OCR / Vision support | 🧭 Planned |
| Plugin system | 🧭 Planned |

---

## 🖥️ Live Demo
👉 https://neurivox-os-jyothireddypula.netlify.app

---

## 🧠 Architecture Overview

```
UI (React + TypeScript)
        │
Components & Sidebar
        │
Service Layer (APIs, helpers)
        │
Event Bus (EventEmitter)
        │
LLM Gateway (Gemini / Local Models)
        │
Response Renderer (Chat & Cards)
```

---

## ⚙️ Getting Started

### 1. Clone the repository
```
git clone https://github.com/Jyothireddy-pula/Neurivox.git
cd Neurivox
```

### 2. Install dependencies
```
npm install
```

### 3. Start the development server
```
npm start
```

### 4. Configure API keys
Create a `.env` file:
```
VITE_GEMINI_KEY=your_key_here
VITE_AI_STUDIO_KEY=your_key_here
```

---

## 🗂️ Project Structure

```
Neurivox/
├── components/   UI components
├── services/     API and LLM integrations
├── utils/        Event bus and helpers
├── types/        TypeScript definitions
├── App.tsx       Root component
└── manifest.json App metadata
```

---

## 🧭 Why Neurivox Exists

Modern workflows are spread across too many tools.  
Neurivox is an experiment in **consolidation** — bringing AI capabilities into one calm, focused space where work flows naturally.

---

## 🔮 Roadmap

- Agent-based task orchestration  
- Visual workflow builder  
- Smarter model selection per task  
- Encrypted credential vault  
- Plugin and extension ecosystem  
- Polished, keyboard-first UI  

---

## 🏗️ Tech Stack

- React + TypeScript  
- Vite  
- Custom EventEmitter architecture  
- Tailwind / Custom CSS  
- LLM APIs (Gemini, Local Models)

---

## 👨‍💻 Author

**Jyothi Reddy Pula**  
Built with curiosity, iteration, and a focus on better workflows.

---

## 📄 License
Apache 2.0

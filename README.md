# Neurivox | OS
### Your Web. Now Powered by AI.
A unified AI operating system for your browser — built to make research, writing, automation, and code workflows faster, smarter, and frictionless.

---

![Neurivox OS UI Mockup](https://via.placeholder.com/900x420?text=Neurivox+OS+UI+Mockup)

---

## 🚀 Overview
Neurivox | OS transforms the web into an intelligent workspace.
Instead of juggling dozens of tabs and tools, Neurivox brings research, writing, coding, data extraction, automation, and social media tools into one seamless interface powered by AI.

Built with **TypeScript + React + Vite**, it provides a modular architecture, professional UI, and multi-agent-ready infrastructure for next-gen workflows.

---

## ✨ Features at a Glance

### 🔍 Research Tools
- Summarize websites, PDFs, and long articles  
- Extract structured data, SEO keywords & insights  
- Analyze arguments and generate reports  

### ✍️ Writing Tools
- Rewrite, paraphrase, translate  
- Fix grammar and improve tone  
- Generate emails, blogs, captions, and scripts  

### 💻 Code Intelligence
- Debug code  
- Explain snippets  
- Review pull requests  
- Generate test cases  

### 📱 Social Media Automation
- Auto comments  
- Caption generation  
- Insights extraction  
- Post drafting with brand tone  

### 🧠 Advanced AI Tools
- Prompt Factory  
- Mini-Agent Automation  
- OCR / Vision support  
- Multi-agent collaborative workflows  

### 🔐 Privacy & Security
- Local encryption  
- Permission-based usage  
- Custom LLM gateway support  
- API key isolation  

---

## 🖥️ Live Demo
👉 **https://neurivox-os-jyothireddypula.netlify.app**

---

## 📸 Screenshots

![Dashboard Mockup](https://via.placeholder.com/800x420?text=Dashboard+Mockup)

*Unified AI Dashboard*

![Prompt Editor Mockup](https://via.placeholder.com/800x420?text=Prompt+Editor+Mockup)

*Prompt Editor + Multi-Tool Panel*

![Automation Workflow](https://via.placeholder.com/800x420?text=Automation+Workflows)

*Automation & Multi-Agent Workflow Concept*

---

## 🧩 Architecture

![Architecture Diagram](https://via.placeholder.com/950x480?text=Neurivox+Architecture+Diagram)

### Architecture Breakdown

```
                       ┌──────────────────────────┐
                       │       User Interface      │
                       │  (React + TypeScript)     │
                       └──────────────┬───────────┘
                                      │
                    UI Components / Sidebar / Prompt Editor
                                      │
                         ┌───────────▼────────────┐
                         │      Service Layer      │
                         │  (API Handlers, Utils)  │
                         └───────────┬────────────┘
                                      │
                            EventEmitter / State Bus
                                      │
                         ┌───────────▼────────────┐
                         │    LLM Gateway Layer    │
                         │ (Gemini / Local AI API) │
                         └───────────┬────────────┘
                                      │
                             Model Output Response
                                      │
                         ┌───────────▼────────────┐
                         │   Response Renderer     │
                         │  (Chat + Result Cards)  │
                         └─────────────────────────┘
```

---

## ⚙️ Installation

### 1. Clone repository
```
git clone https://github.com/Jyothireddy-pula/Neurivox.git
cd Neurivox
```

### 2. Install dependencies
```
npm install
```

### 3. Run development server
```
npm start
```

### 4. Configure API Keys
Create `.env` file:

```
VITE_GEMINI_KEY=your_key_here
VITE_AI_STUDIO_KEY=your_key_here
```

---

## 🗂️ Project Structure

```
Neurivox/
│
├── components/       → UI Components
├── icons/            → Custom Icons
├── services/         → API Integrations
├── utils/            → Helpers (EventEmitter, parsers)
├── types/            → TypeScript types
├── index.html        → App entry point
├── App.tsx           → Root component
├── manifest.json     → App metadata
└── tsconfig.json     → TS configuration
```

---

## 🧭 Why I Built This
Managing research, writing, coding, and social media across many tools felt slow and repetitive.  
Neurivox | OS was built to centralize all AI workflows into one fast, frictionless interface.

---

## 🔮 Future Roadmap
- 🚀 Real-time multi-agent collaboration  
- 💬 Built-in chat interface  
- 🤖 Auto-model selection based on task type  
- 🔐 Enhanced security with encrypted credential vault  
- 🌈 Improved UI/UX system  
- 🛠 Plugin ecosystem and extensions  

---

## 🏗️ Tech Stack
- React + TypeScript  
- Vite  
- Custom EventEmitter Architecture  
- Tailwind / Custom CSS  
- LLM APIs (Gemini, Local AI, etc.)

---

## 👨‍💻 Built By
**Jyothi Reddy Pula**  
Made with curiosity, creativity, and code.

---

## 📄 License
Apache 2.0 License

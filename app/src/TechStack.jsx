import { useState } from "react";

const layers = [
  {
    id: "frontend",
    label: "Frontend",
    color: "#00D4FF",
    bg: "rgba(0,212,255,0.08)",
    border: "rgba(0,212,255,0.3)",
    icon: "⚡",
    description: "What the user sees and interacts with",
    techs: [
      { name: "React.js", role: "UI Framework", why: "Component-based, fast rendering, huge community support. Build reusable editor, dashboard, and contest components.", badge: "Core" },
      { name: "Monaco Editor", role: "Code Editor", why: "The same editor used in VS Code. Supports syntax highlighting, autocomplete, and 50+ languages out of the box.", badge: "Core" },
      { name: "Tailwind CSS", role: "Styling", why: "Utility-first CSS. Build consistent UI fast without writing custom CSS from scratch.", badge: "Core" },
      { name: "Socket.io (Client)", role: "Real-time Events", why: "Track keystrokes, paste events, tab switches in real time and send to backend instantly.", badge: "Detection" },
      { name: "Judge0 Widget", role: "Code Runner", why: "Embed code execution directly in browser. Runs code against test cases and returns results.", badge: "Execution" },
    ]
  },
  {
    id: "backend",
    label: "Backend",
    color: "#7C3AED",
    bg: "rgba(124,58,237,0.08)",
    border: "rgba(124,58,237,0.3)",
    icon: "⚙️",
    description: "The brain — handles logic, APIs, and processing",
    techs: [
      { name: "Node.js + Express", role: "API Server", why: "Fast, lightweight server. Handles REST APIs for user auth, problem submission, and contest management.", badge: "Core" },
      { name: "Python (FastAPI)", role: "Detection Engine", why: "Python has the best ML libraries. Run your detection algorithms — pattern analysis, ML model, scoring — in FastAPI microservice.", badge: "Detection" },
      { name: "Socket.io (Server)", role: "Real-time Receiver", why: "Receives behavioral events from frontend — keystrokes, paste, tab switch — in real time during contests.", badge: "Detection" },
      { name: "Judge0 API", role: "Code Execution", why: "Open-source code execution engine. Runs submitted code safely in sandbox against test cases. Supports 60+ languages.", badge: "Execution" },
      { name: "JWT Auth", role: "Authentication", why: "Secure token-based login. Each user gets a unique token — protects contest sessions and user data.", badge: "Security" },
    ]
  },
  {
    id: "detection",
    label: "Detection Engine",
    color: "#F59E0B",
    bg: "rgba(245,158,11,0.08)",
    border: "rgba(245,158,11,0.3)",
    icon: "🔍",
    description: "Your core innovation — the AI vs Human classifier",
    techs: [
      { name: "Python AST Module", role: "Code Parser", why: "Parses code into Abstract Syntax Tree. Extracts docstrings, variable names, comment style, edge case handling — all detection signals.", badge: "Layer 2" },
      { name: "scikit-learn", role: "ML Classifier", why: "Train a Random Forest or SVM model on labeled dataset of AI vs human code. Gives probability score for each submission.", badge: "ML Model" },
      { name: "Tree-sitter", role: "Multi-language Parser", why: "Parse code in any language — Python, Java, C++, JS. Extract style signals regardless of language.", badge: "Layer 2" },
      { name: "Cosine Similarity", role: "Fingerprint Matching", why: "Convert user's code style into a vector. Compare new submission vector against user's past submission vectors. Low similarity = suspicious.", badge: "Layer 3" },
      { name: "Pandas + NumPy", role: "Behavioral Analysis", why: "Process raw keystroke logs — calculate typing speed, pause duration, paste events, edit frequency. Feed into scoring engine.", badge: "Layer 1" },
    ]
  },
  {
    id: "database",
    label: "Database",
    color: "#10B981",
    bg: "rgba(16,185,129,0.08)",
    border: "rgba(16,185,129,0.3)",
    icon: "🗄️",
    description: "Stores all data — users, code, behavior logs, scores",
    techs: [
      { name: "PostgreSQL", role: "Main Database", why: "Store users, problems, submissions, contest data. Relational DB — perfect for structured data with relationships.", badge: "Core" },
      { name: "Redis", role: "Real-time Cache", why: "Store live behavioral events (keystrokes, paste events) during active contest sessions. Ultra-fast, in-memory storage.", badge: "Real-time" },
      { name: "MongoDB", role: "Behavioral Logs", why: "Store raw behavioral log data (JSON format). Flexible schema — each session has different number of events.", badge: "Detection" },
      { name: "AWS S3 / Cloudinary", role: "File Storage", why: "Store profile pictures, problem attachments, and exported reports.", badge: "Storage" },
    ]
  },
  {
    id: "devops",
    label: "DevOps & Deployment",
    color: "#EF4444",
    bg: "rgba(239,68,68,0.08)",
    border: "rgba(239,68,68,0.3)",
    icon: "🚀",
    description: "How the project is deployed and scaled",
    techs: [
      { name: "Docker", role: "Containerization", why: "Package every service — frontend, backend, detection engine, Judge0 — into containers. Runs the same everywhere.", badge: "Core" },
      { name: "AWS / Render", role: "Cloud Hosting", why: "Deploy your backend and APIs. Start with Render (free tier), scale to AWS when users grow.", badge: "Hosting" },
      { name: "Vercel", role: "Frontend Hosting", why: "Deploy React frontend instantly. Free tier, auto-deploys on every Git push. Fastest CDN for static sites.", badge: "Hosting" },
      { name: "GitHub Actions", role: "CI/CD Pipeline", why: "Auto-run tests and deploy on every code push. Keeps your project always up-to-date and bug-free.", badge: "Automation" },
    ]
  }
];

const flowSteps = [
  { step: "1", label: "User opens contest", detail: "React + Monaco Editor loads", color: "#00D4FF" },
  { step: "2", label: "Behavioral tracking starts", detail: "Socket.io records every keystroke, paste, pause", color: "#7C3AED" },
  { step: "3", label: "User submits code", detail: "Judge0 runs code against test cases", color: "#F59E0B" },
  { step: "4", label: "Detection engine fires", detail: "AST parser + ML model + fingerprint check", color: "#10B981" },
  { step: "5", label: "Score calculated", detail: "4 layers weighted → AI probability %", color: "#EF4444" },
  { step: "6", label: "Result shown", detail: "Trust score updated on dashboard", color: "#00D4FF" },
];

const badgeColors = {
  "Core": "#00D4FF",
  "Detection": "#F59E0B",
  "Execution": "#7C3AED",
  "Security": "#EF4444",
  "ML Model": "#F59E0B",
  "Layer 1": "#EC4899",
  "Layer 2": "#8B5CF6",
  "Layer 3": "#06B6D4",
  "Real-time": "#10B981",
  "Storage": "#6B7280",
  "Hosting": "#3B82F6",
  "Automation": "#F97316",
};

export default function TechStack() {
  const [activeLayer, setActiveLayer] = useState(null);
  const [activeTech, setActiveTech] = useState(null);
  const [activeTab, setActiveTab] = useState("stack");

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0A0A0F",
      color: "#E2E8F0",
      fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
      padding: "0",
    }}>
      {/* Header */}
      <div style={{
        background: "linear-gradient(135deg, #0A0A0F 0%, #12121F 50%, #0A0A0F 100%)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        padding: "32px 40px 24px",
        position: "relative",
        overflow: "hidden",
      }}>
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
          background: "radial-gradient(ellipse at 20% 50%, rgba(0,212,255,0.05) 0%, transparent 60%), radial-gradient(ellipse at 80% 50%, rgba(124,58,237,0.05) 0%, transparent 60%)",
        }} />
        <div style={{ position: "relative" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
            <div style={{
              background: "linear-gradient(135deg, #00D4FF, #7C3AED)",
              borderRadius: "8px", padding: "6px 14px",
              fontSize: "11px", fontWeight: "700", letterSpacing: "2px",
              color: "#fff",
            }}>AI DETECT</div>
            <div style={{ color: "rgba(255,255,255,0.3)", fontSize: "12px" }}>v1.0 — Project Architecture</div>
          </div>
          <h1 style={{
            fontSize: "28px", fontWeight: "800", margin: "0 0 6px",
            background: "linear-gradient(135deg, #fff 0%, rgba(255,255,255,0.6) 100%)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            letterSpacing: "-0.5px",
          }}>Complete Tech Stack</h1>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "13px", margin: 0 }}>
            AI-Powered Coding Platform with Built-in Detection Engine
          </p>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: "4px", marginTop: "24px" }}>
          {["stack", "flow", "summary"].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{
              background: activeTab === tab ? "rgba(255,255,255,0.1)" : "transparent",
              border: activeTab === tab ? "1px solid rgba(255,255,255,0.15)" : "1px solid transparent",
              color: activeTab === tab ? "#fff" : "rgba(255,255,255,0.4)",
              padding: "8px 20px", borderRadius: "6px",
              fontSize: "12px", fontWeight: "600", cursor: "pointer",
              letterSpacing: "1px", textTransform: "uppercase",
              transition: "all 0.2s",
            }}>{tab}</button>
          ))}
        </div>
      </div>

      <div style={{ padding: "32px 40px" }}>

        {/* STACK TAB */}
        {activeTab === "stack" && (
          <div>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "12px", marginBottom: "24px", letterSpacing: "1px" }}>
              CLICK ANY LAYER TO EXPLORE → CLICK A TECH TO SEE WHY WE CHOSE IT
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {layers.map(layer => (
                <div key={layer.id}>
                  {/* Layer Header */}
                  <div
                    onClick={() => setActiveLayer(activeLayer === layer.id ? null : layer.id)}
                    style={{
                      background: activeLayer === layer.id ? layer.bg : "rgba(255,255,255,0.02)",
                      border: `1px solid ${activeLayer === layer.id ? layer.border : "rgba(255,255,255,0.06)"}`,
                      borderRadius: "12px",
                      padding: "16px 24px",
                      cursor: "pointer",
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      transition: "all 0.3s",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                      <span style={{ fontSize: "20px" }}>{layer.icon}</span>
                      <div>
                        <div style={{ fontSize: "14px", fontWeight: "700", color: layer.color, letterSpacing: "1px" }}>
                          {layer.label}
                        </div>
                        <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", marginTop: "2px" }}>
                          {layer.description}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <div style={{
                        background: `${layer.color}22`, border: `1px solid ${layer.color}44`,
                        color: layer.color, borderRadius: "20px", padding: "4px 12px",
                        fontSize: "11px", fontWeight: "600",
                      }}>{layer.techs.length} tools</div>
                      <span style={{ color: layer.color, fontSize: "16px", transition: "transform 0.3s", transform: activeLayer === layer.id ? "rotate(90deg)" : "rotate(0deg)" }}>›</span>
                    </div>
                  </div>

                  {/* Expanded Techs */}
                  {activeLayer === layer.id && (
                    <div style={{
                      marginTop: "8px", marginLeft: "24px",
                      display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                      gap: "10px",
                    }}>
                      {layer.techs.map(tech => (
                        <div
                          key={tech.name}
                          onClick={() => setActiveTech(activeTech?.name === tech.name ? null : tech)}
                          style={{
                            background: activeTech?.name === tech.name ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.02)",
                            border: `1px solid ${activeTech?.name === tech.name ? layer.border : "rgba(255,255,255,0.06)"}`,
                            borderRadius: "10px", padding: "14px 16px",
                            cursor: "pointer", transition: "all 0.2s",
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
                            <div style={{ fontSize: "13px", fontWeight: "700", color: "#fff" }}>{tech.name}</div>
                            <div style={{
                              background: `${badgeColors[tech.badge]}22`,
                              border: `1px solid ${badgeColors[tech.badge]}44`,
                              color: badgeColors[tech.badge],
                              borderRadius: "20px", padding: "2px 10px",
                              fontSize: "10px", fontWeight: "700", letterSpacing: "0.5px",
                            }}>{tech.badge}</div>
                          </div>
                          <div style={{ fontSize: "11px", color: layer.color, marginBottom: "8px", fontWeight: "600" }}>{tech.role}</div>
                          {activeTech?.name === tech.name && (
                            <div style={{
                              fontSize: "11px", color: "rgba(255,255,255,0.55)",
                              lineHeight: "1.6", borderTop: "1px solid rgba(255,255,255,0.06)",
                              paddingTop: "10px", marginTop: "4px",
                            }}>{tech.why}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* FLOW TAB */}
        {activeTab === "flow" && (
          <div>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "12px", marginBottom: "32px", letterSpacing: "1px" }}>
              HOW A CONTEST SUBMISSION FLOWS THROUGH THE SYSTEM
            </p>
            <div style={{ position: "relative" }}>
              {/* Vertical line */}
              <div style={{
                position: "absolute", left: "27px", top: "40px",
                width: "2px", height: "calc(100% - 80px)",
                background: "linear-gradient(to bottom, #00D4FF, #7C3AED, #F59E0B, #10B981, #EF4444, #00D4FF)",
                opacity: 0.3,
              }} />
              <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                {flowSteps.map((s, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "24px" }}>
                    <div style={{
                      width: "56px", height: "56px", borderRadius: "50%", flexShrink: 0,
                      background: `${s.color}15`,
                      border: `2px solid ${s.color}`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "18px", fontWeight: "800", color: s.color,
                      position: "relative", zIndex: 1,
                    }}>{s.step}</div>
                    <div style={{
                      flex: 1, background: "rgba(255,255,255,0.02)",
                      border: "1px solid rgba(255,255,255,0.06)",
                      borderRadius: "12px", padding: "16px 20px",
                      marginTop: "8px",
                    }}>
                      <div style={{ fontSize: "14px", fontWeight: "700", color: s.color, marginBottom: "4px" }}>{s.label}</div>
                      <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)" }}>{s.detail}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Detection Score Breakdown */}
            <div style={{
              marginTop: "40px", background: "rgba(245,158,11,0.06)",
              border: "1px solid rgba(245,158,11,0.2)", borderRadius: "12px", padding: "24px",
            }}>
              <div style={{ fontSize: "12px", color: "#F59E0B", letterSpacing: "1px", fontWeight: "700", marginBottom: "20px" }}>
                DETECTION SCORE CALCULATION
              </div>
              {[
                { layer: "Behavioral Analysis", weight: 35, color: "#EC4899" },
                { layer: "Code Pattern Analysis", weight: 25, color: "#8B5CF6" },
                { layer: "Style Fingerprinting", weight: 25, color: "#06B6D4" },
                { layer: "Text Explainability Test", weight: 15, color: "#10B981" },
              ].map(item => (
                <div key={item.layer} style={{ marginBottom: "14px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                    <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.7)" }}>{item.layer}</span>
                    <span style={{ fontSize: "12px", color: item.color, fontWeight: "700" }}>{item.weight}%</span>
                  </div>
                  <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: "4px", height: "6px", overflow: "hidden" }}>
                    <div style={{
                      width: `${item.weight * 2.5}%`, height: "100%",
                      background: item.color, borderRadius: "4px",
                      transition: "width 1s ease",
                    }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SUMMARY TAB */}
        {activeTab === "summary" && (
          <div>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "12px", marginBottom: "32px", letterSpacing: "1px" }}>
              FULL STACK AT A GLANCE
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "16px" }}>
              {[
                { category: "Frontend", items: ["React.js", "Monaco Editor", "Tailwind CSS", "Socket.io Client"], color: "#00D4FF" },
                { category: "Backend", items: ["Node.js + Express", "Python FastAPI", "Socket.io Server", "JWT Auth"], color: "#7C3AED" },
                { category: "Code Execution", items: ["Judge0 API", "Sandbox Environment", "60+ Languages", "Test Case Runner"], color: "#F59E0B" },
                { category: "Detection Engine", items: ["Python AST Module", "scikit-learn ML", "Tree-sitter Parser", "Cosine Similarity", "Pandas + NumPy"], color: "#EC4899" },
                { category: "Database", items: ["PostgreSQL (main)", "Redis (real-time)", "MongoDB (logs)", "AWS S3 (files)"], color: "#10B981" },
                { category: "DevOps", items: ["Docker", "Vercel (frontend)", "AWS / Render", "GitHub Actions CI/CD"], color: "#EF4444" },
              ].map(cat => (
                <div key={cat.category} style={{
                  background: `${cat.color}08`,
                  border: `1px solid ${cat.color}25`,
                  borderRadius: "12px", padding: "20px",
                }}>
                  <div style={{
                    fontSize: "11px", fontWeight: "700", color: cat.color,
                    letterSpacing: "1.5px", marginBottom: "14px",
                  }}>{cat.category.toUpperCase()}</div>
                  {cat.items.map(item => (
                    <div key={item} style={{
                      display: "flex", alignItems: "center", gap: "10px",
                      marginBottom: "8px",
                    }}>
                      <div style={{
                        width: "5px", height: "5px", borderRadius: "50%",
                        background: cat.color, flexShrink: 0,
                      }} />
                      <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.7)" }}>{item}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>

            {/* Bottom Banner */}
            <div style={{
              marginTop: "32px",
              background: "linear-gradient(135deg, rgba(0,212,255,0.08), rgba(124,58,237,0.08))",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "12px", padding: "24px",
              textAlign: "center",
            }}>
              <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)", marginBottom: "8px", letterSpacing: "1px" }}>YOUR UNIQUE INNOVATION</div>
              <div style={{ fontSize: "16px", fontWeight: "700", color: "#fff", lineHeight: "1.6" }}>
                Behavioral Tracking + Style Fingerprinting + Code Tracing<br />
                <span style={{ background: "linear-gradient(135deg, #00D4FF, #7C3AED)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                  All inside one platform — nobody else has done this.
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

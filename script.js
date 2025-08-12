    import React, { useState } from "react";

// BizGPT - Single File React Component
// - TailwindCSS is assumed to be available in the project
// - This component is a self-contained frontend mock of an AI assistant
// - Replace `mockGenerate` with real API calls (OpenAI or other) in production

export default function PauleeBiz() {
  const modes = [
    { id: "research", title: "Business Research" },
    { id: "feasibility", title: "Feasibility Study" },
    { id: "theory", title: "Business Theories" },
    { id: "pitch", title: "Pitch Deck" },
    { id: "case", title: "Case Study" },
  ];

  const [selectedMode, setSelectedMode] = useState(modes[0].id);
  const [conversation, setConversation] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  function appendMessage(role, text) {
    setConversation((c) => [...c, { role, text, id: Date.now() + Math.random() }]);
  }

  // very small, deterministic mock generator to simulate AI responses
  function mockGenerate(mode, prompt) {
    const base = {
      research: (p) => `Title suggestions for research based on: "${p}"\n\n1) ${p} — A comparative study\n2) ${p} and its impact on stakeholders\n3) Bridging theory and practice: ${p}`,
      feasibility: (p) => `Feasibility study outline for: "${p}"\n\n- Executive Summary\n- Market Analysis\n- Technical Requirements\n- Financial Projections (estimates)\n- Break-even Analysis\n- Recommendation\n\n(Provide data to replace placeholders for accurate numbers.)`,
      theory: (p) => `Business theories relevant to: "${p}"\n\n- Porter\u2019s Five Forces: brief application\n- SWOT analysis: strengths, weaknesses, opportunities, threats\n- Balanced Scorecard: suggested KPIs\n\n(Ask for a detailed application to a specific company or industry.)`,
      pitch: (p) => `Pitch deck skeleton for: "${p}"\n\n1) Problem\n2) Solution\n3) Market Size\n4) Business Model\n5) Go-to-market\n6) Financials\n7) Ask\n\n(I can expand each slide into speaker notes.)`,
      case: (p) => `Case Study (fictional) based on: "${p}"\n\n- Background\n- Challenge\n- Actions Taken\n- Results\n- Lessons Learned\n`,
    };

    return base[mode] ? base[mode](prompt || "(no prompt provided)") : "I don't know that mode yet.";
  }

  async function handleSend(e) {
    e?.preventDefault();
    if (!input.trim()) return;
    const userText = input.trim();
    appendMessage("user", userText);
    setInput("");

    setLoading(true);
    // In production, replace the next block with an API call.
    await new Promise((r) => setTimeout(r, 650)); // simulate latency
    const aiText = mockGenerate(selectedMode, userText);
    appendMessage("assistant", aiText);
    setLoading(false);
  }

  function clearConversation() {
    setConversation([]);
  }

  function downloadConversation() {
    const blob = new Blob([conversation.map((m) => `${m.role.toUpperCase()}: ${m.text}`).join("\n\n")], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "BizGPT-conversation.txt";
    a.click();
    URL.revokeObjectURL(url);
  }

  // Quick templates for each mode to help the user
  const templates = {
    research: "e.g., 'The effect of digital payment adoption on small retailers in Cebu'",
    feasibility: "e.g., '₱500,000 coffee shop in Makati'",
    theory: "e.g., 'Apply Porter's Five Forces to ride-hailing in Manila'",
    pitch: "e.g., 'Seed round pitch for a sustainable packaging startup'",
    case: "e.g., 'How a small restaurant scaled to 5 branches in 2 years'",
  };

  return (
    <div className="min-h-screen bg-white text-black flex">
      {/* Sidebar */}
      <aside className="w-72 border-r border-gray-200 p-4 flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center shadow-md">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-white">
              <path d="M3 12h18" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M7 7h10v10H7z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div>
            <h1 className="font-bold text-lg">PauleeBiz</h1>
            <p className="text-xs text-gray-600">Business-only AI • Research • Feasibility</p>
          </div>
        </div>

        <nav className="flex-1 overflow-auto">
          <h2 className="text-xs uppercase tracking-wide text-gray-500 mb-2">Modes</h2>
          <ul className="space-y-2">
            {modes.map((m) => (
              <li key={m.id}>
                <button
                  onClick={() => setSelectedMode(m.id)}
                  className={`w-full text-left px-3 py-2 rounded-md flex items-center justify-between ${selectedMode === m.id ? "bg-black text-white" : "bg-white text-black border border-gray-200"}`}>
                  <span className="font-medium">{m.title}</span>
                  <span className="text-xs text-gray-400">{m.id}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex gap-2">
          <button onClick={clearConversation} className="flex-1 px-3 py-2 rounded-md border border-gray-200 text-sm">Clear</button>
          <button onClick={downloadConversation} className="px-3 py-2 rounded-md bg-yellow-500 text-black text-sm font-semibold">Export</button>
        </div>

        <p className="text-xs text-gray-500">Theme: Black & Gold on White</p>
      </aside>

      {/* Main Area */}
      <main className="flex-1 flex flex-col">
        <header className="flex items-center justify-between p-4 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold">{modes.find((mm) => mm.id === selectedMode)?.title}</h2>
            <p className="text-sm text-gray-600">Focused, professional outputs for business use</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-sm text-gray-600">Premium Theme</div>
            <div className="px-3 py-1 rounded-md bg-black text-yellow-400 font-semibold">BIZ</div>
          </div>
        </header>

        <section className="flex-1 p-4 overflow-auto flex flex-col gap-4">
          <div className="rounded-lg border border-gray-100 bg-white p-4 shadow-sm">
            <div className="text-sm text-gray-500 mb-2">Prompt template</div>
            <div className="flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={templates[selectedMode]}
                className="flex-1 px-3 py-2 border border-gray-200 rounded-md focus:outline-none"
                onKeyDown={(e) => e.key === "Enter" && handleSend(e)}
              />
              <button onClick={handleSend} className="px-4 py-2 rounded-md bg-black text-yellow-400 font-semibold">Generate</button>
            </div>
          </div>

          <div className="flex-1 overflow-auto space-y-4">
            {conversation.length === 0 && (
              <div className="text-center text-gray-400 py-16">Your business assistant is ready. Choose a mode and type a prompt.</div>
            )}

            {conversation.map((m) => (
              <div key={m.id} className={`max-w-3xl ${m.role === "user" ? "ml-auto" : "mr-auto"}`}>
                <div className={`${m.role === "assistant" ? "border border-yellow-100 bg-yellow-50 p-4 rounded-lg" : "border border-gray-200 bg-white p-4 rounded-lg"}`}>
                  <div className="text-xs text-gray-500 mb-1">{m.role === "assistant" ? "BizGPT" : "You"}</div>
                  <pre className="whitespace-pre-wrap text-sm font-sans">{m.text}</pre>
                </div>
              </div>
            ))}

            {loading && (
              <div className="text-gray-500">Generating •••</div>
            )}
          </div>
        </section>

        <footer className="p-4 border-t border-gray-200">
          <div className="max-w-4xl mx-auto text-xs text-gray-500">This demo runs locally and simulates AI output. Replace the mock generator with your AI backend (OpenAI, Claude, etc.) for real results.</div>
        </footer>
      </main>
    </div>
  );
}

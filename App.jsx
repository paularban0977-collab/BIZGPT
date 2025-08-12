import React, { useEffect, useState } from 'react';

const FB_SDK_URL = 'https://connect.facebook.net/en_US/sdk.js';

function loadFacebookSdk(appId) {
  return new Promise((resolve) => {
    if (window.FB) return resolve(window.FB);
    const s = document.createElement('script');
    s.src = FB_SDK_URL;
    s.async = true;
    s.onload = () => {
      window.FB.init({
        appId: appId,
        cookie: true,
        xfbml: true,
        version: 'v16.0',
      });
      resolve(window.FB);
    };
    document.body.appendChild(s);
  });
}

export default function App() {
  const modes = [
    { id: 'research', title: 'Business Research' },
    { id: 'feasibility', title: 'Feasibility Study' },
    { id: 'theory', title: 'Business Theories' },
    { id: 'pitch', title: 'Pitch Deck' },
    { id: 'case', title: 'Case Study' },
  ];

  const [selectedMode, setSelectedMode] = useState(modes[0].id);
  const [input, setInput] = useState('');
  const [conversation, setConversation] = useState([]);
  const [loading, setLoading] = useState(false);
  const [jwt, setJwt] = useState(localStorage.getItem('bizgpt_jwt') || null);
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('bizgpt_user') || 'null'));

  useEffect(() => {
    // load FB SDK with production app id placeholder (set via env when deploying)
    const appId = import.meta.env.VITE_FACEBOOK_APP_ID || '';
    if (appId) {
      loadFacebookSdk(appId).then(() => console.log('FB SDK loaded'));
    }
  }, []);

  function appendMessage(role, text) {
    setConversation((c) => [...c, { role, text, id: Date.now() + Math.random() }]);
  }

  async function handleSend(e) {
    e?.preventDefault();
    if (!input.trim()) return;
    const userText = input.trim();
    appendMessage('user', userText);
    setInput('');
    setLoading(true);
    try {
      const res = await fetch('http://localhost:4000/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(jwt ? { Authorization: 'Bearer ' + jwt } : {})
        },
        body: JSON.stringify({ mode: selectedMode, prompt: userText })
      });
      const data = await res.json();
      appendMessage('assistant', data.output || JSON.stringify(data));
    } catch (err) {
      appendMessage('assistant', 'Error connecting to backend');
    }
    setLoading(false);
  }

  async function fbLogin() {
    const appId = import.meta.env.VITE_FACEBOOK_APP_ID || '';
    if (!appId) {
      alert('Facebook App ID not configured in VITE_FACEBOOK_APP_ID');
      return;
    }
    const FB = await loadFacebookSdk(appId);
    FB.login(async (response) => {
      if (response.authResponse) {
        const access_token = response.authResponse.accessToken;
        // send token to backend to verify and get our JWT
        try {
          const res = await fetch('http://localhost:4000/api/auth/facebook', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ access_token })
          });
          const data = await res.json();
          if (data.token) {
            setJwt(data.token);
            setUser(data.user || null);
            localStorage.setItem('bizgpt_jwt', data.token);
            localStorage.setItem('bizgpt_user', JSON.stringify(data.user || null));
          } else {
            alert('Login failed');
          }
        } catch (err) {
          console.error(err);
          alert('Login error');
        }
      } else {
        alert('Facebook login was not completed');
      }
    }, { scope: 'email,public_profile' });
  }

  function logout() {
    setJwt(null);
    setUser(null);
    localStorage.removeItem('bizgpt_jwt');
    localStorage.removeItem('bizgpt_user');
  }

  return (
    <div className="min-h-screen bg-white text-black flex">
      <aside className="w-72 border-r p-4">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-gold to-yellow-500 flex items-center justify-center text-white font-bold">B</div>
          <div>
            <h1 className="font-bold text-lg">BizGPT</h1>
            <p className="text-xs text-gray-600">Business-only AI</p>
            {user ? <div className="text-xs mt-2">Signed in as <strong>{user.name}</strong></div> : null}
          </div>
        </div>
        <div className="mb-4">
          {user ? (
            <button onClick={logout} className="px-3 py-2 rounded bg-gray-100">Logout</button>
          ) : (
            <button onClick={fbLogin} className="px-3 py-2 rounded bg-blue-600 text-white">Login with Facebook</button>
          )}
        </div>
        {modes.map(m => (
          <button key={m.id} onClick={() => setSelectedMode(m.id)} className={`block w-full text-left px-3 py-2 rounded-md mb-2 ${selectedMode===m.id ? 'bg-black text-gold' : 'border border-gray-200'}`}>
            {m.title}
          </button>
        ))}
      </aside>

      <main className="flex-1 flex flex-col">
        <header className="p-4 border-b">
          <h2 className="text-xl font-bold">{modes.find(mm=>mm.id===selectedMode).title}</h2>
        </header>

        <section className="flex-1 p-4 overflow-auto space-y-4">
          {conversation.length===0 && <div className="text-gray-400 p-6 text-center">Start by typing a prompt for the selected mode.</div>}

          {conversation.map(m => (
            <div key={m.id} className={`${m.role==='user' ? 'text-right' : 'text-left'}`}>
              <div className={`inline-block px-4 py-2 rounded-lg ${m.role==='user' ? 'bg-black text-gold' : 'bg-yellow-50 border border-yellow-100'}`}>
                <pre className="whitespace-pre-wrap">{m.text}</pre>
              </div>
            </div>
          ))}

          {loading && <div className="text-gray-500">Generating…</div>}
        </section>

        <form onSubmit={handleSend} className="p-4 border-t flex gap-2">
          <input className="flex-1 px-3 py-2 border rounded" value={input} onChange={e=>setInput(e.target.value)} placeholder={`Prompt for ${selectedMode}`} />
          <button className="px-4 py-2 bg-black text-gold rounded">Send</button>
        </form>
      </main>
    </div>
  );
}

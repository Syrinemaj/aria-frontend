import { useState, useRef, useEffect, type FormEvent, type KeyboardEvent } from 'react';
import { AppLayout } from '../components/layout';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  ts: number;
}

const SUGGESTIONS = [
  'Summarise the security findings for Stripe Payment API',
  'What endpoints have the highest p95 latency?',
  'Generate an OpenAPI spec for the Auth Service',
  'Explain the BOLA vulnerability found in session s1',
];

const DEMO_RESPONSES: Record<string, string> = {
  default: `I'm ARIA's AI assistant. I can help you:

• **Analyse sessions** — summarise findings, explain issues, compare behaviour across sessions
• **Security deep-dives** — explain OWASP findings, suggest mitigations, estimate CVSS impact
• **Spec generation** — draft OpenAPI YAML from observed traffic patterns
• **MLOps insights** — explain model drift, recommend retraining schedules

Try one of the suggestions below, or ask me anything about your API traffic.`,
  security: `## Security findings for Stripe Payment API

I found **4 issues** across 47 endpoints:

**🔴 Critical — BOLA (API1:2023)**
\`GET /v1/payment_intents/{id}\` lacks object-level ownership checks. Any authenticated user can access arbitrary payment intents by guessing IDs.

**🟠 High — Missing Rate Limiting (API4:2023)**
\`POST /v1/charges\` has no rate limiting detected across 43 samples. Recommend: 10 req/min per IP, 100 req/day per API key.

**🟡 Medium — Verbose Errors (API8:2023)**
Stack traces and DB identifiers exposed on \`POST /v1/payment_intents\` 400 responses.

**⚪ Low — Security Headers**
Strict-Transport-Security and Content-Security-Policy missing on customer endpoints.

**Recommended priority:** Fix BOLA immediately — this is exploitable without authentication bypass.`,
  latency: `## Latency analysis

Highest p95 latency endpoints:

| Endpoint | p95 | Notes |
|---|---|---|
| POST /v1/payment_intents/{id}/confirm | 340ms | Possible sync payment processor call |
| POST /v1/payment_intents | 210ms | Schema validation overhead? |
| POST /v1/charges | 180ms | DB write + webhook dispatch |

**Anomaly detected:** \`POST /v1/charges\` is 23% slower than similar write endpoints. This pattern is consistent with an N+1 query — fetching related records in a loop rather than a single JOIN.

**Suggestion:** Add \`?expand[]=payment_method\` to avoid a secondary lookup if you control the client.`,
  openapi: `Here's a partial OpenAPI 3.1 spec for the Auth Service based on observed traffic:

\`\`\`yaml
openapi: 3.1.0
info:
  title: Auth Service
  version: 1.0.0
  description: Authentication and session management
paths:
  /auth/login:
    post:
      summary: Authenticate user
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [email, password]
              properties:
                email: { type: string, format: email }
                password: { type: string, minLength: 8 }
      responses:
        '200':
          description: JWT token pair
          content:
            application/json:
              schema:
                type: object
                properties:
                  access_token: { type: string }
                  refresh_token: { type: string }
                  expires_in: { type: integer }
\`\`\`

Confidence: 97% (based on 892 observed transactions). Full spec available via Export.`,
};

function pickResponse(msg: string): string {
  const l = msg.toLowerCase();
  if (l.includes('security') || l.includes('bola') || l.includes('vulnerability') || l.includes('owasp')) return DEMO_RESPONSES.security;
  if (l.includes('latency') || l.includes('p95') || l.includes('slow') || l.includes('performance')) return DEMO_RESPONSES.latency;
  if (l.includes('openapi') || l.includes('spec') || l.includes('yaml') || l.includes('generate')) return DEMO_RESPONSES.openapi;
  return DEMO_RESPONSES.default;
}

function MessageBubble({ msg }: { msg: Message }) {
  const isUser = msg.role === 'user';
  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      <div className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-xs font-bold ${isUser ? 'bg-gradient-to-br from-indigo-400 to-violet-500 text-white' : 'bg-gradient-to-br from-slate-700 to-slate-800 text-white'}`}>
        {isUser ? 'U' : 'AI'}
      </div>
      <div className={`max-w-[75%] ${isUser ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
        <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${isUser ? 'bg-gradient-to-r from-indigo-500 to-violet-500 text-white rounded-tr-sm' : 'bg-white border border-slate-100 shadow-sm text-slate-700 rounded-tl-sm'}`}>
          {isUser ? (
            <p>{msg.content}</p>
          ) : (
            <div className="space-y-2">
              {msg.content.split('\n').map((line, i) => {
                if (line.startsWith('## ')) return <p key={i} className="font-bold text-slate-900 text-sm">{line.slice(3)}</p>;
                if (line.startsWith('**') && line.endsWith('**')) return <p key={i} className="font-semibold text-slate-800">{line.slice(2, -2)}</p>;
                if (line.startsWith('• ') || line.startsWith('* ')) return <p key={i} className="flex gap-2"><span className="text-indigo-400">•</span><span>{line.slice(2)}</span></p>;
                if (line.startsWith('```')) return null;
                if (line.startsWith('|')) {
                  const cells = line.split('|').filter(Boolean).map(c => c.trim());
                  return <div key={i} className="flex gap-3 font-mono text-xs bg-slate-50 rounded px-2 py-1">{cells.map((c, j) => <span key={j} className="flex-1">{c}</span>)}</div>;
                }
                if (line.trim() === '---' || line.match(/^\|[-\s|]+\|$/)) return null;
                if (line.trim() === '') return <div key={i} className="h-1" />;
                // inline bold
                const parts = line.split(/(\*\*[^*]+\*\*)/g);
                return (
                  <p key={i}>
                    {parts.map((p, j) =>
                      p.startsWith('**') && p.endsWith('**')
                        ? <strong key={j}>{p.slice(2, -2)}</strong>
                        : p
                    )}
                  </p>
                );
              })}
            </div>
          )}
        </div>
        <span className="text-[10px] text-slate-400 px-1">
          {new Date(msg.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </div>
  );
}

export default function ChatbotPage() {
  const [messages, setMessages] = useState<Message[]>([
    { id: '0', role: 'assistant', content: DEMO_RESPONSES.default, ts: Date.now() - 5000 },
  ]);
  const [input, setInput]   = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function send(text: string) {
    if (!text.trim() || loading) return;
    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: text.trim(), ts: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    await new Promise(r => setTimeout(r, 900 + Math.random() * 400));
    const reply: Message = { id: (Date.now() + 1).toString(), role: 'assistant', content: pickResponse(text), ts: Date.now() };
    setMessages(prev => [...prev, reply]);
    setLoading(false);
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    send(input);
  }

  function handleKey(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input); }
  }

  return (
    <AppLayout title="AI Chat">
      <div className="flex flex-col h-[calc(100vh-8rem)] max-w-3xl mx-auto">
        {/* Chat area */}
        <div className="flex-1 overflow-y-auto space-y-4 py-2 pr-1">
          {messages.map(m => <MessageBubble key={m.id} msg={m} />)}
          {loading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center text-white text-xs font-bold shrink-0">AI</div>
              <div className="bg-white border border-slate-100 shadow-sm px-4 py-3 rounded-2xl rounded-tl-sm flex gap-1.5 items-center">
                {[0, 1, 2].map(i => (
                  <span key={i} className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: `${i * 150}ms` }} />
                ))}
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Suggestions (shown when only the welcome message exists) */}
        {messages.length === 1 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 py-3">
            {SUGGESTIONS.map(s => (
              <button
                key={s}
                onClick={() => send(s)}
                className="text-left px-4 py-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-600 hover:border-indigo-300 hover:bg-indigo-50/50 hover:text-indigo-700 transition-all"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <form onSubmit={handleSubmit} className="border-t border-slate-100 pt-4">
          <div className="flex gap-3 items-end bg-white border border-slate-200 rounded-2xl p-3 focus-within:ring-2 focus-within:ring-indigo-500/30 focus-within:border-indigo-400 transition-all shadow-sm">
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Ask about your API sessions, security findings, or spec generation…"
              rows={1}
              className="flex-1 resize-none bg-transparent text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none max-h-40 leading-relaxed"
              style={{ height: 'auto' }}
              onInput={e => {
                const el = e.currentTarget;
                el.style.height = 'auto';
                el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
              }}
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="w-9 h-9 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 text-white flex items-center justify-center hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
            >
              <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
            </button>
          </div>
          <p className="text-center text-[10px] text-slate-400 mt-2">Press Enter to send · Shift+Enter for new line</p>
        </form>
      </div>
    </AppLayout>
  );
}

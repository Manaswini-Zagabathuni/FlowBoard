import { Database } from 'lucide-react';

export function SetupScreen() {
  return (
    <div className="setup-screen">
      <div className="setup-icon">
        <Database size={28} />
      </div>
      <h1>Connect Your Database</h1>
      <p>
        FlowBoard needs a Supabase project to store your tasks. 
        Create a free project at <strong>supabase.com</strong>, then add your credentials below.
      </p>

      <div className="setup-code">
        <div><span className="key">1.</span> Create a <code>.env</code> file in your project root:</div>
        <br />
        <div><span className="key">VITE_SUPABASE_URL</span>=<span className="val">https://xxx.supabase.co</span></div>
        <div><span className="key">VITE_SUPABASE_ANON_KEY</span>=<span className="val">eyJhbGci...</span></div>
        <br />
        <div><span className="key">2.</span> Run the SQL schema in your Supabase SQL editor</div>
        <div><span className="key">3.</span> Restart <code>npm run dev</code></div>
      </div>

      <p style={{ fontSize: 13 }}>
        See <strong>README.md</strong> for the full setup guide and SQL schema.
      </p>
    </div>
  );
}

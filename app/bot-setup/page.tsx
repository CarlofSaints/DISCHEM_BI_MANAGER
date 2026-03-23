'use client';
import { useState } from 'react';

// ── Helpers ────────────────────────────────────────────────────────────────────
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  return (
    <button
      onClick={copy}
      className="ml-2 px-2 py-0.5 text-xs rounded border border-slate-300 text-slate-500 hover:border-[#FC5424] hover:text-[#FC5424] transition-colors"
    >
      {copied ? '✓ Copied' : 'Copy'}
    </button>
  );
}

function Code({ children }: { children: string }) {
  return (
    <div className="flex items-center bg-slate-900 rounded-lg px-4 py-2.5 mt-2">
      <code className="text-green-400 text-sm font-mono flex-1">{children}</code>
      <CopyButton text={children} />
    </div>
  );
}

function StepBadge({ n, done }: { n: number; done: boolean }) {
  return (
    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
      done ? 'bg-green-500 text-white' : 'bg-[#FC5424] text-white'
    }`}>
      {done ? '✓' : n}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function BotSetupPage() {
  const [botPath, setBotPath] = useState('');
  const [downloaded, setDownloaded] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const pathReady = botPath.trim().length > 3;

  function downloadScript() {
    const p = botPath.trim().replace(/[/\\]+$/, ''); // strip trailing slash
    const script = [
      '@echo off',
      'echo.',
      'echo  ============================================',
      'echo   Dis-Chem BI Bot — PM2 Background Setup',
      'echo  ============================================',
      'echo.',
      '',
      'echo [1/4] Installing PM2 (background process manager)...',
      'call npm install -g pm2',
      'if %ERRORLEVEL% NEQ 0 (',
      '  echo ERROR: npm install failed. Make sure Node.js is installed.',
      '  pause & exit /b 1',
      ')',
      'echo.',
      '',
      `echo [2/4] Starting bot from: ${p}`,
      `call pm2 start "${p}\\src\\scheduler.js" --name dischem-bot`,
      'if %ERRORLEVEL% NEQ 0 (',
      '  echo ERROR: Could not start bot. Check the folder path is correct.',
      '  pause & exit /b 1',
      ')',
      'echo.',
      '',
      'echo [3/4] Saving process list...',
      'call pm2 save',
      'echo.',
      '',
      'echo [4/4] Configuring auto-start on Windows boot...',
      'call pm2 startup',
      'echo.',
      'echo  If you see a command above starting with "pm2 startup"',
      'echo  copy it and run it in a NEW Command Prompt as Administrator.',
      'echo.',
      'echo ============================================',
      'echo  Done! The bot is now running in the background.',
      'echo  It will start automatically every time Windows boots.',
      'echo ============================================',
      'echo.',
      'echo  Useful commands:',
      'echo    pm2 status          - check the bot is running',
      'echo    pm2 logs dischem-bot - view recent activity',
      'echo    pm2 restart dischem-bot - apply config changes',
      'echo    pm2 stop dischem-bot    - stop the bot',
      'echo.',
      'pause',
    ].join('\r\n');

    const blob = new Blob([script], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'setup-dischem-bot.bat';
    a.click();
    URL.revokeObjectURL(url);
    setDownloaded(true);
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">

      {/* Title */}
      <div>
        <h1 className="text-xl font-bold text-slate-800">Bot Setup</h1>
        <p className="text-sm text-slate-500 mt-1">Get the export bot running silently in the background on your PC.</p>
      </div>

      {/* Why card */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
        <p className="text-sm font-semibold text-amber-900 mb-1">Why you need this</p>
        <p className="text-sm text-amber-800 leading-relaxed">
          By default, the bot only runs while a <strong>Command Prompt window is open</strong> on your PC.
          Close it, and exports stop. This setup installs <strong>PM2</strong> — a lightweight background
          service that keeps the bot running automatically, even after your PC restarts, with no open
          windows needed.
        </p>
      </div>

      {/* Step 1 — prerequisites */}
      <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
        <div className="flex items-center gap-3">
          <StepBadge n={1} done={false} />
          <h2 className="font-semibold text-slate-800">Before you start</h2>
        </div>

        <div className="space-y-3">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">1a — Install Node.js</p>
          <p className="text-sm text-slate-600 leading-relaxed">
            The bot requires <strong>Node.js</strong>. If you haven&apos;t installed it yet, download and install
            it from <strong>nodejs.org</strong> (choose the LTS version). Once installed, open a new
            Command Prompt and run:
          </p>
          <Code>node -v</Code>
          <p className="text-sm text-slate-600">
            You should see a version number like <code className="bg-slate-100 px-1 rounded text-xs">v22.x.x</code>.
            If you get an error, Node.js is not installed correctly.
          </p>
        </div>

        <div className="border-t border-gray-100 pt-4 space-y-3">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">1b — Set up the bot folder</p>
          <p className="text-sm text-slate-600 leading-relaxed">
            You should have a folder called <strong>dischem-bot</strong> on this PC. Open Command Prompt,
            navigate into that folder, and install its dependencies:
          </p>
          <Code>cd C:\path\to\dischem-bot</Code>
          <Code>npm install</Code>
          <p className="text-sm text-slate-600 leading-relaxed mt-1">
            The folder also needs a <code className="bg-slate-100 px-1 rounded text-xs">.env</code> file
            with your configuration (API URL, credentials, etc.). Contact your administrator if you don&apos;t have this file.
          </p>
        </div>

        <div className="border-t border-gray-100 pt-4 space-y-3">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">1c — Verify everything works</p>
          <p className="text-sm text-slate-600 leading-relaxed">
            From <strong>inside the dischem-bot folder</strong>, run:
          </p>
          <Code>npm run schedule</Code>
          <p className="text-sm text-slate-600">
            You should see the bot start up and begin listening for schedules.
            Press <code className="bg-slate-100 px-1 rounded text-xs">Ctrl+C</code> to stop it — this is just a test.
            If this works, you&apos;re ready for the next step.
          </p>
        </div>
      </div>

      {/* Step 2 — enter path + download */}
      <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
        <div className="flex items-center gap-3">
          <StepBadge n={2} done={downloaded} />
          <h2 className="font-semibold text-slate-800">Enter your bot folder path and download the setup script</h2>
        </div>

        <div className="space-y-2">
          <p className="text-sm text-slate-600 leading-relaxed">
            In the <strong>same Command Prompt</strong> where you ran <code className="bg-slate-100 px-1 rounded text-xs">npm install</code> in Step 1b, run this:
          </p>
          <Code>cd</Code>
          <p className="text-sm text-slate-600 leading-relaxed">
            It will print the full path to the dischem-bot folder. Copy it and paste it below.
          </p>
          <input
            className="input"
            placeholder="e.g.  C:\Users\Carl\dischem-bot"
            value={botPath}
            onChange={(e) => setBotPath(e.target.value)}
          />
        </div>

        <div className={`space-y-2 border-t border-gray-100 pt-4 ${!pathReady ? 'opacity-40 pointer-events-none' : ''}`}>
          <p className="text-sm text-slate-600 leading-relaxed">
            Once you&apos;ve entered the path above, click below to download a setup script that is
            customised for your folder. It will install PM2, start the bot, and configure it to
            auto-start every time Windows boots — no open windows needed.
          </p>
          <button
            onClick={downloadScript}
            disabled={!pathReady}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#FC5424] hover:bg-[#E34C20] text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-40"
          >
            <span>↓</span>
            <span>Download setup-dischem-bot.bat</span>
          </button>
          {downloaded && (
            <p className="text-xs text-green-600 font-medium">✓ Downloaded — check your Downloads folder.</p>
          )}
        </div>
      </div>

      {/* Step 3 — run the script */}
      <div className={`bg-white rounded-xl shadow-sm p-6 space-y-3 ${!downloaded ? 'opacity-50 pointer-events-none' : ''}`}>
        <div className="flex items-center gap-3">
          <StepBadge n={3} done={confirmed} />
          <h2 className="font-semibold text-slate-800">Run the script</h2>
        </div>
        <ol className="text-sm text-slate-600 space-y-2 list-none">
          <li className="flex gap-2"><span className="font-bold text-[#FC5424]">1.</span> Find <strong>setup-dischem-bot.bat</strong> in your Downloads folder.</li>
          <li className="flex gap-2"><span className="font-bold text-[#FC5424]">2.</span> Right-click it → <strong>Run as Administrator</strong>.</li>
          <li className="flex gap-2"><span className="font-bold text-[#FC5424]">3.</span> A black window will open — wait for it to finish (takes about 30 seconds).</li>
          <li className="flex gap-2"><span className="font-bold text-[#FC5424]">4.</span> You should see <em>&quot;Done! The bot is now running in the background.&quot;</em></li>
        </ol>
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800">
          <strong>Important:</strong> The script may print a long command starting with{' '}
          <code className="bg-amber-100 px-0.5 rounded">pm2 startup windows</code>. If it does,
          copy that entire command, open a <strong>new</strong> Command Prompt as Administrator,
          paste it in, and press Enter. This is what locks in the auto-start on boot.
        </div>
        <label className="flex items-center gap-2 cursor-pointer pt-1">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
            className="w-4 h-4 accent-[#FC5424]"
          />
          <span className="text-sm text-slate-700">I ran the script and saw &quot;Done!&quot;</span>
        </label>
      </div>

      {/* Step 4 — verify */}
      <div className={`bg-white rounded-xl shadow-sm p-6 space-y-3 ${!confirmed ? 'opacity-50 pointer-events-none' : ''}`}>
        <div className="flex items-center gap-3">
          <StepBadge n={4} done={false} />
          <h2 className="font-semibold text-slate-800">Verify it&apos;s running</h2>
        </div>
        <p className="text-sm text-slate-600">
          Open Command Prompt (you don&apos;t need Administrator this time) and run:
        </p>
        <Code>pm2 status</Code>
        <p className="text-sm text-slate-600 mt-2">
          You should see <strong>dischem-bot</strong> listed with status{' '}
          <span className="text-green-600 font-semibold">online</span>.
        </p>

        <div className="border-t border-gray-100 pt-4 space-y-2">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Useful commands</p>
          <Code>pm2 logs dischem-bot</Code>
          <p className="text-xs text-slate-400 -mt-1 mb-2">View recent bot activity and any errors.</p>
          <Code>pm2 restart dischem-bot</Code>
          <p className="text-xs text-slate-400 -mt-1 mb-2">Apply changes after editing the .env file or updating the bot.</p>
          <Code>pm2 stop dischem-bot</Code>
          <p className="text-xs text-slate-400 -mt-1">Pause the bot temporarily.</p>
        </div>
      </div>

      {/* All done banner */}
      {confirmed && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-5 text-center">
          <p className="text-green-800 font-semibold text-sm">
            The bot is running in the background — no Command Prompt needed.
          </p>
          <p className="text-green-700 text-xs mt-1">
            It will auto-start every time Windows boots and pick up scheduled exports + manual Run Now triggers automatically.
          </p>
        </div>
      )}

    </div>
  );
}

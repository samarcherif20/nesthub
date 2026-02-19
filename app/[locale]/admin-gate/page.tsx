"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { 
  Shield, 
  Lock, 
  Unlock, 
  AlertTriangle, 
  Activity, 
  Globe, 
  Cpu,
  RefreshCw,
  Fingerprint,
  Radio,
  Zap,
  Skull,
  Terminal,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Info
} from "lucide-react";

// Color palette from Couleurs.txt - EXACT MATCH
const COLORS = {
  electricBlue: "#1E5BFF",     // Used on central parts and circuits
  cyanLight: "#4CC9F0",         // For light reflections
  mediumBlue: "#2F7BFF",        // Intermediate gradient
  purpleBlue: "#5A4BFF",        // Upper part of dome
  deepPurple: "#3E2FBF",        // Shadows and darker areas
  pureWhite: "#FFFFFF",         // Windows + inner circle background
  circleBlue: "#2A56D6"         // Circle outline
};

// Alert types for professional notifications
type AlertType = 'success' | 'error' | 'warning' | 'info' | null;

interface Alert {
  type: AlertType;
  title: string;
  message: string;
  icon: React.ReactNode;
}

export default function AdminGatePage() {
  const t = useTranslations("adminGate");
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const key = searchParams.get("key");

  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [attempts, setAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [lockTimeLeft, setLockTimeLeft] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [glitchEffect, setGlitchEffect] = useState(false);
  const [activeSymbol, setActiveSymbol] = useState<number | null>(null);
  const [alert, setAlert] = useState<Alert | null>(null);
  const [showTerminal, setShowTerminal] = useState(true);
  const [terminalMessages, setTerminalMessages] = useState<string[]>([
    "> SECURE GATEWAY v3.2.1 INITIALIZED",
    "> LOADING ENCRYPTION MODULES...",
    "> ESTABLISHING SECURE CHANNEL...",
    "> AWAING AUTHORIZATION SEQUENCE..."
  ]);

  const MAX_ATTEMPTS = 3;
  const LOCK_DURATION = 300; // 5 minutes in seconds

  // Symbols for the circular dial
  const symbols = [
    "Θ", "Ξ", "Ψ", "Ω",
    "7", "Σ", "Δ", "Φ",
    "B", "Λ", "Π", "Γ",
    "9", "Z", "X", "V"
  ];

  // Professional alert function
  const showAlert = (type: AlertType, title: string, message: string) => {
    let icon;
    switch(type) {
      case 'success':
        icon = <CheckCircle2 className="w-5 h-5" />;
        break;
      case 'error':
        icon = <XCircle className="w-5 h-5" />;
        break;
      case 'warning':
        icon = <AlertTriangle className="w-5 h-5" />;
        break;
      case 'info':
        icon = <Info className="w-5 h-5" />;
        break;
      default:
        icon = null;
    }
    
    setAlert({ type, title, message, icon });
    
    // Auto-hide after 5 seconds for non-error alerts
    if (type !== 'error') {
      setTimeout(() => setAlert(null), 5000);
    }
  };

  // Check rate limit on mount
  useEffect(() => {
    checkRateLimit();
  }, []);

  // Lock countdown timer
  useEffect(() => {
    if (!isLocked || lockTimeLeft <= 0) return;

    const timer = setInterval(() => {
      setLockTimeLeft((prev) => {
        if (prev <= 1) {
          setIsLocked(false);
          setAttempts(0);
          showAlert('info', 'SYSTEM UNLOCKED', 'Cool-down period expired. You may attempt again.');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isLocked, lockTimeLeft]);

  // Add terminal message periodically
  useEffect(() => {
    if (isLocked || success) return;
    
    const interval = setInterval(() => {
      const messages = [
        "> SCANNING NEURAL PATTERNS...",
        `> ATTEMPT COUNTER: ${attempts}/${MAX_ATTEMPTS}`,
        "> ENCRYPTION LAYER: ACTIVE",
        "> TUNISIA NODE: ONLINE",
        "> CIRCUIT INTEGRITY: 100%",
        "> AWAITING DIAL SEQUENCE..."
      ];
      
      setTerminalMessages(prev => {
        const newMsg = messages[Math.floor(Math.random() * messages.length)];
        return [...prev.slice(-4), newMsg];
      });
    }, 4000);

    return () => clearInterval(interval);
  }, [attempts, isLocked, success]);

  const checkRateLimit = async () => {
    try {
      const res = await fetch("/api/admin/rate-limit");
      const data = await res.json();
      
      setAttempts(data.attempts);
      setIsLocked(data.locked);
      if (data.locked && data.remainingLockTime) {
        setLockTimeLeft(Math.ceil(data.remainingLockTime / 1000));
        showAlert('error', 'SYSTEM LOCKED', `Maximum attempts exceeded. Cool-down: ${formatTime(Math.ceil(data.remainingLockTime / 1000))}`);
      }
    } catch (err) {
      console.error("Rate limit check failed", err);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const handleSymbolClick = (symbol: string, index: number) => {
    if (isLocked || loading || success) return;
    
    setActiveSymbol(index);
    setTimeout(() => setActiveSymbol(null), 200);
    
    // Find next empty slot
    const emptyIndex = code.findIndex(digit => digit === "");
    if (emptyIndex !== -1) {
      const newCode = [...code];
      newCode[emptyIndex] = symbol;
      setCode(newCode);
      
      // Add to terminal
      setTerminalMessages(prev => [
        ...prev.slice(-4),
        `> DIAL INPUT: [${symbol}] - POSITION ${emptyIndex + 1}/6`
      ]);
    }
  };

  const handleClear = () => {
    setCode(["", "", "", "", "", ""]);
    setTerminalMessages(prev => [...prev.slice(-4), "> SEQUENCE CLEARED - RE-INITIALIZING"]);
    showAlert('info', 'SEQUENCE RESET', 'Dial sequence has been cleared. Please re-enter the code.');
  };

  const triggerGlitch = () => {
    setGlitchEffect(true);
    setTimeout(() => setGlitchEffect(false), 200);
  };

  const submit = async () => {
    if (isLocked || loading) return;

    const fullCode = code.join("");
    if (fullCode.length !== 6) {
      setError("Incomplete sequence");
      showAlert('warning', 'INCOMPLETE SEQUENCE', 'Please enter all 6 symbols before confirming.');
      triggerGlitch();
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Record attempt
      const rateRes = await fetch("/api/admin/rate-limit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "record-attempt" }),
      });

      const rateData = await rateRes.json();
      setAttempts(rateData.attempts);
      
      // Professional alert for attempt count
      const remaining = MAX_ATTEMPTS - rateData.attempts;
      if (rateData.attempts === 1) {
        showAlert('warning', `ATTEMPT 1/${MAX_ATTEMPTS}`, `Invalid code. ${remaining} attempt${remaining > 1 ? 's' : ''} remaining.`);
      } else if (rateData.attempts === 2) {
        showAlert('warning', `ATTEMPT 2/${MAX_ATTEMPTS} - FINAL WARNING`, `Last attempt before system lockdown. Verify your credentials.`);
      }

      setTerminalMessages(prev => [...prev.slice(-4), `> ATTEMPT ${rateData.attempts}/${MAX_ATTEMPTS} RECORDED`]);

      if (rateData.locked) {
        setIsLocked(true);
        setLockTimeLeft(LOCK_DURATION);
        setLoading(false);
        triggerGlitch();
        showAlert('error', 'SYSTEM LOCKDOWN', `Maximum attempts (${MAX_ATTEMPTS}) exceeded. Cool-down: 5 minutes.`);
        setTerminalMessages(prev => [...prev.slice(-4), "> ⚠ CRITICAL: SYSTEM LOCKDOWN INITIATED"]);
        return;
      }

      // Verify code
      const verifyRes = await fetch("/api/admin/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: fullCode, key }),
      });

      if (verifyRes.ok) {
        setSuccess(true);
        showAlert('success', 'ACCESS GRANTED', 'Authentication successful. Redirecting to secure portal...');
        setTerminalMessages(prev => [...prev.slice(-4), "> ✓ ACCESS GRANTED - WELCOME BACK"]);
        setTimeout(() => {
          router.push(`/${locale}/admin/login?key=${key}`);
        }, 2000);
      } else {
        setError("Invalid code");
        setCode(["", "", "", "", "", ""]);
        triggerGlitch();
        
        if (rateData.remaining === 0) {
          setIsLocked(true);
          setLockTimeLeft(LOCK_DURATION);
          showAlert('error', 'SYSTEM LOCKDOWN', `Maximum attempts (${MAX_ATTEMPTS}) exceeded. Cool-down: 5 minutes.`);
          setTerminalMessages(prev => [...prev.slice(-4), "> ⚠ CRITICAL: SYSTEM LOCKDOWN INITIATED"]);
        } else {
          setTerminalMessages(prev => [...prev.slice(-4), `> ✗ ACCESS DENIED - ${rateData.remaining} ATTEMPT(S) REMAINING`]);
        }
      }
    } catch (err) {
      setError("Authentication failed");
      showAlert('error', 'SYSTEM ERROR', 'Unable to verify credentials. Please try again.');
      triggerGlitch();
    } finally {
      setLoading(false);
    }
  };

  // Get color based on attempt count
  const getAttemptColor = () => {
    if (attempts === 0) return COLORS.cyanLight;
    if (attempts === 1) return "#FFA500"; // Orange
    if (attempts === 2) return "#FF4444"; // Red
    return COLORS.cyanLight;
  };

  return (
    <div className="min-h-screen bg-[#0a0f0f] text-white font-['Space_Grotesk',sans-serif] relative overflow-hidden">
      {/* Professional Alert Component */}
      {alert && (
        <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 min-w-[400px] animate-in slide-in-from-top fade-in duration-300`}>
          <div className={`
            rounded-lg border-l-4 shadow-2xl backdrop-blur-md
            ${alert.type === 'success' ? 'bg-emerald-500/10 border-emerald-500' : ''}
            ${alert.type === 'error' ? 'bg-red-500/10 border-red-500' : ''}
            ${alert.type === 'warning' ? 'bg-orange-500/10 border-orange-500' : ''}
            ${alert.type === 'info' ? 'bg-blue-500/10 border-blue-500' : ''}
            bg-[#0a0f0f]/90
          `}>
            <div className="flex items-start gap-4 p-4">
              <div className={`
                ${alert.type === 'success' ? 'text-emerald-500' : ''}
                ${alert.type === 'error' ? 'text-red-500' : ''}
                ${alert.type === 'warning' ? 'text-orange-500' : ''}
                ${alert.type === 'info' ? 'text-blue-500' : ''}
              `}>
                {alert.icon}
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-sm tracking-wider mb-1">{alert.title}</h4>
                <p className="text-xs text-gray-400">{alert.message}</p>
              </div>
              <button 
                onClick={() => setAlert(null)}
                className="text-gray-500 hover:text-white transition-colors"
              >
                <XCircle className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Background Effects - Using actual colors from palette */}
      <div 
        className="fixed inset-0 z-0 opacity-30"
        style={{
          background: `radial-gradient(circle at 30% 50%, ${COLORS.electricBlue}15 0%, transparent 50%),
                      radial-gradient(circle at 70% 30%, ${COLORS.purpleBlue}15 0%, transparent 50%),
                      radial-gradient(circle at 50% 80%, ${COLORS.deepPurple}15 0%, transparent 50%)`
        }}
      />

      {/* Data Stream Overlays */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden opacity-20">
        <div className="absolute top-10 left-10 text-[10px] space-y-1 font-mono tracking-widest" style={{ color: COLORS.cyanLight }}>
          <p>LAT: 33.8869° N</p>
          <p>LONG: 9.5375° E</p>
          <p>SIG_STRENGTH: 98%</p>
          <p>ENC_TYPE: AES-512-GCM</p>
        </div>
        <div className="absolute bottom-10 right-10 text-[10px] space-y-1 font-mono text-right tracking-widest" style={{ color: `${COLORS.cyanLight}99` }}>
          <p>NODE_ID: TN-NORTH-01</p>
          <p>AUTH_PROTOCOL: CIRCULAR_DIAL_V3</p>
          <p>STATUS: {isLocked ? 'LOCKED' : 'ACTIVE'}</p>
          <p>ATTEMPTS: {attempts}/{MAX_ATTEMPTS}</p>
        </div>
      </div>

      {/* Main Content Container */}
      <div className="relative z-10 flex flex-col h-screen">
        {/* Top Navigation */}
        <header className="flex items-center justify-between px-10 py-6 border-b border-white/5 bg-[#0a0f0f]/40 backdrop-blur-md">
          <div className="flex items-center gap-4">
            <div style={{ color: COLORS.cyanLight }}>
              <Shield className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold tracking-tight text-white uppercase">
              NESTHUB <span style={{ color: COLORS.cyanLight }}>ADMIN</span>
            </h2>
          </div>
          <div className="flex items-center gap-8">
            <nav className="hidden md:flex gap-8 text-xs font-semibold tracking-widest text-slate-400">
              <a className="hover:transition-colors" style={{ hover: { color: COLORS.cyanLight } }} href="#">DIAGNOSTICS</a>
              <a className="hover:transition-colors" style={{ hover: { color: COLORS.cyanLight } }} href="#">SECURITY LOGS</a>
              <a className="hover:transition-colors" style={{ hover: { color: COLORS.cyanLight } }} href="#">BYPASS</a>
            </nav>
            <div className="h-8 w-[1px] bg-white/10 mx-2" />
            <button 
              onClick={() => setShowTerminal(!showTerminal)}
              className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold tracking-widest transition-all"
              style={{ 
                backgroundColor: `${COLORS.cyanLight}10`,
                borderColor: `${COLORS.cyanLight}20`,
                color: COLORS.cyanLight,
                border: '1px solid'
              }}
            >
              <Terminal className="w-4 h-4" />
              {showTerminal ? 'HIDE' : 'SHOW'} TERMINAL
            </button>
          </div>
        </header>

        {/* Main Interface Area */}
        <main className="flex-1 flex flex-col items-center justify-center relative p-8">
          {/* Interface Header */}
          <div className="absolute top-12 text-center space-y-2">
            <h1 className="text-4xl font-bold tracking-[0.2em] text-white">SECURE GATEWAY</h1>
            <p className="text-sm tracking-widest uppercase animate-pulse" style={{ color: `${COLORS.cyanLight}99` }}>
              LEVEL 5 AUTHORIZATION REQUIRED
            </p>
          </div>

          {/* Lock Overlay */}
          {isLocked && (
            <div className="absolute inset-0 z-30 flex items-center justify-center bg-[#0a0f0f]/90 backdrop-blur-sm">
              <div className="text-center">
                <div className="relative">
                  <Skull className="w-20 h-20 mx-auto mb-6 animate-pulse" style={{ color: COLORS.deepPurple }} />
                  <Lock className="w-8 h-8 absolute top-6 right-1/2 translate-x-8 animate-bounce" style={{ color: COLORS.electricBlue }} />
                </div>
                <h3 className="text-2xl mb-2 tracking-widest font-bold" style={{ color: COLORS.electricBlue }}>
                  SYSTEM LOCKDOWN
                </h3>
                <div className="text-6xl font-mono mb-4 tracking-wider" style={{ color: COLORS.cyanLight }}>
                  {formatTime(lockTimeLeft)}
                </div>
                <p className="text-sm tracking-wider" style={{ color: `${COLORS.cyanLight}99` }}>
                  MAXIMUM ATTEMPTS EXCEEDED
                </p>
                <p className="text-xs mt-4" style={{ color: `${COLORS.cyanLight}60` }}>
                  COOL-DOWN PERIOD: 5 MINUTES
                </p>
              </div>
            </div>
          )}

          {/* Success Overlay */}
          {success && (
            <div className="absolute inset-0 z-30 flex items-center justify-center bg-[#0a0f0f]/90 backdrop-blur-sm">
              <div className="text-center">
                <div className="relative">
                  <Unlock className="w-20 h-20 mx-auto mb-6" style={{ color: COLORS.cyanLight }} />
                  <CheckCircle2 className="w-8 h-8 absolute top-6 right-1/2 translate-x-8" style={{ color: COLORS.electricBlue }} />
                </div>
                <h3 className="text-2xl mb-2 tracking-widest font-bold" style={{ color: COLORS.cyanLight }}>
                  ACCESS GRANTED
                </h3>
                <p className="text-sm tracking-wider" style={{ color: `${COLORS.cyanLight}99` }}>
                  WELCOME BACK, ADMINISTRATOR
                </p>
                <div className="mt-6 flex justify-center gap-1">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: COLORS.cyanLight }} />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* The Circular Command Dial */}
          <div className={`relative flex items-center justify-center size-[500px] md:size-[600px] transition-all duration-200 ${glitchEffect ? 'translate-x-1 skew-x-6' : ''}`}>
            {/* Outer Ring Layers with actual colors */}
            <div className="absolute inset-0 rounded-full border animate-[spin_60s_linear_infinite]" style={{ borderColor: `${COLORS.cyanLight}20` }}>
              <div className="absolute -top-2 left-1/2 -translate-x-1/2 size-4 rounded-full blur-[2px]" style={{ backgroundColor: COLORS.cyanLight }} />
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 size-4 rounded-full blur-[2px]" style={{ backgroundColor: COLORS.cyanLight }} />
            </div>
            <div className="absolute inset-8 rounded-full border-2 border-dashed animate-[spin_40s_linear_infinite_reverse]" style={{ borderColor: `${COLORS.cyanLight}30` }} />

            {/* Interactive Main Dial Ring */}
            <div 
              className="absolute inset-16 rounded-full bg-gradient-to-b flex items-center justify-center border-[12px] shadow-[0_0_50px_rgba(30,91,255,0.2)]"
              style={{ 
                backgroundImage: `linear-gradient(to bottom, ${COLORS.circleBlue}, ${COLORS.deepPurple})`,
                borderColor: COLORS.circleBlue
              }}
            >
              {/* Segmented Symbols Ring */}
              <div className="absolute inset-4 grid grid-cols-4 grid-rows-4 gap-2">
                {symbols.map((symbol, index) => (
                  <button
                    key={index}
                    onClick={() => handleSymbolClick(symbol, index)}
                    disabled={isLocked || loading || success}
                    className={`
                      flex items-center justify-center rounded-xl transition-all duration-150
                      disabled:opacity-30 disabled:cursor-not-allowed
                      ${activeSymbol === index ? 'scale-95' : ''}
                    `}
                    style={{
                      backgroundColor: code.includes(symbol) 
                        ? `${COLORS.cyanLight}20`
                        : `${COLORS.cyanLight}10`,
                      border: code.includes(symbol) 
                        ? `2px solid ${COLORS.cyanLight}`
                        : 'none',
                      color: activeSymbol === index 
                        ? '#0a0f0f'
                        : code.includes(symbol)
                        ? COLORS.cyanLight
                        : COLORS.cyanLight
                    }}
                    onMouseEnter={(e) => {
                      if (!code.includes(symbol)) {
                        e.currentTarget.style.backgroundColor = COLORS.cyanLight;
                        e.currentTarget.style.color = '#0a0f0f';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!code.includes(symbol)) {
                        e.currentTarget.style.backgroundColor = `${COLORS.cyanLight}10`;
                        e.currentTarget.style.color = COLORS.cyanLight;
                      }
                    }}
                  >
                    <span className="text-xl font-bold">{symbol}</span>
                  </button>
                ))}
              </div>

              {/* Center Core */}
              <div 
                className="relative size-40 rounded-full border-4 flex flex-col items-center justify-center overflow-hidden z-20"
                style={{ 
                  backgroundColor: '#0a0f0f',
                  borderColor: `${COLORS.cyanLight}50`
                }}
              >
                <div className="absolute inset-0 flex items-center justify-center" style={{ backgroundColor: `${COLORS.cyanLight}05` }}>
                  <div className="size-32 rounded-full border animate-pulse" style={{ borderColor: `${COLORS.cyanLight}30` }} />
                </div>
                
                <span className="text-[10px] tracking-widest font-bold mb-1 opacity-60" style={{ color: COLORS.cyanLight }}>
                  SEQUENCE
                </span>
                
                {/* Attempt indicators */}
                <div className="flex gap-2">
                  {[...Array(MAX_ATTEMPTS)].map((_, i) => (
                    <div
                      key={i}
                      className="size-2 rounded-full transition-all duration-300"
                      style={{
                        backgroundColor: i < attempts 
                          ? i === 0 ? '#FFA500' : i === 1 ? '#FF4444' : COLORS.electricBlue
                          : `${COLORS.cyanLight}20`,
                        boxShadow: i < attempts ? `0 0 10px ${i === 0 ? '#FFA500' : i === 1 ? '#FF4444' : COLORS.electricBlue}` : 'none'
                      }}
                    />
                  ))}
                </div>

                {/* Code display */}
                <div className="mt-4 font-bold text-lg tracking-widest" style={{ color: COLORS.cyanLight }}>
                  {code.map((d, i) => d || '○').join(' ')}
                </div>

                {/* Warning indicator for last attempt */}
                {attempts === 2 && !isLocked && !success && (
                  <div className="absolute bottom-2 text-[8px] font-bold animate-pulse" style={{ color: '#FF4444' }}>
                    FINAL ATTEMPT
                  </div>
                )}
              </div>
            </div>

            {/* Orbiting HUD Elements */}
            <div className="absolute top-0 right-0 p-4 border rounded-xl bg-[#0a0f0f]/60 backdrop-blur-sm -translate-y-12 translate-x-12 hidden lg:block"
                 style={{ borderColor: `${COLORS.cyanLight}30` }}>
              <p className="text-[10px] font-mono" style={{ color: `${COLORS.cyanLight}99` }}>ENCRYPTION</p>
              <div className="w-32 h-1 mt-2 rounded-full overflow-hidden" style={{ backgroundColor: `${COLORS.cyanLight}20` }}>
                <div 
                  className="w-3/4 h-full rounded-full"
                  style={{ 
                    backgroundColor: COLORS.cyanLight,
                    boxShadow: `0 0 8px ${COLORS.cyanLight}`
                  }}
                />
              </div>
            </div>
            <div className="absolute bottom-0 left-0 p-4 border rounded-xl bg-[#0a0f0f]/60 backdrop-blur-sm translate-y-12 -translate-x-12 hidden lg:block"
                 style={{ borderColor: `${COLORS.cyanLight}30` }}>
              <p className="text-[10px] font-mono" style={{ color: `${COLORS.cyanLight}99` }}>SESSION ID</p>
              <p className="text-xs font-mono mt-1 text-white">
                NEST-{key?.slice(0, 4) || '774A'}-{key?.slice(-4) || '1F3D'}
              </p>
            </div>
          </div>

          {/* Terminal Feed Overlay */}
          {showTerminal && (
            <div 
              className="absolute bottom-10 left-10 w-96 font-mono text-xs space-y-1 p-4 rounded-xl border backdrop-blur-md animate-in slide-in-from-left fade-in duration-300"
              style={{ 
                backgroundColor: '#0a0f0fcc',
                borderColor: `${COLORS.cyanLight}20`
              }}
            >
              <div className="flex items-center justify-between mb-2 pb-2 border-b" style={{ borderColor: `${COLORS.cyanLight}20` }}>
                <span className="text-xs font-bold tracking-wider" style={{ color: COLORS.cyanLight }}>
                  TERMINAL v2.4.0
                </span>
                <span className="text-[10px]" style={{ color: `${COLORS.cyanLight}60` }}>
                  SECURE CONNECTION
                </span>
              </div>
              {terminalMessages.map((msg, idx) => (
                <p key={idx} className="flex items-start gap-2">
                  <span style={{ color: COLORS.cyanLight }}>&gt;</span>
                  <span className="text-gray-400">{msg}</span>
                </p>
              ))}
              <div className="h-4 w-1 animate-pulse inline-block ml-4" style={{ backgroundColor: COLORS.cyanLight }} />
            </div>
          )}

          {/* Bottom Action Controls */}
          <div className="absolute bottom-10 right-10 flex gap-4">
            <button
              onClick={handleClear}
              disabled={isLocked || loading || success}
              className="size-12 rounded-full flex items-center justify-center border transition-all disabled:opacity-30 hover:scale-110"
              style={{ 
                backgroundColor: 'rgba(255,255,255,0.05)',
                borderColor: 'rgba(255,255,255,0.1)',
                color: 'white'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = `${COLORS.cyanLight}20`;
                e.currentTarget.style.borderColor = COLORS.cyanLight;
                e.currentTarget.style.color = COLORS.cyanLight;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                e.currentTarget.style.color = 'white';
              }}
            >
              <RefreshCw className="w-5 h-5" />
            </button>
            <button
              onClick={submit}
              disabled={isLocked || loading || success || code.join("").length !== 6}
              className="px-10 h-12 rounded-full font-bold tracking-widest text-sm transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:scale-105 active:scale-95 relative overflow-hidden group"
              style={{ 
                backgroundColor: COLORS.cyanLight,
                color: '#0a0f0f',
                boxShadow: `0 0 30px ${COLORS.cyanLight}80`
              }}
            >
              <span className="relative z-10 flex items-center gap-2">
                {loading ? (
                  <>
                    <Activity className="w-4 h-4 animate-spin" />
                    VERIFYING
                  </>
                ) : (
                  <>
                    <Fingerprint className="w-4 h-4" />
                    CONFIRM CODE
                  </>
                )}
              </span>
              <div 
                className="absolute inset-0 -translate-x-full group-hover:translate-x-0 transition-transform duration-500"
                style={{
                  background: `linear-gradient(90deg, transparent, ${COLORS.pureWhite}40, transparent)`
                }}
              />
            </button>
          </div>

          {/* Attempt Counter with Visual Progress */}
          <div 
            className="absolute top-32 right-10 flex items-center gap-3 p-3 rounded-lg border"
            style={{ 
              backgroundColor: '#0a0f0fcc',
              borderColor: `${COLORS.cyanLight}20`
            }}
          >
            <div className="relative">
              <Activity className="w-5 h-5" style={{ color: getAttemptColor() }} />
              {attempts > 0 && (
                <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full animate-pulse"
                      style={{ backgroundColor: getAttemptColor() }} />
              )}
            </div>
            <div>
              <p className="text-[10px] font-mono" style={{ color: `${COLORS.cyanLight}99` }}>ATTEMPT COUNTER</p>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold" style={{ color: getAttemptColor() }}>
                  {attempts}/{MAX_ATTEMPTS}
                </span>
                <div className="flex gap-1">
                  {[...Array(MAX_ATTEMPTS)].map((_, i) => (
                    <div
                      key={i}
                      className="w-6 h-1 rounded-full transition-all duration-300"
                      style={{
                        backgroundColor: i < attempts 
                          ? i === 0 ? '#FFA500' : i === 1 ? '#FF4444' : COLORS.electricBlue
                          : `${COLORS.cyanLight}20`
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Warning Banner for Last Attempt */}
          {attempts === 2 && !isLocked && !success && (
            <div 
              className="absolute bottom-32 left-1/2 -translate-x-1/2 flex items-center gap-3 px-6 py-3 rounded-lg border animate-pulse"
              style={{ 
                backgroundColor: '#0a0f0f',
                borderColor: '#FF4444',
                boxShadow: '0 0 20px #FF4444'
              }}
            >
              <AlertTriangle className="w-5 h-5" style={{ color: '#FF4444' }} />
              <span className="text-sm font-bold tracking-wider" style={{ color: '#FF4444' }}>
                FINAL ATTEMPT - SYSTEM WILL LOCK ON FAILURE
              </span>
            </div>
          )}
        </main>

        {/* Footer Accent */}
        <footer 
          className="h-1 bg-gradient-to-r from-transparent via to-transparent blur-sm"
          style={{ 
            backgroundImage: `linear-gradient(to right, transparent, ${COLORS.cyanLight}, transparent)`
          }}
        />
      </div>
    </div>
  );
}
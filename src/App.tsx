import React, { useState, useEffect, useRef } from 'react';
import { 
  Terminal, 
  Activity, 
  Cpu, 
  Database, 
  Award, 
  CheckCircle, 
  Flame, 
  Rocket, 
  Plus, 
  Search, 
  Heart, 
  Send, 
  Volume2, 
  VolumeX, 
  Eye, 
  Globe, 
  ChevronRight, 
  Check, 
  Play, 
  RefreshCw, 
  Server,
  Zap,
  Clock,
  Code,
  Share2,
  Trash2,
  AlertTriangle,
  LogIn,
  LogOut,
  User,
  Bell,
  Shield,
  Key
} from 'lucide-react';
import { useAuth } from './context/AuthContext';
import { supabase } from './lib/supabase';

// --- SOUND EFFECTS (Web Audio API Synthesizer) ---
class SoundSynth {
  private ctx: AudioContext | null = null;
  public muted: boolean = false;

  private initCtx() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }

  playBeep(freq = 440, type: OscillatorType = 'sine', duration = 0.08) {
    if (this.muted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gainNode = this.ctx.createGain();
      
      osc.type = type;
      osc.frequency.value = freq;
      
      gainNode.gain.setValueAtTime(0.08, this.ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);
      
      osc.connect(gainNode);
      gainNode.connect(this.ctx.destination);
      
      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch (e) {
      // Ignored gracefully due to browser policy constraints
    }
  }

  playSuccess() {
    if (this.muted) return;
    this.playBeep(523.25, 'triangle', 0.12); // C5
    setTimeout(() => this.playBeep(659.25, 'triangle', 0.15), 80); // E5
  }

  playLaser() {
    if (this.muted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gainNode = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(800, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(150, this.ctx.currentTime + 0.25);
      
      gainNode.gain.setValueAtTime(0.04, this.ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.25);
      
      osc.connect(gainNode);
      gainNode.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.25);
    } catch (_) {}
  }
}

const synth = new SoundSynth();

// --- INITIAL STATE DATA ---
interface Challenge {
  id: string;
  title: string;
  category: string;
  xpValue: number;
  joined: boolean;
  tasksCompleted: number;
  totalTasks: number;
  difficulty: 'Alpha' | 'Beta' | 'Omega';
  description: string;
  creator: string;
  tags: string[];
}

interface ProjectShowcase {
  id: string;
  title: string;
  description: string;
  creator: string;
  upvotes: number;
  voted: boolean;
  demoUrl: string;
  githubUrl: string;
  timestamp: string;
  sprintTag: string;
}

interface TerminalLine {
  text: string;
  type: 'input' | 'output' | 'error' | 'success';
}

interface LogFeedItem {
  id: string;
  time: string;
  badge: string;
  text: string;
  color: string;
}

export default function App() {
  // Navigation Tabs
  const [activeTab, setActiveTab] = useState<'sprints' | 'showcase' | 'telemetry' | 'terminal'>('sprints');
  const [mutedState, setMutedState] = useState<boolean>(false);

  // Authentication states
  const { user, loading: authLoadingState, signOut } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup' | 'forgot'>('login');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showNotificationDropdown, setShowNotificationDropdown] = useState(false);

  const [notifications, setNotifications] = useState([
    { id: 'not-1', text: 'Decentralized identity decryption key unlocked.', time: 'Just now', unread: true },
    { id: 'not-2', text: 'Secure sandbox port 3000 mapped successfully.', time: '5m ago', unread: true },
    { id: 'not-3', text: 'Welcome to Sprint Command Center! Try executing /help.', time: '1h ago', unread: false }
  ]);

  // Auth Form Handlers
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError(null);
    setAuthSuccess(null);
    synth.playBeep(600, 'sine', 0.05);

    const { error } = await supabase.auth.signInWithPassword({
      email: authEmail,
      password: authPassword,
    });

    if (error) {
      setAuthError(error.message);
      synth.playBeep(180, 'sawtooth', 0.25);
    } else {
      setAuthSuccess('Credentials validated! Syncing telemetry dashboards...');
      synth.playSuccess();
      setTimeout(() => {
        setShowAuthModal(false);
        setAuthError(null);
        setAuthSuccess(null);
        setAuthEmail('');
        setAuthPassword('');
      }, 1500);
    }
    setAuthLoading(false);
  };

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError(null);
    setAuthSuccess(null);
    synth.playBeep(600, 'sine', 0.05);

    const { error } = await supabase.auth.signUp({
      email: authEmail,
      password: authPassword,
    });

    if (error) {
      setAuthError(error.message);
      synth.playBeep(180, 'sawtooth', 0.25);
    } else {
      setAuthSuccess('Registration payload dispatched! Confirm your inbox to complete activation link.');
      synth.playSuccess();
    }
    setAuthLoading(false);
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError(null);
    setAuthSuccess(null);
    synth.playBeep(600, 'sine', 0.05);

    const { error } = await supabase.auth.resetPasswordForEmail(authEmail, {
      redirectTo: window.location.origin,
    });

    if (error) {
      setAuthError(error.message);
      synth.playBeep(180, 'sawtooth', 0.25);
    } else {
      setAuthSuccess('Reset token dispatch initialized. Check your encryption terminal / inbox.');
      synth.playSuccess();
    }
    setAuthLoading(false);
  };

  const handleOAuthLogin = async (provider: 'google' | 'github') => {
    setAuthLoading(true);
    setAuthError(null);
    synth.playBeep(700, 'sine', 0.08);

    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: window.location.origin,
      }
    });

    if (error) {
      setAuthError(error.message);
      synth.playBeep(180, 'sawtooth', 0.25);
      setAuthLoading(false);
    }
  };

  // UTC/Local Clock Live Sync
  const [utcTime, setUtcTime] = useState<string>('');
  const [systemUptime, setSystemUptime] = useState<number>(10427); // Simulated seconds

  // Search and Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('all');

  // Hardcoded & Interactive Challenges State
  const [challenges, setChallenges] = useState<Challenge[]>([
    {
      id: 'ch-1',
      title: 'Decentralized Identity Vault',
      category: 'Web3 Security',
      xpValue: 1200,
      joined: true,
      tasksCompleted: 2,
      totalTasks: 4,
      difficulty: 'Omega',
      description: 'Design and deploy a client-side localized secure key store resisting memory extraction vectors with zero overhead.',
      creator: 'Crypton-X',
      tags: ['rust', 'wasm', 'webcrypto']
    },
    {
      id: 'ch-2',
      title: 'Sub-millisecond State Syncer',
      category: 'Distributed DB',
      xpValue: 950,
      joined: false,
      tasksCompleted: 0,
      totalTasks: 3,
      difficulty: 'Beta',
      description: 'Implement an optimistic locking replication wrapper over LocalStorage to sync multiple sandboxed iframes efficiently.',
      creator: 'HypeEngine',
      tags: ['typescript', 'sync', 'broadcastchannel']
    },
    {
      id: 'ch-3',
      title: 'Neon Brutalist UI Engine',
      category: 'Frontend UI',
      xpValue: 700,
      joined: true,
      tasksCompleted: 3,
      totalTasks: 3,
      difficulty: 'Alpha',
      description: 'Construct a purely custom CSS customizer widget with a persistent dashboard layout respecting custom raw CSS values.',
      creator: 'RetroCoder',
      tags: ['css3', 'tw-theme', 'react']
    },
    {
      id: 'ch-4',
      title: 'Telemetry Analytics Pipeline',
      category: 'Observability',
      xpValue: 1400,
      joined: false,
      tasksCompleted: 0,
      totalTasks: 5,
      difficulty: 'Omega',
      description: 'Synthesize highly performing canvas telemetry indicators that listen to arbitrary state nodes and visualize latency levels dynamically.',
      creator: 'Hexagon-7',
      tags: ['d3-canvas', 'perf-hooks', 'workers']
    }
  ]);

  // Project Showcase State
  const [showcases, setShowcases] = useState<ProjectShowcase[]>([
    {
      id: 'proj-1',
      title: 'HoloGrid Sandbox v1',
      description: 'An interactive audio synthesized developer workspace styled with extreme green neon terminal colors and customized canvas controls.',
      creator: 'VaporwaveDev',
      upvotes: 42,
      voted: false,
      demoUrl: 'https://ais-pre-xn25bw4gzlyfrmok7f2oxs.run.app',
      githubUrl: 'https://github.com/coder-holo/hologrid',
      timestamp: '2 hours ago',
      sprintTag: 'Neon Brutalist UI Engine'
    },
    {
      id: 'proj-2',
      title: 'Axiom-Cipher Keyring',
      description: 'Zero-knowledge responsive browser password management widget. Generates real secure elliptic curve keys purely client-side.',
      creator: 'ZkMaster',
      upvotes: 89,
      voted: true,
      demoUrl: '#',
      githubUrl: 'https://github.com/axiom/cipher-ring',
      timestamp: '5 hours ago',
      sprintTag: 'Decentralized Identity Vault'
    }
  ]);

  // Project Creation Modal & Fields
  const [showSubmissionModal, setShowSubmissionModal] = useState(false);
  const [newProjTitle, setNewProjTitle] = useState('');
  const [newProjDesc, setNewProjDesc] = useState('');
  const [newProjSprint, setNewProjSprint] = useState('Generic Hackathon');
  const [newProjCreator, setNewProjCreator] = useState('');
  const [newProjDemo, setNewProjDemo] = useState('');
  const [newProjGithub, setNewProjGithub] = useState('');

  // Terminal Simulator State
  const [terminalInput, setTerminalInput] = useState('');
  const [terminalLines, setTerminalLines] = useState<TerminalLine[]>([
    { text: 'SYSTEM SPRINT COMMAND CENTER TERMINAL ONLINE - v3.09.2', type: 'success' },
    { text: 'Type "/help" or "/challenges" or "/stats" or "/launch" followed by command params.', type: 'output' },
    { text: 'System diagnostics complete. Ready for developer inputs.', type: 'output' }
  ]);
  const consoleBottomRef = useRef<HTMLDivElement | null>(null);

  // Live Metrics Simulator State
  const [cpuUsage, setCpuUsage] = useState(38);
  const [networkPackets, setNetworkPackets] = useState(482613);
  const [activeNodesCount, setActiveNodesCount] = useState(128);

  // Real-time Event Logger Feed State
  const [logFeed, setLogFeed] = useState<LogFeedItem[]>([
    { id: 'l-1', time: '09:41:01', badge: 'AUTH', text: 'Secure auth credentials synced with workspace container.', color: 'text-amber-400 border-amber-400/30' },
    { id: 'l-2', time: '09:41:00', badge: 'SYSTEM', text: 'Dev environment booted. CPU latency stabilized at 1.2ms.', color: 'text-teal-400 border-teal-400/30' },
    { id: 'l-3', time: '09:40:48', badge: 'SPONSOR', text: 'Hexagon-7 issued target payload challenge (Decentralized Identity)', color: 'text-fuchsia-400 border-fuchsia-400/30' }
  ]);

  // Synchronizers & Live Intervals
  useEffect(() => {
    // Live update clock (UTC format)
    const updateTimeAndMetrics = () => {
      const now = new Date();
      setUtcTime(now.toUTCString().replace('GMT', 'UTC'));
      setSystemUptime(prev => prev + 1);

      // Randomly fluctuate CPU metrics & processed packets dynamically for hyper-live look
      setCpuUsage(prev => {
        const delta = Math.floor(Math.random() * 11) - 5;
        const next = prev + delta;
        return next < 5 ? 5 : next > 95 ? 95 : next;
      });
      setNetworkPackets(prev => prev + Math.floor(Math.random() * 18));
    };

    updateTimeAndMetrics();
    const clockInterval = setInterval(updateTimeAndMetrics, 1000);

    // Random system activities simulation generated occasionally to mimic server push logs
    const activitiesPool = [
      { badge: 'BUILD', text: 'Build pipeline completed successfully for HoloGrid Sandbox build #8161.', color: 'text-emerald-400 border-emerald-400/30' },
      { badge: 'VOTE', text: 'Anonymous developer upvoted project "Axiom-Cipher Keyring".', color: 'text-pink-400 border-pink-400/30' },
      { badge: 'GLOBAL', text: 'New participant @HypeCoder has joined the "Sub-millisecond State Syncer" sprint.', color: 'text-blue-400 border-blue-400/30' },
      { badge: 'SYS_METRIC', text: 'Memory heap cleared. Garbarge collector recovered 82MB.', color: 'text-cyan-400 border-cyan-400/30' }
    ];

    const logsInterval = setInterval(() => {
      const randomActivity = activitiesPool[Math.floor(Math.random() * activitiesPool.length)];
      const logTime = new Date().toLocaleTimeString('en-GB');
      const newLogVal: LogFeedItem = {
        id: `l-dyn-${Date.now()}`,
        time: logTime,
        badge: randomActivity.badge,
        text: randomActivity.text,
        color: randomActivity.color
      };

      setLogFeed(prev => [newLogVal, ...prev.slice(0, 9)]);
    }, 9000);

    return () => {
      clearInterval(clockInterval);
      clearInterval(logsInterval);
    };
  }, []);

  // Sync scroll for interactive terminal console view
  useEffect(() => {
    if (consoleBottomRef.current) {
      consoleBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [terminalLines]);

  // Handle synthesized toggle trigger
  const toggleMute = () => {
    const nextState = !mutedState;
    setMutedState(nextState);
    synth.muted = nextState;
    if (!nextState) {
      synth.playSuccess();
    }
  };

  // --- INTERACTION CONTROLS ---

  // Challenge Actions
  const handleJoinLeaveChallenge = (id: string) => {
    synth.playBeep(440, 'triangle', 0.1);
    setChallenges(prev => prev.map(ch => {
      if (ch.id === id) {
        const nextJoined = !ch.joined;
        // Synthesize dynamic feedback
        if (nextJoined) {
          synth.playSuccess();
        } else {
          synth.playBeep(261.63, 'sawtooth', 0.15); // C4 beep
        }
        return {
          ...ch,
          joined: nextJoined,
          tasksCompleted: nextJoined ? 1 : 0
        };
      }
      return ch;
    }));
  };

  const handleIncrementTask = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    synth.playLaser();
    setChallenges(prev => prev.map(ch => {
      if (ch.id === id) {
        const nextTaskCount = ch.tasksCompleted >= ch.totalTasks ? 0 : ch.tasksCompleted + 1;
        if (nextTaskCount === ch.totalTasks) {
          synth.playSuccess();
        }
        return {
          ...ch,
          tasksCompleted: nextTaskCount
        };
      }
      return ch;
    }));
  };

  // Upvoting Showcase Posts
  const handleUpvote = (id: string) => {
    synth.playBeep(587.33, 'sine', 0.09); // D5
    setShowcases(prev => prev.map(sc => {
      if (sc.id === id) {
        return {
          ...sc,
          upvotes: sc.voted ? sc.upvotes - 1 : sc.upvotes + 1,
          voted: !sc.voted
        };
      }
      return sc;
    }));
  };

  // Interactive Project Registration Submit
  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjTitle.trim() || !newProjDesc.trim() || !newProjCreator.trim()) {
      synth.playBeep(180, 'sawtooth', 0.3);
      alert('Error: Please compile all required structural input fields to deploy.');
      return;
    }

    const createdProj: ProjectShowcase = {
      id: `proj-${Date.now()}`,
      title: newProjTitle,
      description: newProjDesc,
      creator: newProjCreator,
      upvotes: 1,
      voted: true,
      demoUrl: newProjDemo || '#',
      githubUrl: newProjGithub || '#',
      timestamp: 'Just now',
      sprintTag: newProjSprint
    };

    setShowcases([createdProj, ...showcases]);
    setShowSubmissionModal(false);
    synth.playSuccess();

    // Reset fields
    setNewProjTitle('');
    setNewProjDesc('');
    setNewProjCreator('');
    setNewProjDemo('');
    setNewProjGithub('');

    // Append to live feed logs directly
    const logTime = new Date().toLocaleTimeString('en-GB');
    setLogFeed(prev => [
      {
        id: `l-dyn-${Date.now()}`,
        time: logTime,
        badge: 'SHOWCASE',
        text: `New software compiled: "${createdProj.title}" submitted by @${createdProj.creator}.`,
        color: 'text-amber-400 border-amber-400/30'
      },
      ...prev
    ]);
  };

  // Terminal input submit parser mock shell Command execution
  const handleTerminalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!terminalInput.trim()) return;

    const cmdLine = terminalInput.trim();
    synth.playBeep(415.3, 'sine', 0.05); // G#4

    // Push typed command line to UI viewport logs first
    const inputLine: TerminalLine = { text: `$ ${cmdLine}`, type: 'input' };
    
    // Command parser logic
    let linesToAppend: TerminalLine[] = [];
    const commandLower = cmdLine.toLowerCase();

    if (commandLower === '/help') {
      linesToAppend = [
        { text: 'AVAILABLE SPRINT PROTOCOL DIRECTIVES:', type: 'success' },
        { text: '  /challenges     List current sprint target payload metrics', type: 'output' },
        { text: '  /stats          Render active CPU core temperature limits', type: 'output' },
        { text: '  /utc            Retrieve persistent atomic synchronizer time status', type: 'output' },
        { text: '  /hack [name]    Execute penetration audit bypass telemetry', type: 'error' },
        { text: '  /clear          Purge command log scroll history buffer', type: 'output' }
      ];
    } else if (commandLower === '/challenges') {
      const activeSprintBriefs = challenges.map(ch => 
        ` - [${ch.difficulty}] ${ch.title} by @${ch.creator} (${ch.tasksCompleted}/${ch.totalTasks} completed | Value: ${ch.xpValue} XP)`
      );
      linesToAppend = [
        { text: `CURRENT ACTIVE CHALLENGE PAYLOAD (${challenges.length} SPRINT TARGETS):`, type: 'success' },
        ...activeSprintBriefs.map(text => ({ text, type: 'output' as const }))
      ];
    } else if (commandLower === '/stats') {
      linesToAppend = [
        { text: 'TELEMETRY HARDWARE STATUS:', type: 'success' },
        { text: `  Active CPU Multi-Core Engine Load: ${cpuUsage}%`, type: 'output' },
        { text: `  Continuous Network Port Packets Captured: ${networkPackets.toLocaleString()}`, type: 'output' },
        { text: `  Dev Cluster Instance Subsystem Nodes: ${activeNodesCount} units`, type: 'output' },
        { text: `  System Uptime Metric: ${Math.floor(systemUptime / 60)} minutes and ${systemUptime % 60} seconds.`, type: 'output' }
      ];
    } else if (commandLower === '/utc') {
      linesToAppend = [
        { text: `CLOCK STATE: ${new Date().toUTCString()} (Synchronous Unix Atomic Stack Status)`, type: 'output' }
      ];
    } else if (commandLower.startsWith('/hack')) {
      const targetParam = cmdLine.substring(5).trim() || 'Core Database';
      synth.playLaser();
      linesToAppend = [
        { text: `Executing sandbox injection audit on: [${targetParam}]`, type: 'error' },
        { text: '  Checking payload vectors...', type: 'output' },
        { text: '  Authentication verification: SUCCESS. Client bypass route verified.', type: 'success' },
        { text: `  SYSTEM COMPROMISE SIMULATED: Virtual token flag captured for ${targetParam}!`, type: 'success' }
      ];
    } else if (commandLower === '/clear') {
      setTerminalLines([]);
      setTerminalInput('');
      return;
    } else {
      linesToAppend = [
        { text: `Unknown instruction: "${cmdLine}". Try typing "/help" to recall valid commands.`, type: 'error' }
      ];
    }

    setTerminalLines(prev => [...prev, inputLine, ...linesToAppend]);
    setTerminalInput('');
  };

  // Quick challenge direct tag adder
  const handleJoinChallengeQuick = (title: string) => {
    const ch = challenges.find(c => c.title === title);
    if (ch) {
      handleJoinLeaveChallenge(ch.id);
    }
  };

  // Filtered Sprint list logic
  const filteredChallenges = challenges.filter(ch => {
    const textMatch = ch.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                      ch.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      ch.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
    
    if (difficultyFilter === 'all') return textMatch;
    return textMatch && ch.difficulty.toLowerCase() === difficultyFilter.toLowerCase();
  });

  return (
    <div id="command-center-root" className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans selection:bg-teal-500/30 selection:text-teal-200">
      
      {/* HEADER BAR */}
      <header id="control-header" className="sticky top-0 z-40 bg-neutral-900/80 backdrop-blur border-b border-neutral-800 px-4 py-3 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          
          <div className="flex items-center gap-3">
            {/* Visual Pulse Badge */}
            <div className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-teal-500"></span>
            </div>
            
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                  <Terminal className="w-5 h-5 text-teal-400" />
                  SPRINT COMMAND CENTER
                </h1>
                <span className="hidden sm:inline bg-neutral-800 text-neutral-400 text-[10px] px-2 py-0.5 rounded-full font-mono">
                  LIVE HUBS
                </span>
              </div>
              <p className="text-xs text-neutral-400 hidden sm:block">
                Collate team sprints, showcase deliverables, audit metrics, and execute playground telemetry parameters.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            {/* Live Clock Indicator */}
            <div className="flex items-center gap-2 bg-neutral-950/80 px-3 py-1.5 rounded border border-neutral-800 font-mono text-[11px] text-neutral-300">
              <Clock className="w-3.5 h-3.5 text-teal-500 animate-pulse" />
              <span>{utcTime || 'SYNCING...'}</span>
            </div>

            {/* Micro Synth Controller */}
            <button
              onClick={toggleMute}
              className="p-2 rounded bg-neutral-800/80 hover:bg-neutral-800 border border-neutral-700 hover:text-white transition-colors"
              title={mutedState ? "Enable Audio Synthesizer Effects" : "Mute audio synthesis"}
            >
              {mutedState ? (
                <VolumeX className="w-4 h-4 text-rose-400" />
              ) : (
                <Volume2 className="w-4 h-4 text-emerald-400" />
              )}
            </button>

            {/* REAL SUPABASE AUTH SECURE HOOKS */}
            {user ? (
              <div className="flex items-center gap-2 relative">
                
                {/* Notification Feed Toggler */}
                <div className="relative">
                  <button
                    onClick={() => {
                      setShowNotificationDropdown(!showNotificationDropdown);
                      setShowProfileDropdown(false);
                      synth.playBeep(520, 'sine', 0.05);
                    }}
                    className={`p-2 rounded border transition-colors relative ${
                      showNotificationDropdown
                        ? 'bg-neutral-800 text-teal-400 border-teal-500/50'
                        : 'bg-neutral-900 border-neutral-800 hover:text-white hover:bg-neutral-805'
                    }`}
                    title="System Notifications"
                  >
                    <Bell className="w-4 h-4" />
                    {notifications.some(n => n.unread) && (
                      <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-teal-400 animate-pulse inline-block" />
                    )}
                  </button>

                  {/* Floating Notification Box */}
                  {showNotificationDropdown && (
                    <div className="absolute right-0 mt-2 w-72 bg-neutral-900 border border-neutral-800 rounded-md shadow-2xl p-3 z-50 text-xs font-mono space-y-2 animate-fade-in text-left">
                      <div className="flex justify-between items-center pb-2 border-b border-neutral-800">
                        <span className="text-[10px] text-neutral-400 uppercase tracking-wider font-semibold">Live Signals</span>
                        <button
                          onClick={() => {
                            setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
                            synth.playSuccess();
                          }}
                          className="text-[9px] text-teal-400 hover:underline"
                        >
                          Clear signals
                        </button>
                      </div>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {notifications.map(n => (
                          <div key={n.id} className={`p-1.5 rounded transition-all ${n.unread ? 'bg-teal-500/5 border-l-2 border-teal-400 text-white' : 'text-neutral-400'}`}>
                            <p className="text-[11px] leading-snug">{n.text}</p>
                            <span className="text-[9px] text-neutral-500 block mt-0.5">{n.time}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Profile Badge Trigger */}
                <div className="relative">
                  <button
                    onClick={() => {
                      setShowProfileDropdown(!showProfileDropdown);
                      setShowNotificationDropdown(false);
                      synth.playBeep(480, 'sine', 0.05);
                    }}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded border text-xs font-mono transition-all ${
                      showProfileDropdown
                        ? 'bg-teal-500/10 text-white border-teal-500/60'
                        : 'bg-neutral-900 hover:bg-neutral-850 hover:border-neutral-700 text-teal-400 border-neutral-800'
                    }`}
                  >
                    <div className="h-4 w-4 rounded-full bg-teal-500 text-neutral-950 flex items-center justify-center font-bold text-[9px] uppercase">
                      {user.email?.charAt(0) || 'U'}
                    </div>
                    <span className="max-w-[80px] truncate hidden sm:inline-block">
                      {user.email?.split('@')[0]}
                    </span>
                  </button>

                  {/* Profile Dropdown list */}
                  {showProfileDropdown && (
                    <div className="absolute right-0 mt-2 w-56 bg-neutral-900 border border-neutral-800 rounded-md shadow-2xl p-3.5 z-50 text-xs font-mono text-left space-y-2.5 animate-fade-in">
                      <div className="pb-2 border-b border-neutral-800">
                        <span className="text-[9px] text-neutral-500 block uppercase tracking-wider">Access Node</span>
                        <p className="text-neutral-200 font-semibold truncate text-[11px]">{user.email}</p>
                        <span className="text-[9px] text-teal-400 font-mono block mt-0.5">Role: Dev Architect</span>
                      </div>
                      
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] text-neutral-500 py-0.5">
                          <span>User ID:</span>
                          <span className="truncate max-w-[120px] text-neutral-300 font-mono">{user.id}</span>
                        </div>
                        <div className="flex justify-between text-[10px] text-neutral-500 py-0.5">
                          <span>Auth Provider:</span>
                          <span className="text-neutral-300 font-mono capitalize">{user.app_metadata?.provider || 'email'}</span>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-neutral-800">
                        <button
                          onClick={async () => {
                            synth.playBeep(220, 'sawtooth', 0.15);
                            await signOut();
                            setShowProfileDropdown(false);
                          }}
                          className="w-full flex items-center justify-between text-left text-rose-400 hover:text-white hover:bg-rose-500/10 px-2 py-1.5 rounded transition-all text-[11px]"
                        >
                          <span>Revoke access keys</span>
                          <LogOut className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>

              </div>
            ) : (
              <button
                onClick={() => {
                  setAuthMode('login');
                  setAuthError(null);
                  setAuthSuccess(null);
                  setShowAuthModal(true);
                  synth.playBeep(640, 'sine', 0.08);
                }}
                className="bg-teal-500 hover:bg-teal-400 text-neutral-950 text-xs font-bold font-mono px-4 py-1.5 rounded transition-all flex items-center gap-1.5"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>SECURE ACCESS</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* PERSISTENT STAT TELEMETRY BAR */}
      <section id="telemetry-compact" className="bg-neutral-950 border-b border-neutral-900 py-3 px-4">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          
          <div className="bg-neutral-900/40 p-2.5 rounded border border-neutral-900 flex items-center gap-3">
            <Cpu className="text-teal-400 w-4 h-4 shrink-0" />
            <div>
              <span className="text-neutral-500 block text-[10px] uppercase font-mono tracking-wider">CPU Micro Controller</span>
              <div className="flex items-center gap-2">
                <span className="text-neutral-200 font-mono font-semibold">{cpuUsage}%</span>
                <div className="w-16 bg-neutral-800 h-1 rounded overflow-hidden">
                  <div className="bg-teal-400 h-full transition-all duration-1000" style={{ width: `${cpuUsage}%` }}></div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-neutral-900/40 p-2.5 rounded border border-neutral-900 flex items-center gap-3">
            <Database className="text-indigo-400 w-4 h-4 shrink-0" />
            <div>
              <span className="text-neutral-500 block text-[10px] uppercase font-mono tracking-wider">Intercept Packet Streams</span>
              <span className="text-neutral-200 font-mono font-semibold">{(networkPackets).toLocaleString()} rx</span>
            </div>
          </div>

          <div className="bg-neutral-900/40 p-2.5 rounded border border-neutral-900 flex items-center gap-3">
            <Activity className="text-emerald-400 w-4 h-4 shrink-0" />
            <div>
              <span className="text-neutral-500 block text-[10px] uppercase font-mono tracking-wider">Uptime Counter</span>
              <span className="text-neutral-200 font-mono">
                {Math.floor(systemUptime / 3600)}h {Math.floor((systemUptime % 3600) / 60)}m {systemUptime % 60}s
              </span>
            </div>
          </div>

          <div className="bg-neutral-900/40 p-2.5 rounded border border-neutral-900 flex items-center gap-3">
            <Server className="text-yellow-400 w-4 h-4 shrink-0" />
            <div>
              <span className="text-neutral-500 block text-[10px] uppercase font-mono tracking-wider">Cloud Engine Sandbox</span>
              <span className="text-neutral-200 text-[11px] text-emerald-400 flex items-center gap-1 font-mono">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 block animate-pulse"></span>
                STABLE_PORT_3000
              </span>
            </div>
          </div>

        </div>
      </section>

      {/* MAIN TWO-COLUMN CONTAINER SPACE */}
      <main id="main-content" className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* LEFT COLUMN: NAVIGATION INTERFACES & DYNAMIC LOCAL EVENTS STREAM */}
        <aside className="lg:col-span-1 flex flex-col gap-6">
          
          {/* Main Control Hub Navigation list */}
          <div className="bg-neutral-900/90 rounded-lg border border-neutral-800 p-4">
            <h2 className="text-xs font-mono font-semibold text-neutral-400 uppercase tracking-widest mb-3">
              CONTROL MODULE DIRECTORIES
            </h2>
            <nav className="flex flex-col gap-1">
              <button
                onClick={() => { setActiveTab('sprints'); synth.playBeep(440, 'sine', 0.05); }}
                className={`w-full flex items-center justify-between text-left px-3 py-2.5 rounded text-sm transition-all ${
                  activeTab === 'sprints'
                    ? 'bg-teal-500/10 text-white border-l-2 border-teal-400 font-medium'
                    : 'text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Rocket className="w-4 h-4" />
                  <span>Interactive Sprints</span>
                </div>
                <span className="bg-neutral-800 text-neutral-400 text-[11px] px-1.5 py-0.5 rounded">
                  {challenges.length}
                </span>
              </button>

              <button
                onClick={() => { setActiveTab('showcase'); synth.playBeep(440, 'sine', 0.05); }}
                className={`w-full flex items-center justify-between text-left px-3 py-2.5 rounded text-sm transition-all ${
                  activeTab === 'showcase'
                    ? 'bg-teal-500/10 text-white border-l-2 border-teal-400 font-medium'
                    : 'text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4" />
                  <span>Project Showcase</span>
                </div>
                <span className="bg-pink-500/10 text-pink-400 text-[11px] px-1.5 py-0.5 rounded">
                  {showcases.length}
                </span>
              </button>

              <button
                onClick={() => { setActiveTab('telemetry'); synth.playBeep(440, 'sine', 0.05); }}
                className={`w-full flex items-center justify-between text-left px-3 py-2.5 rounded text-sm transition-all ${
                  activeTab === 'telemetry'
                    ? 'bg-teal-500/10 text-white border-l-2 border-teal-400 font-medium'
                    : 'text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-purple-400" />
                  <span>Sim Diagnostic Stats</span>
                </div>
                <span className="inline-block bg-teal-500/20 text-teal-400 px-1 py-0.5 text-[9px] rounded font-mono animate-pulse">
                  ACTIVES
                </span>
              </button>

              <button
                onClick={() => { setActiveTab('terminal'); synth.playBeep(440, 'sine', 0.05); }}
                className={`w-full flex items-center justify-between text-left px-3 py-2.5 rounded text-sm transition-all ${
                  activeTab === 'terminal'
                    ? 'bg-teal-500/10 text-white border-l-2 border-teal-400 font-medium'
                    : 'text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-amber-400" />
                  <span>Sandbox Terminal Shell</span>
                </div>
                <kbd className="hidden md:inline-block bg-neutral-950 font-mono text-[9px] px-1.5 py-0.5 rounded text-neutral-500">
                  CLI
                </kbd>
              </button>
            </nav>
          </div>

          {/* Quick Stats Metric Engine block */}
          <div className="bg-neutral-900/90 rounded-lg border border-neutral-800 p-4">
            <h2 className="text-xs font-mono font-semibold text-neutral-400 uppercase tracking-widest mb-3 flex items-center gap-2">
              <Zap className="w-3.5 h-3.5 text-amber-400 animate-pulse" /> SPRINT ANALYTICS
            </h2>
            <div className="space-y-3 font-mono text-xs">
              <div className="flex justify-between border-b border-neutral-800/60 pb-2">
                <span className="text-neutral-500">Total Sprints Active</span>
                <span className="text-neutral-200">{challenges.length}</span>
              </div>
              <div className="flex justify-between border-b border-neutral-800/60 pb-2">
                <span className="text-neutral-500">Submited Builds</span>
                <span className="text-neutral-200">{showcases.length} entries</span>
              </div>
              <div className="flex justify-between border-b border-neutral-800/60 pb-2">
                <span className="text-neutral-500 font-medium">Joined Sprint Targets</span>
                <span className="text-teal-400">{challenges.filter(c => c.joined).length} targets</span>
              </div>
              <div className="flex justify-between pt-1">
                <span className="text-neutral-500 font-semibold">Commits Clocked</span>
                <span className="text-neutral-100 font-semibold">1,489 hashes</span>
              </div>
              <div className="mt-4 pt-3 border-t border-neutral-800">
                <p className="text-[11px] text-neutral-400 italic leading-snug">
                  "Continuous deployment keeps microservices architecture resilient"
                </p>
              </div>
            </div>
          </div>

          {/* REALTIME STREAM LOGS FEED */}
          <div className="bg-neutral-900/90 rounded-lg border border-neutral-800 p-4 flex-1 flex flex-col min-h-[280px]">
            <h2 className="text-xs font-mono font-semibold text-neutral-400 uppercase tracking-widest mb-3 flex items-center justify-between">
              <span>SANDBOX HOST LOGS</span>
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping"></span>
            </h2>
            <div className="flex-1 overflow-y-auto space-y-2 max-h-[300px] text-[11px] scrollbar-thin scrollbar-thumb-neutral-800">
              {logFeed.map((log) => (
                <div key={log.id} className="p-2 bg-black/40 rounded border border-neutral-900 font-mono leading-relaxed transition-all duration-300">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-neutral-500">{log.time}</span>
                    <span className={`text-[9px] px-1.5 py-0.2 rounded border uppercase font-bold tracking-wider ${log.color}`}>
                      {log.badge}
                    </span>
                  </div>
                  <p className="text-neutral-300">{log.text}</p>
                </div>
              ))}
            </div>
          </div>

        </aside>

        {/* RIGHT COLUMN: MAIN INTERACTIVE VIEW AREA */}
        <section className="lg:col-span-3 flex flex-col gap-6">
          
          {/* SPRINT CHALLENGES TAB */}
          {activeTab === 'sprints' && (
            <div className="space-y-6">
              
              {/* Sprint Search and Controls Dashboard */}
              <div id="search-config-panel" className="bg-neutral-900/90 rounded-lg border border-neutral-800 p-4 flex flex-col sm:flex-row gap-3 items-center justify-between">
                
                <div className="relative w-full sm:w-72">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-neutral-500">
                    <Search className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    placeholder="Search sprint titles or tags..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-neutral-950 text-xs px-3 py-2.5 pl-9 rounded border border-neutral-800 focus:outline-none focus:ring-1 focus:ring-teal-500 text-neutral-100 placeholder-neutral-500"
                  />
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <span className="text-xs text-neutral-500 whitespace-nowrap font-mono">Complexity:</span>
                  <select
                    value={difficultyFilter}
                    onChange={(e) => setDifficultyFilter(e.target.value)}
                    className="bg-neutral-950 text-xs text-neutral-300 px-3 py-2 rounded border border-neutral-800 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  >
                    <option value="all">ANY DIFFICULTY</option>
                    <option value="alpha">ALPHA (Entry Level)</option>
                    <option value="beta">BETA (Moderator Level)</option>
                    <option value="omega">OMEGA (Expert Class)</option>
                  </select>
                </div>

              </div>

              {/* Grid of Interactive sprint challenges */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredChallenges.length > 0 ? (
                  filteredChallenges.map((ch) => (
                    <div 
                      key={ch.id} 
                      className={`relative bg-neutral-900 rounded-lg border transition-all duration-300 overflow-hidden flex flex-col justify-between ${
                        ch.joined 
                          ? 'border-teal-500/50 shadow-lg shadow-teal-500/10' 
                          : 'border-neutral-800 hover:border-neutral-700'
                      }`}
                    >
                      {/* Ribbon banner */}
                      <div className="absolute top-0 right-0">
                        <span className={`text-[10px] font-mono font-bold px-3 py-1 rounded-bl border-l border-b uppercase block ${
                          ch.difficulty === 'Omega' 
                            ? 'bg-rose-500/10 text-rose-400 border-rose-500/40' 
                            : ch.difficulty === 'Beta' 
                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/40' 
                              : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/40'
                        }`}>
                          {ch.difficulty} Complexity
                        </span>
                      </div>

                      <div className="p-6">
                        <p className="text-xs text-teal-400 font-mono uppercase tracking-wider mb-2">
                          {ch.category}
                        </p>
                        <h3 className="text-lg font-bold text-white mb-2 pr-20 leading-tight">
                          {ch.title}
                        </h3>
                        <p className="text-xs text-neutral-400 mb-4 leading-relaxed">
                          {ch.description}
                        </p>

                        {/* Interactive Action: Task Counter progress bar */}
                        {ch.joined ? (
                          <div className="mb-4 bg-neutral-950 p-3 rounded border border-neutral-800 font-mono text-xs">
                            <div className="flex justify-between items-center mb-1.5">
                              <span className="text-neutral-400 text-[11px] flex items-center gap-1">
                                <Code className="w-3.5 h-3.5 text-teal-400" /> Complete Subtasks
                              </span>
                              <span className="font-semibold text-teal-400 text-[11px]">
                                {ch.tasksCompleted} / {ch.totalTasks} Done
                              </span>
                            </div>
                            
                            {/* Visual Bar of Progress */}
                            <div className="w-full bg-neutral-800 h-2 rounded-full overflow-hidden mb-2.5">
                              <div 
                                className="bg-teal-400 h-full transition-all duration-300"
                                style={{ width: `${(ch.tasksCompleted / ch.totalTasks) * 100}%` }}
                              ></div>
                            </div>

                            <button
                              onClick={(e) => handleIncrementTask(ch.id, e)}
                              className="w-full bg-neutral-905 hover:bg-neutral-800 border border-teal-500/30 text-[10px] font-bold text-teal-400 uppercase tracking-widest py-1.5 px-3 rounded hover:border-teal-400 transition-all flex items-center justify-center gap-1.5"
                            >
                              <CheckCircle className="w-3 h-3 text-teal-400" />
                              {ch.tasksCompleted >= ch.totalTasks ? 'Reset Subtask Loops' : 'Execute Subtask Commit'}
                            </button>
                          </div>
                        ) : (
                          <div className="bg-neutral-950/40 p-3 rounded border border-neutral-900 italic text-[11px] text-neutral-500 mb-4">
                            You are not allocated to this sandbox stream. Enlist to unlock subtasks progress trackers.
                          </div>
                        )}

                        {/* Tag list */}
                        <div id="tag-capsules" className="flex flex-wrap gap-1.5 mb-2">
                          {ch.tags.map((tag) => (
                            <span key={tag} className="bg-neutral-950 text-neutral-400 font-mono text-[10px] px-2 py-0.5 rounded border border-neutral-850">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Card Footer controls */}
                      <div className="mt-auto px-6 py-4 bg-neutral-950/80 border-t border-neutral-800/80 flex items-center justify-between">
                        <span className="text-xs text-neutral-400 font-mono">
                          Value: <strong className="text-neutral-200">{ch.xpValue} XP</strong>
                        </span>

                        <button
                          onClick={() => handleJoinLeaveChallenge(ch.id)}
                          className={`text-xs px-4 py-1.5 rounded font-semibold transition-all ${
                            ch.joined 
                              ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30' 
                              : 'bg-teal-500 hover:bg-teal-400 text-neutral-950'
                          }`}
                        >
                          {ch.joined ? 'Opt Out of Sprint' : 'Enlist to Sprint'}
                        </button>
                      </div>

                    </div>
                  ))
                ) : (
                  <div className="col-span-2 bg-neutral-900 rounded-lg p-12 text-center border border-dashed border-neutral-850">
                    <AlertTriangle className="w-12 h-12 text-amber-500/70 mx-auto mb-3" />
                    <h3 className="text-base font-bold text-neutral-200 mb-1">No Sprint Targets Configured</h3>
                    <p className="text-xs text-neutral-500 max-w-md mx-auto">
                      No current challenges match "{searchQuery}" with the "{difficultyFilter}" difficulty filter. Modify target filters.
                    </p>
                    <button 
                      onClick={() => { setSearchQuery(''); setDifficultyFilter('all'); synth.playBeep(); }}
                      className="mt-4 bg-neutral-800 text-neutral-300 text-xs px-4 py-2 rounded hover:text-white"
                    >
                      Clear Target Filters
                    </button>
                  </div>
                )}
              </div>

              {/* SPRINT WORKSPACE UTILITIES INFO BANNER */}
              <div className="bg-gradient-to-r from-teal-950/40 to-neutral-900 rounded-lg p-6 border border-teal-500/20 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-bold text-teal-400 mb-1 flex items-center gap-1.5">
                    <Flame className="w-5 h-5 text-amber-400 animate-pulse" />
                    Sprint Command Sandbox Compilation Tool
                  </h3>
                  <p className="text-xs text-neutral-400 max-w-2xl leading-relaxed">
                    Build decentralized browser utilities or security frameworks! Once compiled, submit your live deployment build path to the team Showcase board to earn XP and upvotes.
                  </p>
                </div>
                <button
                  onClick={() => { setActiveTab('showcase'); synth.playBeep(440, 'triangle', 0.1); }}
                  className="bg-teal-500 hover:bg-teal-400 text-neutral-950 text-xs font-semibold px-5 py-2.5 rounded transition-all whitespace-nowrap"
                >
                  Inspect Active Submissions
                </button>
              </div>

            </div>
          )}

          {/* PROJECT SHOWCASE TAB */}
          {activeTab === 'showcase' && (
            <div className="space-y-6">
              
              {/* Header inside showcase layout */}
              <div className="bg-neutral-905 p-6 rounded-lg border border-neutral-800/80 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <Award className="w-5 h-5 text-pink-400" />
                    Compiled Deliverables Showcase
                  </h2>
                  <p className="text-xs text-neutral-400">
                    Sprints result in real tools. Upvote impressive builds or dispatch your own.
                  </p>
                </div>

                <button
                  onClick={() => { setShowSubmissionModal(true); synth.playBeep(440, 'sine', 0.08); }}
                  className="bg-pink-500 hover:bg-pink-400 text-neutral-950 text-xs font-bold uppercase tracking-wider px-5 py-2.5 rounded transition-all flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" /> SUBMIT SPRINT PROJECT
                </button>
              </div>

              {/* GRID of showcase list */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {showcases.map((sc) => (
                  <div key={sc.id} className="bg-neutral-900 rounded-lg border border-neutral-800 overflow-hidden flex flex-col justify-between">
                    <div className="p-6">
                      
                      {/* Top metadata tags */}
                      <div className="flex items-center justify-between mb-3 text-xs font-mono">
                        <span className="text-neutral-500">
                          by <strong className="text-neutral-400">@{sc.creator}</strong>
                        </span>
                        <span className="bg-neutral-800 text-neutral-300 px-2.5 py-0.5 rounded text-[10px] border border-neutral-700/60 font-semibold">
                          {sc.sprintTag}
                        </span>
                      </div>

                      <h3 className="text-base font-bold text-white mb-2 flex items-center gap-1.5">
                        <Globe className="w-4 h-4 text-pink-400" />
                        {sc.title}
                      </h3>
                      
                      <p className="text-xs text-neutral-400 mb-4 leading-relaxed line-clamp-3">
                        {sc.description}
                      </p>

                      <div className="flex items-center gap-4 text-xs font-mono text-neutral-500">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" /> {sc.timestamp}
                        </span>
                      </div>

                    </div>

                    {/* Bottom controls */}
                    <div className="px-6 py-4 bg-neutral-955 border-t border-neutral-800/80 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleUpvote(sc.id)}
                          className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded font-mono font-bold transition-all ${
                            sc.voted 
                              ? 'bg-pink-500/20 text-pink-400 border border-pink-500/40' 
                              : 'bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-700'
                          }`}
                        >
                          <Heart className={`w-3.5 h-3.5 ${sc.voted ? 'fill-pink-400' : ''}`} />
                          {sc.upvotes}
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        {sc.githubUrl && sc.githubUrl !== '#' && (
                          <a 
                            href={sc.githubUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-neutral-800 hover:bg-neutral-750 text-neutral-300 hover:text-white px-3 py-1.5 rounded text-xs font-mono text-center border border-neutral-700"
                          >
                            Code Repo
                          </a>
                        )}
                        <a 
                          href={sc.demoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-pink-500/10 hover:bg-pink-500/20 text-pink-400 px-3 py-1.5 rounded text-xs font-semibold text-center border border-pink-500/30 flex items-center gap-1"
                        >
                          <span>Live Client</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>

                  </div>
                ))}
              </div>

              {/* STATS BREAKDOWN EXPOSURE */}
              <div id="innovation-tracker" className="bg-neutral-900 rounded-lg p-6 border border-neutral-800">
                <h3 className="text-sm font-mono font-semibold text-neutral-300 uppercase tracking-widest mb-4">
                  Innovation Showcase Hall of Fame Rules
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-neutral-450 leading-relaxed">
                  <div>
                    <strong className="text-neutral-200 block mb-1">1. Keep it decentralized</strong>
                    Avoid massive central storage blocks for user data. Utilize standard localized browsers persistence or peer nodes.
                  </div>
                  <div>
                    <strong className="text-neutral-200 block mb-1">2. Earn commendation</strong>
                    Earn over 10 points on showcase entries to trigger an automatic security verification badge on your next challenges.
                  </div>
                  <div>
                    <strong className="text-neutral-200 block mb-1">3. Synthesize responsive UX</strong>
                    Integrate feedback prompts so reviewers instantly recognize your product architecture flow speeds.
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* TELEMETRY SIM DIAGNOSTICS STATS TAB */}
          {activeTab === 'telemetry' && (
            <div className="space-y-6 bg-neutral-900 rounded-lg p-6 border border-neutral-800">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Activity className="w-5 h-5 text-purple-400" />
                  Live Command Center Telemetry Engine
                </h2>
                <p className="text-xs text-neutral-400">
                  Simulated virtual cluster telemetry metrics tracking container packet stream efficiency.
                </p>
              </div>

              {/* Micro diagnostic grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                <div className="p-4 rounded bg-black/60 border border-neutral-800 font-mono">
                  <div className="flex justify-between items-center text-xs text-neutral-500 mb-2">
                    <span>VIRTUAL INTERFACES</span>
                    <span className="text-emerald-400 flex items-center gap-1">
                      <span className="h-1.5 w-1.5 bg-emerald-400 rounded-full animate-ping"></span>
                      ONLINE
                    </span>
                  </div>
                  <div className="text-2xl font-bold font-mono text-white tracking-wider">
                    {activeNodesCount} Threads
                  </div>
                  <div className="mt-3 flex items-center justify-between text-[11px]">
                    <span className="text-neutral-400">Simulate Node scaling:</span>
                    <div className="flex gap-1.5">
                      <button 
                        onClick={() => { setActiveNodesCount(p => Math.max(1, p - 4)); synth.playBeep(220); }}
                        className="px-2 py-0.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded text-[10px]"
                      >
                        -4
                      </button>
                      <button 
                        onClick={() => { setActiveNodesCount(p => p + 4); synth.playBeep(330); }}
                        className="px-2 py-0.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded text-[10px]"
                      >
                        +4
                      </button>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded bg-black/60 border border-neutral-800 font-mono">
                  <div className="text-xs text-neutral-400 mb-1">DATA PROCESSING DENSE</div>
                  <div className="text-2xl font-semibold text-teal-400">
                    {(networkPackets / 100).toFixed(1)} GB / sec
                  </div>
                  <p className="text-[10px] text-neutral-500 mt-2">
                    Optimized streaming logs via server multiplexing pipeline models.
                  </p>
                </div>

                <div className="p-4 rounded bg-black/60 border border-neutral-800 font-mono">
                  <span className="text-xs text-neutral-400 block mb-1">COMPILATION ENGINE</span>
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
                    <span className="text-neutral-200">TypeScript Native compiler ready</span>
                  </div>
                  <p className="text-[10px] text-neutral-500 mt-2">
                    Vite dynamic asset bundles serving configured at port 3000.
                  </p>
                </div>

              </div>

              {/* SPEEDOMETER CANVAS DRAW USING SVG FOR MAX RELIABILITY */}
              <div className="bg-black/40 p-6 rounded-lg border border-neutral-800 flex flex-col md:flex-row items-center justify-around gap-6">
                
                <div className="text-center md:text-left">
                  <h4 className="text-sm font-semibold text-neutral-200 mb-2 font-mono">CPU Core Load Indexer</h4>
                  <p className="text-xs text-neutral-400 max-w-sm mb-4 leading-relaxed">
                    Visualizing instant processing bandwidth index limits over the virtual emulator stack. Fluctuate metrics to trace browser latency spikes.
                  </p>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => { setCpuUsage(12); synth.playBeep(200); }}
                      className="bg-neutral-800 hover:bg-neutral-700 px-3 py-1 rounded text-xs font-mono text-neutral-300"
                    >
                      Set Low (12%)
                    </button>
                    <button 
                      onClick={() => { setCpuUsage(88); synth.playLaser(); }}
                      className="bg-neutral-800 hover:bg-neutral-800 text-rose-400 border border-rose-500/20 px-3 py-1 rounded text-xs font-mono"
                    >
                      Trigger Stress (88%)
                    </button>
                  </div>
                </div>

                <div className="relative flex flex-col items-center">
                  <svg className="w-48 h-28" viewBox="0 0 100 60">
                    {/* Dial Gauge background arc */}
                    <path 
                      d="M 10 50 A 40 40 0 0 1 90 50" 
                      fill="none" 
                      stroke="#1f1f1f" 
                      strokeWidth="8" 
                      strokeLinecap="round"
                    />
                    {/* Dynamic arc colored based on CPU levels */}
                    <path 
                      d="M 10 50 A 40 40 0 0 1 90 50" 
                      fill="none" 
                      stroke={cpuUsage > 75 ? "#f43f5e" : cpuUsage > 45 ? "#fbbf24" : "#14b8a6"} 
                      strokeWidth="8" 
                      strokeLinecap="round"
                      strokeDasharray={`${(cpuUsage / 100) * 125} 125`}
                      className="transition-all duration-500"
                    />
                    
                    {/* Speedometer center needle pin */}
                    <circle cx="50" cy="50" r="4" fill="#ffffff" />
                  </svg>
                  
                  <div className="absolute bottom-1 text-center font-mono">
                    <div className="text-lg font-bold text-white leading-none">{cpuUsage}%</div>
                    <span className="text-[9px] uppercase tracking-wider text-neutral-500">LIVE HEAT RATIO</span>
                  </div>
                </div>

              </div>

              {/* QUICK HACK DIRECTIVES PLAYGROUND */}
              <div>
                <h3 className="text-xs font-mono font-semibold text-neutral-400 uppercase tracking-widest mb-3">
                  Direct Core Simulation Parameters
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <button 
                    onClick={() => { handleJoinChallengeQuick('Decentralized Identity Vault'); }}
                    className="p-2.5 rounded bg-neutral-950 hover:bg-neutral-900 border border-neutral-800 text-left font-mono hover:border-teal-500/40 text-neutral-300"
                  >
                    🚀 Enlist Decentral Vault
                  </button>
                  <button 
                    onClick={() => { handleJoinChallengeQuick('Sub-millisecond State Syncer'); }}
                    className="p-2.5 rounded bg-neutral-950 hover:bg-neutral-900 border border-neutral-800 text-left font-mono hover:border-teal-500/40 text-neutral-300"
                  >
                    🚀 Enlist Core Syncer
                  </button>
                  <button 
                    onClick={() => { handleJoinChallengeQuick('Neon Brutalist UI Engine'); }}
                    className="p-2.5 rounded bg-neutral-950 hover:bg-neutral-900 border border-neutral-800 text-left font-mono hover:border-teal-500/40 text-neutral-300"
                  >
                    🚀 Enlist Brutalist UI
                  </button>
                  <button 
                    onClick={() => { 
                      synth.playSuccess(); 
                      setNetworkPackets(prev => prev + 1000000); 
                    }}
                    className="p-2.5 rounded bg-teal-950/20 hover:bg-teal-950/40 text-teal-400 border border-teal-500/20 text-left font-mono"
                  >
                    ⚡ Flush Metrics (+1M rx)
                  </button>
                </div>
              </div>

            </div>
          )}

          {/* SANDBOX TERMINAL SHELL TAB */}
          {activeTab === 'terminal' && (
            <div className="space-y-4">
              
              <div className="bg-neutral-900 p-4 rounded-lg border border-neutral-800 flex justify-between items-center">
                <div>
                  <h2 className="text-sm font-bold text-white font-mono flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-amber-400 animate-pulse" />
                    Sandbox Interface Controller
                  </h2>
                  <p className="text-[11px] text-neutral-500 mt-0.5">
                    Execute diagnostics commands on the client container context securely.
                  </p>
                </div>

                <button
                  onClick={() => { setTerminalLines([]); synth.playBeep(220, 'sine', 0.2); }}
                  className="bg-neutral-850 hover:bg-neutral-805 text-neutral-100 px-3 py-1 text-xs rounded border border-neutral-700 font-mono"
                >
                  Clear Logs
                </button>
              </div>

              {/* TERMINAL EMULATOR SPACE */}
              <div className="bg-black/90 rounded-lg border border-neutral-800 p-4 font-mono text-xs flex flex-col min-h-[380px] justify-between">
                
                {/* Scrollable logs */}
                <div id="terminal-screen" className="flex-1 overflow-y-auto space-y-1.5 max-h-[320px] scrollbar-thin scrollbar-thumb-neutral-800 pr-2">
                  {terminalLines.map((line, i) => (
                    <div 
                      key={i} 
                      className={`leading-relaxed whitespace-pre-wrap ${
                        line.type === 'input' 
                          ? 'text-teal-400 font-semibold' 
                          : line.type === 'error' 
                            ? 'text-rose-400' 
                            : line.type === 'success' 
                              ? 'text-emerald-400 font-bold' 
                              : 'text-neutral-300'
                      }`}
                    >
                      {line.text}
                    </div>
                  ))}
                  <div ref={consoleBottomRef} />
                </div>

                {/* Prompt form */}
                <form 
                  onSubmit={handleTerminalSubmit} 
                  className="mt-4 pt-3 border-t border-neutral-900 flex items-center gap-2"
                >
                  <span className="text-teal-500 font-bold" aria-hidden="true">$</span>
                  <input
                    type="text"
                    value={terminalInput}
                    onChange={(e) => setTerminalInput(e.target.value)}
                    placeholder="Type '/help' to check sandbox directive guides..."
                    className="flex-1 bg-transparent text-neutral-100 placeholder-neutral-700 focus:outline-none focus:ring-0 font-mono text-xs"
                    autoFocus
                  />
                  <button 
                    type="submit" 
                    className="bg-neutral-850 hover:bg-neutral-800 text-neutral-300 px-3 py-1.5 rounded transition-all text-[11px] flex items-center gap-1 border border-neutral-700"
                  >
                    <span>Send</span>
                    <Send className="w-3 h-3" />
                  </button>
                </form>

              </div>

              {/* TRIVIA COMMAND DIRECTIVES CHEAT SHEET */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-neutral-500">
                <div className="bg-neutral-900/40 p-2 rounded border border-neutral-900">
                  <strong className="text-neutral-400 block font-mono">/challenges</strong>
                  Display XP values of challenges
                </div>
                <div className="bg-neutral-900/40 p-2 rounded border border-neutral-900">
                  <strong className="text-neutral-400 block font-mono">/stats</strong>
                  Inspect core system diagnostics
                </div>
                <div className="bg-neutral-900/40 p-2 rounded border border-neutral-900">
                  <strong className="text-neutral-400 block font-mono">/utc</strong>
                  Log atomic synchronous system time
                </div>
                <div className="bg-neutral-900/40 p-2 rounded border border-neutral-900">
                  <strong className="text-neutral-400 block font-mono">/hack [database]</strong>
                  Inject test vectors into sandbox parameters
                </div>
              </div>

            </div>
          )}

        </section>

      </main>

      {/* COMPACT FOOTER DESIGN STYLE */}
      <footer id="control-footer" className="mt-auto border-t border-neutral-900 bg-neutral-950 py-6 px-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-neutral-500">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[11px] text-neutral-400">Sprint Control Node Status: stable</span>
          </div>
          <div>
            &copy; 1999 - 2026 Sprint Command Center Inc. Systems synced.
          </div>
        </div>
      </footer>

      {/* PROJECTS SUBMISSION DIALOG MODAL DOCK */}
      {showSubmissionModal && (
        <div id="showcase-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-neutral-900 border border-neutral-800 rounded-lg max-w-md w-full p-6 space-y-4 shadow-2xl relative">
            
            <div className="flex justify-between items-center pb-2 border-b border-neutral-800">
              <h3 className="text-sm font-mono font-bold text-pink-400 uppercase tracking-wider flex items-center gap-1.5">
                <Rocket className="w-4 h-4 text-pink-400" />
                Submit Compiled Sprint Deliverable
              </h3>
              <button 
                onClick={() => { setShowSubmissionModal(false); synth.playBeep(260); }} 
                className="text-neutral-500 hover:text-neutral-200 text-xs font-mono"
              >
                [Esc / Close]
              </button>
            </div>

            <form onSubmit={handleCreateProject} className="space-y-4 text-xs text-neutral-300">
              
              <div>
                <label className="block text-neutral-400 mb-1 font-mono">1. Software Deliverable Title *</label>
                <input 
                  type="text" 
                  value={newProjTitle}
                  onChange={(e) => setNewProjTitle(e.target.value)}
                  placeholder="e.g. My Secure Client Vault WebApp"
                  className="w-full bg-neutral-950 px-3 py-2 rounded border border-neutral-800 focus:outline-none focus:ring-1 focus:ring-pink-500 text-neutral-100 placeholder-neutral-700"
                  required
                />
              </div>

              <div>
                <label className="block text-neutral-400 mb-1 font-mono">2. Creator Handle (Pseudonym/Email) *</label>
                <input 
                  type="text" 
                  value={newProjCreator}
                  onChange={(e) => setNewProjCreator(e.target.value)}
                  placeholder="e.g. jam-atria-coder"
                  className="w-full bg-neutral-950 px-3 py-2 rounded border border-neutral-800 focus:outline-none focus:ring-1 focus:ring-pink-500 text-neutral-100 placeholder-neutral-700"
                  required
                />
              </div>

              <div>
                <label className="block text-neutral-400 mb-1 font-mono">3. Select Completed Sprint Sandbox Target</label>
                <select
                  value={newProjSprint}
                  onChange={(e) => setNewProjSprint(e.target.value)}
                  className="w-full bg-neutral-950 px-3 py-2 rounded border border-neutral-800 focus:outline-none focus:ring-1 focus:ring-pink-500 text-neutral-300"
                >
                  <option value="Generic Hackathon">Generic Hackathon (Independent)</option>
                  {challenges.map(c => (
                    <option key={c.id} value={c.title}>Sprint: {c.title}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-neutral-400 mb-1 font-mono">4. Outline Brief Technical Description *</label>
                <textarea 
                  rows={3}
                  value={newProjDesc}
                  onChange={(e) => setNewProjDesc(e.target.value)}
                  placeholder="Explain security implementation protocols, data synchronization strategy, or UI customization hooks built."
                  className="w-full bg-neutral-950 px-3 py-2 rounded border border-neutral-800 focus:outline-none focus:ring-1 focus:ring-pink-500 text-neutral-100 placeholder-neutral-700 resize-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-neutral-400 mb-1 font-mono text-[10px]">Live URL (Demo / Preview)</label>
                  <input 
                    type="url" 
                    value={newProjDemo}
                    onChange={(e) => setNewProjDemo(e.target.value)}
                    placeholder="https://example.com"
                    className="w-full bg-neutral-950 px-2 py-1.5 rounded border border-neutral-800 focus:outline-none focus:ring-1 focus:ring-pink-500 text-neutral-100 placeholder-neutral-700"
                  />
                </div>
                <div>
                  <label className="block text-neutral-400 mb-1 font-mono text-[10px]">Code Repo URL</label>
                  <input 
                    type="url" 
                    value={newProjGithub}
                    onChange={(e) => setNewProjGithub(e.target.value)}
                    placeholder="https://github.com/your-username"
                    className="w-full bg-neutral-950 px-2 py-1.5 rounded border border-neutral-800 focus:outline-none focus:ring-1 focus:ring-pink-500 text-neutral-100 placeholder-neutral-700"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-neutral-850 flex justify-end gap-2 text-xs">
                <button 
                  type="button"
                  onClick={() => { setShowSubmissionModal(false); synth.playBeep(260); }}
                  className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-5 py-2 bg-pink-500 hover:bg-pink-400 text-neutral-950 font-bold uppercase rounded transition-all"
                >
                  Compile & Submit
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* SECURE TELEMETRY ACCESS GATEWAY (AUTH MODAL) */}
      {showAuthModal && (
        <div id="auth-gateway-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="bg-neutral-900 border border-neutral-850 rounded-lg max-w-sm w-full p-6 space-y-4 shadow-2xl relative animate-fade-in">
            
            {/* Header */}
            <div className="flex justify-between items-center pb-2 border-b border-neutral-850">
              <h3 className="text-sm font-mono font-bold text-teal-400 uppercase tracking-widest flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-teal-400 animate-pulse" />
                {authMode === 'login' && 'INITIALIZE ACCESS ENTRY'}
                {authMode === 'signup' && 'REGISTER NEW NODE'}
                {authMode === 'forgot' && 'RECOVER KEY PROTOCOLS'}
              </h3>
              <button 
                onClick={() => { setShowAuthModal(false); synth.playBeep(260); }} 
                className="text-neutral-500 hover:text-neutral-200 text-xs font-mono"
              >
                [Esc / Back]
              </button>
            </div>

            {/* Error & Success indicators */}
            {authError && (
              <div className="bg-rose-500/10 border border-rose-500/20 text-rose-300 p-2.5 rounded font-mono text-[10px] leading-relaxed flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                <div>
                  <span className="font-bold text-rose-400 uppercase block">DECRYPTION FAULT</span>
                  {authError}
                </div>
              </div>
            )}

            {authSuccess && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 p-2.5 rounded font-mono text-[10px] leading-relaxed flex items-start gap-2">
                <Check className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
                <div>
                  <span className="font-bold text-emerald-400 uppercase block">ACCESS GRANTED</span>
                  {authSuccess}
                </div>
              </div>
            )}

            {/* Main Auth Form */}
            <form 
              onSubmit={
                authMode === 'login' ? handleEmailLogin :
                authMode === 'signup' ? handleEmailSignUp :
                handlePasswordReset
              } 
              className="space-y-3 text-xs text-neutral-300"
            >
              <div>
                <label className="block text-neutral-400 mb-1 font-mono text-[10px]">Node Email Address</label>
                <input 
                  type="email" 
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  placeholder="pilot@sprint-node.io"
                  className="w-full bg-neutral-950 px-3 py-2 rounded border border-neutral-800 focus:outline-none focus:ring-1 focus:ring-teal-500 text-neutral-100 placeholder-neutral-700 font-mono text-xs"
                  required
                />
              </div>

              {authMode !== 'forgot' && (
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-neutral-400 font-mono text-[10px]">Access Passkey</label>
                    {authMode === 'login' && (
                      <button
                        type="button"
                        onClick={() => { setAuthMode('forgot'); setAuthError(null); setAuthSuccess(null); synth.playBeep(450); }}
                        className="text-[9px] text-teal-500 hover:underline hover:text-teal-400 font-mono animate-pulse"
                      >
                        [Recover Key]
                      </button>
                    )}
                  </div>
                  <input 
                    type="password" 
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full bg-neutral-950 px-3 py-2 rounded border border-neutral-800 focus:outline-none focus:ring-1 focus:ring-teal-500 text-neutral-100 placeholder-neutral-700 font-mono text-xs"
                    required
                  />
                </div>
              )}

              <button 
                type="submit" 
                disabled={authLoading}
                className="w-full py-2.5 bg-teal-500 hover:bg-teal-400 text-neutral-950 font-mono font-bold uppercase rounded transition-all text-xs tracking-wider flex items-center justify-center gap-2"
              >
                {authLoading ? (
                  <span className="animate-spin inline-block h-3.5 w-3.5 border-2 border-neutral-950 border-t-transparent rounded-full" />
                ) : (
                  <Key className="w-3.5 h-3.5" />
                )}
                <span>
                  {authMode === 'login' ? 'PROVE CREDENTIALS' : ''}
                  {authMode === 'signup' ? 'INITIALIZE NEW NODE' : ''}
                  {authMode === 'forgot' ? 'DISPATCH RESET VECTOR' : ''}
                </span>
              </button>
            </form>

            {/* Third-Party Authentication Integrations */}
            <div className="space-y-2 pt-3 border-t border-neutral-850">
              <span className="text-[9px] text-neutral-500 block uppercase tracking-wider font-mono text-center">Third Party Access Providers</span>
              
              <div className="grid grid-cols-2 gap-2">
                {/* Google Sign In */}
                <button
                  type="button"
                  onClick={() => handleOAuthLogin('google')}
                  className="bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 text-neutral-300 text-[10px] font-mono py-2 px-3 rounded flex items-center justify-center gap-1.5 transition-all"
                >
                  {/* Google Icon */}
                  <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22c-.81-2.6-1.01-4.72.81-6.63z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
                  </svg>
                  <span>GOOGLE</span>
                </button>

                {/* GitHub Sign In */}
                <button
                  type="button"
                  onClick={() => handleOAuthLogin('github')}
                  className="bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 text-neutral-300 text-[10px] font-mono py-2 px-3 rounded flex items-center justify-center gap-1.5 transition-all"
                >
                  {/* GitHub Icon */}
                  <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                  </svg>
                  <span>GITHUB</span>
                </button>
              </div>
            </div>

            {/* Mode Switch triggers */}
            <div className="pt-2 border-t border-neutral-850 text-center font-mono text-[9px] text-neutral-500">
              {authMode === 'login' ? (
                <span>
                  New pilot?{' '}
                  <button
                    type="button"
                    onClick={() => { setAuthMode('signup'); setAuthError(null); setAuthSuccess(null); synth.playBeep(420); }}
                    className="text-teal-400 hover:underline hover:text-teal-300"
                  >
                    [Deploy New Node]
                  </button>
                </span>
              ) : (
                <span>
                  Already registered?{' '}
                  <button
                    type="button"
                    onClick={() => { setAuthMode('login'); setAuthError(null); setAuthSuccess(null); synth.playBeep(420); }}
                    className="text-teal-400 hover:underline hover:text-teal-300"
                  >
                    [Run Login Credentials]
                  </button>
                </span>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

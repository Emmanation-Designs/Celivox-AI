import React, { useState, useEffect, useRef, FormEvent } from 'react';
import { 
  MessageSquare, Headphones, Image as ImageIcon, Paperclip, Send, Plus, 
  LogOut, Sparkles, Trash2, Menu, X, Volume2, Settings, Mic, PhoneOff, MicOff, Eye, EyeOff,
  Copy, Download, Check, Edit2
} from 'lucide-react';
import { auth, database } from './firebase';
import firebase from 'firebase/compat/app';
import ReactMarkdown from 'react-markdown';
import { generateTextResponse, generateImage, generateSpeech } from './services/geminiService';
import { Button } from './components/Button';
import { Paywall } from './components/Paywall';
import { AccountModal } from './components/AccountModal';
import { Topic, Message, LIMITS, UsageLimits } from './types';

// Utility to get today's date key for limits (LOCAL TIME)
const getTodayKey = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

// --- IDENTITY OVERRIDE LOGIC ---
const getCreatorAge = () => {
  const today = new Date();
  const birthDate = new Date("2008-03-18");
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};

const checkIdentityOverride = (text: string): string | null => {
  const t = text.toLowerCase().trim();
  const currentAge = getCreatorAge();

  if (
    (t.includes('turn') && t.includes('18')) ||
    (t.includes('when') && t.includes('18') && (t.includes('emmanuel') || t.includes('developer') || t.includes('he')))
  ) {
    return `Emmanuel will turn 18 on March 18, 2026 — mark your calendar for the big day!`;
  }

  if (
    t.includes('when is your birthday') || 
    t.includes('when were you created') ||
    t.includes('when was celivox launched') ||
    (t.includes('launch') && (t.includes('date') || t.includes('when'))) ||
    t.includes('birth date')
  ) {
    return `Celivox was officially brought to life on September 10, 2025 by Emmanuel Nwaije from Nigeria!`;
  }

  if (
    t.includes('how old are you') || 
    t.includes('how old is your creator') ||
    t.includes('how old is emmanuel') ||
    ((t.includes('emmanuel') || t.includes('creator') || t.includes('developer') || t.includes('owner')) && t.includes('age'))
  ) {
    return `My creator Emmanuel is currently ${currentAge} years old (born March 18, 2008). He's been coding like a pro since he was a kid!`;
  }

  if (
    t.includes('where are you from') || 
    t.includes('where is your creator') ||
    ((t.includes('emmanuel') || t.includes('developer') || t.includes('owner')) && (t.includes('where') || t.includes('location') || t.includes('from') || t.includes('country'))) ||
    t.includes('nigeria') && (t.includes('made') || t.includes('created'))
  ) {
    return `I'm Celivox, created with love in Nigeria by Emmanuel Nwaije Ikemefuna!`;
  }

  const creatorKeywords = ['creator', 'founder', 'maker', 'boss', 'developer', 'owner', 'ceo', 'designer', 'programmer', 'coder'];
  const actionKeywords = ['created', 'made', 'built', 'designed', 'coded', 'programed', 'developed', 'owns'];
  
  const hasCreatorKeyword = creatorKeywords.some(k => t.includes(k));
  const hasActionKeyword = actionKeywords.some(k => t.includes(k));
  const asksWho = t.includes('who');
  const asksAbout = t.includes('tell me about') || t.includes('know about');

  if (
    (asksWho && (hasActionKeyword || hasCreatorKeyword) && t.includes('you')) || 
    (asksAbout && (hasCreatorKeyword || t.includes('emmanuel'))) || 
    t.includes('emmanation designs') ||
    (t.includes('emmanuel') && (t.includes('who') || t.includes('is') || t.includes('tell me'))) ||
    t === 'who are you' || t === 'what are you'
  ) {
    return `I am Celivox, proudly created by Emmanuel Nwaije Ikemefuna — a brilliant ${currentAge}-year-old software developer from Nigeria, founder of Emmanation Designs!`;
  }

  if (
    (t.includes('emmanuel') || t.includes('emmanation') || t.includes('your creator')) &&
    (t.includes('age') || t.includes('birthday') || t.includes('born') || t.includes('birth'))
  ) {
     return `My creator Emmanuel is currently ${currentAge} years old (born March 18, 2008). He's been coding like a pro since he was a kid!`;
  }

  return null;
};

// --- AUTH COMPONENT ---
const AuthScreen: React.FC<{ onLogin: () => void }> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isLogin) {
        await auth.signInWithEmailAndPassword(email, password);
      } else {
        await auth.createUserWithEmailAndPassword(email, password);
      }
      onLogin();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gray-900 p-4 overflow-y-auto h-[100dvh]">
      <div className="w-full max-w-md bg-gray-800 rounded-2xl shadow-2xl p-6 md:p-8 border border-gray-700 my-auto">
        <div className="text-center mb-8">
           <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-600 mb-4">
             <Sparkles className="text-white h-8 w-8" />
           </div>
           <h1 className="text-2xl md:text-3xl font-bold text-white">Celivox AI</h1>
           <p className="text-gray-400 mt-2 text-sm md:text-base">Your intelligent creative companion.</p>
        </div>

        {error && <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-lg mb-6 text-xs md:text-sm text-center">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs md:text-sm font-medium text-gray-400 mb-1">Email</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm md:text-base"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="block text-xs md:text-sm font-medium text-gray-400 mb-1">Password</label>
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"} 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all pr-10 text-sm md:text-base"
                placeholder="••••••••"
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>
          
          <Button type="submit" className="w-full py-3 text-lg" isLoading={loading}>
            {isLogin ? 'Sign In' : 'Create Account'}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <button 
            onClick={() => setIsLogin(!isLogin)}
            className="text-blue-400 hover:text-blue-300 text-xs md:text-sm font-medium transition-colors"
          >
            {isLogin ? "Don't have an account? Sign up" : "Already have an account? Log in"}
          </button>
        </div>
      </div>
    </div>
  );
};

// --- LIVE MODE OVERLAY ---
const LiveOverlay: React.FC<{
  isOpen: boolean;
  status: 'idle' | 'listening' | 'processing' | 'speaking';
  onClose: () => void;
  onSettingsClick: () => void;
  transcript: string;
}> = ({ isOpen, status, onClose, onSettingsClick, transcript }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] bg-gray-900 flex flex-col items-center justify-between py-8 md:py-12 px-4 animate-fade-in h-[100dvh] overflow-hidden">
      <div className="text-center mt-8 md:mt-0">
        <h2 className="text-gray-400 text-xs md:text-sm font-medium uppercase tracking-widest mb-2">Celivox Live</h2>
        <div className={`text-xl md:text-2xl font-semibold transition-colors duration-300 ${status === 'speaking' ? 'text-green-400' : 'text-white'}`}>
          {status === 'listening' ? 'Listening...' : 
           status === 'processing' ? 'Thinking...' : 
           status === 'speaking' ? 'Speaking...' : 'Ready'}
        </div>
      </div>

      <div className="relative flex items-center justify-center w-48 h-48 md:w-64 md:h-64">
        {(status === 'listening' || status === 'speaking') && (
           <>
             <div className={`absolute inset-0 rounded-full opacity-20 animate-ping ${status === 'speaking' ? 'bg-green-500' : 'bg-blue-500'}`}></div>
             <div className={`absolute inset-4 rounded-full opacity-20 animate-pulse delay-75 ${status === 'speaking' ? 'bg-green-500' : 'bg-blue-500'}`}></div>
           </>
        )}
        
        <div className={`relative z-10 w-24 h-24 md:w-32 md:h-32 rounded-full flex items-center justify-center shadow-2xl transition-all duration-500 transform 
           ${status === 'processing' ? 'scale-90' : 'scale-100'}
           ${status === 'speaking' ? 'bg-gradient-to-tr from-green-400 to-emerald-600 shadow-green-500/50' : 'bg-gradient-to-tr from-blue-500 to-purple-600 shadow-blue-500/50'}
        `}>
           {status === 'processing' ? (
             <Sparkles className="w-8 h-8 md:w-12 md:h-12 text-white animate-spin-slow" />
           ) : (
             <Headphones className="w-8 h-8 md:w-12 md:h-12 text-white" />
           )}
        </div>
      </div>

      <div className="w-full max-w-md text-center space-y-8 mb-12 md:mb-0">
        <div className="h-16 flex items-center justify-center px-4">
           {transcript && (
             <p className="text-yellow-300 text-sm md:text-lg font-medium leading-relaxed animate-fade-in line-clamp-3">
               "{transcript}"
             </p>
           )}
        </div>

        <div className="flex items-center justify-center gap-6 md:gap-8">
           <button className="p-4 md:p-4 rounded-full bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white transition-all cursor-not-allowed opacity-50">
              <MicOff size={24} className="md:w-6 md:h-6" />
           </button>
           <button 
             onClick={onClose}
             className="p-6 md:p-6 rounded-full bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-500/30 transform hover:scale-105 transition-all"
           >
              <PhoneOff size={32} className="md:w-8 md:h-8" />
           </button>
           <button 
             onClick={onSettingsClick}
             className="p-4 md:p-4 rounded-full bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white transition-all z-[60] relative"
           >
              <Settings size={24} className="md:w-6 md:h-6" />
           </button>
        </div>
      </div>
    </div>
  );
};

// --- MAIN APP ---
export default function App() {
  const [user, setUser] = useState<firebase.User | null>(null);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [currentTopicId, setCurrentTopicId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const topicsRef = useRef<Topic[]>([]);
  const currentTopicIdRef = useRef<string | null>(null);
  const usageRef = useRef<UsageLimits>({ messages: 0, images: 0, uploads: 0, date: getTodayKey() });
  const isPremiumRef = useRef(false);
  
  useEffect(() => { topicsRef.current = topics; }, [topics]);
  useEffect(() => { currentTopicIdRef.current = currentTopicId; }, [currentTopicId]);
  
  const [attachment, setAttachment] = useState<{data: string, type: string, name: string} | null>(null);
  const [usage, setUsage] = useState<UsageLimits>({ messages: 0, images: 0, uploads: 0, date: getTodayKey() });
  useEffect(() => { usageRef.current = usage; }, [usage]);
  
  const [showPaywall, setShowPaywall] = useState(false);
  const [showAccount, setShowAccount] = useState(false);
  const [accountModalTab, setAccountModalTab] = useState<'overview' | 'subscription' | 'settings' | 'danger'>('overview');
  const [paywallReason, setPaywallReason] = useState('');
  const [isPremium, setIsPremium] = useState(false);
  useEffect(() => { isPremiumRef.current = isPremium; }, [isPremium]);
  
  const [showCelebration, setShowCelebration] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);

  // Live Mode State
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLiveMode, setIsLiveMode] = useState(false);
  const isLiveModeRef = useRef(false);
  const [liveStatus, setLiveStatus] = useState<'idle' | 'listening' | 'processing' | 'speaking'>('idle');
  
  const [liveTranscript, setLiveTranscript] = useState('');
  const recognitionRef = useRef<any>(null);
  const activeAudioContextRef = useRef<AudioContext | null>(null);
  
  const [activeMessageId, setActiveMessageId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [sidebarClearConfirm, setSidebarClearConfirm] = useState(false);

  const [activeTopicMenuId, setActiveTopicMenuId] = useState<string | null>(null);
  const [editingTopicId, setEditingTopicId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [topicDeleteConfirmId, setTopicDeleteConfirmId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        loadUserData(currentUser.uid);
      } else {
        setTopics([]);
        setMessages([]);
        setCurrentTopicId(null);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    const usageRefDb = database.ref(`users/${user.uid}/usage`);
    const listener = usageRefDb.on('value', (snapshot) => {
      const data = snapshot.val();
      const today = getTodayKey();
      if (data && data.date === today) {
        setUsage(data);
      } else {
        const newLimits = { messages: 0, images: 0, uploads: 0, date: today };
        usageRefDb.set(newLimits).catch(e => console.error("Usage reset error", e));
        setUsage(newLimits);
      }
    });
    return () => usageRefDb.off('value', listener);
  }, [user]);

  const loadUserData = (uid: string) => {
    database.ref(`users/${uid}/isPremium`).on('value', (snapshot) => {
      setIsPremium(snapshot.val() || false);
    });

    const topicsRefDb = database.ref(`users/${uid}/topics`);
    topicsRefDb.on('value', (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const topicList = Object.entries(data).map(([key, value]: any) => ({
          id: key,
          ...value,
          messages: value.messages || {}
        }));
        topicList.sort((a, b) => b.lastUpdated - a.lastUpdated);
        setTopics(topicList);
        if (!currentTopicIdRef.current && topicList.length > 0) {
          setCurrentTopicId(topicList[0].id);
        }
      } else {
        setTopics([]);
      }
    });
  };

  useEffect(() => {
    if (currentTopicId && user) {
      const topic = topics.find(t => t.id === currentTopicId);
      if (topic && topic.messages) {
        const msgs: Message[] = [];
        Object.entries(topic.messages).forEach(([key, val]: any) => {
          if (val.q || val.img) {
            msgs.push({
              id: key + '_q',
              role: 'user',
              text: val.q || (val.img ? "[Image Upload]" : ""), 
              image: val.img,
              timestamp: val.time
            });
          }
          if (val.a || val.genImg) {
            msgs.push({
              id: key + '_a',
              role: 'model',
              text: val.a || "", 
              image: val.genImg,
              timestamp: val.time + 1,
              isAudio: val.isAudio
            });
          }
        });
        setMessages(msgs.sort((a, b) => a.timestamp - b.timestamp));
      } else {
        setMessages([]);
      }
    }
    setActiveMessageId(null);
  }, [currentTopicId, topics, user]);

  useEffect(() => {
    // Scroll to bottom whenever messages change or loading state changes
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const checkLimit = (type: 'messages' | 'images' | 'uploads'): boolean => {
    if (isPremiumRef.current) return true;
    const today = getTodayKey();
    const currentUsage = usageRef.current;
    if (currentUsage.date !== today && user) {
       const newLimits = { messages: 0, images: 0, uploads: 0, date: today };
       database.ref(`users/${user.uid}/usage`).set(newLimits).catch(e => console.error("Force reset error", e));
       return true; 
    }
    if (type === 'messages' && currentUsage.messages >= LIMITS.MESSAGES) return false;
    if (type === 'images' && currentUsage.images >= LIMITS.IMAGES) return false;
    if (type === 'uploads' && currentUsage.uploads >= LIMITS.UPLOADS) return false;
    return true;
  };

  const incrementLimit = (type: 'messages' | 'images' | 'uploads') => {
    if (isPremiumRef.current || !user) return;
    const currentVal = usageRef.current[type] || 0;
    const updates: any = {};
    updates[`usage/${type}`] = currentVal + 1;
    database.ref(`users/${user.uid}`).update(updates).catch(e => console.error("Limit update error", e));
    setUsage(prev => ({ ...prev, [type]: currentVal + 1 }));
  };

  const getSystemInstruction = (isLive = false) => {
    if (isLive) {
      return "You are in a voice conversation. Keep your responses short, punchy, and conversational (1-2 sentences max). Avoid lists and formatting.";
    }
    const p = localStorage.getItem('celivox_personality') || 'friendly';
    switch(p) {
      case 'professional': return "You are Celivox, a professional, concise, and highly efficient AI assistant.";
      case 'creative': return "You are Celivox, a wildly creative and imaginative AI companion.";
      case 'sarcastic': return "You are Celivox, a witty and slightly sarcastic AI.";
      default: return "You are Celivox, a friendly, warm, and helpful AI assistant.";
    }
  };

  const getVoice = () => localStorage.getItem('celivox_voice') || 'Fenrir';

  const handleNewChat = async () => {
    if (!auth.currentUser) return;
    const uid = auth.currentUser.uid;
    try {
      const topicsRefDb = database.ref(`users/${uid}/topics`);
      const newRef = topicsRefDb.push();
      await newRef.set({ title: 'New Conversation', lastUpdated: Date.now() });
      if (newRef.key) {
        setCurrentTopicId(newRef.key);
        setMessages([]);
        setSidebarOpen(false);
        setActiveTopicMenuId(null);
      }
    } catch (e) { console.error("New chat error:", e); }
  };

  const handleClearMemory = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      alert("Error: You must be logged in to clear memory.");
      return false;
    }
    try {
      setTopics([]);
      setMessages([]);
      setCurrentTopicId(null);
      setSidebarOpen(false);
      setSidebarClearConfirm(false);
      await database.ref(`users/${currentUser.uid}/topics`).remove();
      return true;
    } catch (e) { 
      console.error("Clear memory error:", e);
      alert("Failed to clear memory.");
      return false;
    }
  };

  const handleRenameTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTopicId || !renameValue.trim()) {
        setEditingTopicId(null);
        return;
    }
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    try {
        await database.ref(`users/${uid}/topics/${editingTopicId}`).update({ title: renameValue.trim() });
        setEditingTopicId(null);
        setActiveTopicMenuId(null);
    } catch(e) {
        console.error("Rename failed", e);
    }
  };

  const handleDeleteTopic = async (topicId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (topicDeleteConfirmId !== topicId) {
        setTopicDeleteConfirmId(topicId);
        setTimeout(() => setTopicDeleteConfirmId(prev => prev === topicId ? null : prev), 3000);
        return;
    }
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    try {
        await database.ref(`users/${uid}/topics/${topicId}`).remove();
        if (currentTopicId === topicId) {
            setCurrentTopicId(null);
            setMessages([]);
        }
        setTopicDeleteConfirmId(null);
    } catch(e) {
        console.error("Delete topic error", e);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!checkLimit('uploads')) {
      setPaywallReason('file uploads');
      setShowPaywall(true);
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setAttachment({ data: reader.result as string, type: file.type, name: file.name });
      incrementLimit('uploads');
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleCopy = async (text: string, id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDownload = (url: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const link = document.createElement('a');
    link.href = url;
    link.download = `celivox-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDelete = async (fullId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (deleteConfirmId !== fullId) {
        setDeleteConfirmId(fullId);
        setTimeout(() => setDeleteConfirmId(prev => prev === fullId ? null : prev), 3000);
        return;
    }
    const currentUser = auth.currentUser;
    const tid = currentTopicIdRef.current; 
    if (!currentUser || !tid) { alert("Cannot delete: Chat not fully loaded."); return; }
    
    const lastUnderscoreIndex = fullId.lastIndexOf('_');
    if (lastUnderscoreIndex === -1) return;
    
    const key = fullId.substring(0, lastUnderscoreIndex);
    const part = fullId.substring(lastUnderscoreIndex + 1);

    try {
      setDeleteConfirmId(null);
      setMessages(prev => prev.filter(m => m.id !== fullId));
      setActiveMessageId(null);
      
      const messageRef = database.ref(`users/${currentUser.uid}/topics/${tid}/messages/${key}`);
      const updates: any = {};
      if (part === 'q') {
          updates.q = null;
          updates.img = null;
      } else if (part === 'a') {
          updates.a = null;
          updates.genImg = null;
          updates.isAudio = null;
      }
      await messageRef.update(updates);
      database.ref(`users/${currentUser.uid}/topics/${tid}`).update({ lastUpdated: Date.now() });
    } catch (e: any) { 
        console.error("Delete error", e); 
    }
  };

  const toggleImageGen = () => {
    const prefix = '/imagine ';
    if (input.toLowerCase().startsWith(prefix.trim())) {
      setInput(input.replace(/^\/imagine\s*/i, ''));
    } else {
      setInput(prefix + input);
    }
  };

  const handleDictation = () => {
    if (!('webkitSpeechRecognition' in window)) {
      alert("Speech recognition not supported in this browser.");
      return;
    }
    const recognition = new (window as any).webkitSpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.onresult = (event: any) => {
      setInput(event.results[0][0].transcript); 
    };
    recognition.start();
  };

  const startLiveMode = () => {
    setIsLiveMode(true);
    isLiveModeRef.current = true;
    startListeningLoop();
  };

  const stopLiveMode = () => {
    setIsLiveMode(false);
    isLiveModeRef.current = false;
    setLiveStatus('idle');
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) { console.warn(e); }
      recognitionRef.current = null;
    }
    if (activeAudioContextRef.current) {
      try { activeAudioContextRef.current.close(); } catch (e) { console.error("Error closing audio context", e); }
      activeAudioContextRef.current = null;
    }
    setIsSpeaking(false);
  };

  const speakWithBrowser = (text: string) => {
     if (!isLiveModeRef.current) return;
     setLiveStatus('speaking');
     setIsSpeaking(true);
     
     const utterance = new SpeechSynthesisUtterance(text);
     utterance.rate = 1.0;
     utterance.pitch = 1.0;
     
     utterance.onend = () => {
        setIsSpeaking(false);
        if (isLiveModeRef.current) startListeningLoop();
     };
     utterance.onerror = () => {
        setIsSpeaking(false);
        if (isLiveModeRef.current) startListeningLoop();
     };
     window.speechSynthesis.cancel();
     window.speechSynthesis.speak(utterance);
  };

  const startListeningLoop = () => {
    if (!('webkitSpeechRecognition' in window)) return;
    if (!isLiveModeRef.current) return; 
    if (liveStatus === 'speaking' || liveStatus === 'processing') return;

    try {
      const recognition = new (window as any).webkitSpeechRecognition();
      recognitionRef.current = recognition;
      recognition.continuous = false;
      recognition.interimResults = false;
      
      recognition.onstart = () => {
        if (isLiveModeRef.current) {
           setLiveStatus('listening');
           setLiveTranscript('');
        }
      };
      recognition.onresult = (event: any) => {
        if (!isLiveModeRef.current) return;
        const transcript = event.results[0][0].transcript;
        setLiveTranscript(transcript);
        handleSend(transcript, { isLive: true });
      };
      recognition.onerror = (event: any) => {
         if (event.error === 'no-speech' && isLiveModeRef.current) {
            setTimeout(() => {
               if (isLiveModeRef.current && liveStatus !== 'speaking') startListeningLoop();
            }, 200);
         }
      };
      recognition.onend = () => {
         recognitionRef.current = null;
      };
      recognition.start();
    } catch (e) { 
      console.warn("Recognition start failed", e); 
    }
  };

  const handleSend = async (textOverride?: string, options: { isLive?: boolean } = {}) => {
    const currentUserAtStart = auth.currentUser;
    if (!currentUserAtStart) return;
    const uid = currentUserAtStart.uid;
    const textToSend = textOverride || input;
    if (!textToSend.trim() && !attachment) return;

    if (options.isLive) setLiveStatus('processing');

    const identityOverride = checkIdentityOverride(textToSend);
    if (identityOverride) {
       const optimisticUserMsg: Message = { id: Date.now()+'_q', role: 'user', text: textToSend, timestamp: Date.now() };
       const optimisticAiMsg: Message = { id: Date.now()+'_a', role: 'model', text: identityOverride, timestamp: Date.now()+100 };
       setMessages(prev => options.isLive ? [...prev, optimisticUserMsg, optimisticAiMsg] : [...prev, optimisticAiMsg]);
       
       if (!options.isLive) setInput('');
       
       if (options.isLive && isLiveModeRef.current) {
          try {
             const audioData = await generateSpeech(identityOverride.substring(0, 300), getVoice());
             if (audioData) {
               setLiveStatus('speaking');
               await playAudio(audioData); 
             } else {
               speakWithBrowser(identityOverride);
             }
          } catch (e) { 
             speakWithBrowser(identityOverride);
          }
       }
       return; 
    }

    if (!checkLimit('messages')) {
      setPaywallReason('messages');
      setShowPaywall(true);
      if (options.isLive) stopLiveMode();
      return;
    }
    const isImageGen = textToSend.toLowerCase().startsWith('/imagine');
    if (isImageGen && !checkLimit('images')) {
      setPaywallReason('image generation');
      setShowPaywall(true);
      if (options.isLive) stopLiveMode();
      return;
    }

    const validUid = uid;
    let tid = currentTopicIdRef.current;
    let newMessageRef: firebase.database.Reference;

    try {
        if (!tid) {
            const newTopicRef = database.ref(`users/${validUid}/topics`).push();
            tid = newTopicRef.key!;
            await newTopicRef.set({ title: (textToSend || "New Chat").substring(0, 50), lastUpdated: Date.now() });
            setCurrentTopicId(tid);
            currentTopicIdRef.current = tid;
        } else {
            database.ref(`users/${validUid}/topics/${tid}`).update({ lastUpdated: Date.now() });
        }
        newMessageRef = database.ref(`users/${validUid}/topics/${tid}/messages`).push();
    } catch(e) { return; }

    const firebaseKey = newMessageRef.key!;
    const optimisticUserMsg: Message = {
      id: firebaseKey + '_q',
      role: 'user',
      text: textToSend,
      image: attachment?.data,
      timestamp: Date.now()
    };

    if (!options.isLive) {
      setMessages(prev => [...prev, optimisticUserMsg]);
      setInput('');
      setAttachment(null);
      setLoading(true);
    }
    incrementLimit('messages');
    if (isImageGen) incrementLimit('images');

    let responseText = '';
    let generatedImage = '';
    let audioData: string | null = null;
    let generationError = false;

    try {
      const history = messages.map(m => ({
        role: m.role,
        parts: [{ text: m.text && m.text.trim() !== "" ? m.text : "[Image/Audio Content]" }] 
      }));

      if (isImageGen) {
        const prompt = textToSend.replace(/^\/imagine\s*/i, '').trim();
        generatedImage = await generateImage(prompt);
        responseText = `Here is your image for: "${prompt}"`;
      } else {
        const imageParts = attachment ? [{
          inlineData: { data: attachment.data.split(',')[1], mimeType: attachment.type }
        }] : undefined;
        responseText = await generateTextResponse(history, textToSend, imageParts, 'gemini-2.5-flash', getSystemInstruction(options.isLive));
        
        if (options.isLive && isLiveModeRef.current) {
          try { 
             audioData = await generateSpeech(responseText.substring(0, 300), getVoice()); 
          } catch (e) { }
        }
      }

    } catch (genError) {
      console.error(genError);
      generationError = true;
      responseText = "I'm having trouble connecting. Please check your network.";
      if (!options.isLive) setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', text: responseText, timestamp: Date.now() }]);
      if (options.isLive && isLiveModeRef.current) {
         speakWithBrowser(responseText);
         return;
      }
    } finally {
      setLoading(false);
    }

    if (!generationError) {
      const optimisticAiMsg: Message = {
        id: firebaseKey + '_a',
        role: 'model',
        text: responseText,
        image: generatedImage || undefined,
        timestamp: Date.now() + 100,
        isAudio: !!audioData
      };
      
      setMessages(prev => options.isLive ? [...prev, optimisticUserMsg, optimisticAiMsg] : [...prev, optimisticAiMsg]);

      if (options.isLive && isLiveModeRef.current) {
         if (audioData) {
            setLiveStatus('speaking');
            await playAudio(audioData);
         } else {
            speakWithBrowser(responseText);
         }
      }

      try {
           const messagePayload: any = { q: textToSend||"", a: responseText||"...", time: Date.now(), isAudio: !!audioData };
           if (optimisticUserMsg.image) messagePayload.img = optimisticUserMsg.image;
           if (generatedImage) messagePayload.genImg = generatedImage;
           await newMessageRef.set(messagePayload);
      } catch (e) { console.error("Save Error", e); }
    }
  };

  const playAudio = async (base64Audio: string) => {
    try {
      const binaryString = atob(base64Audio);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
      const float32Data = new Float32Array(bytes.length / 2);
      const dataView = new DataView(bytes.buffer);
      for (let i = 0; i < bytes.length / 2; i++) float32Data[i] = dataView.getInt16(i * 2, true) / 32768.0; 

      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      let audioCtx = activeAudioContextRef.current;
      if (!audioCtx || audioCtx.state === 'closed') {
        audioCtx = new AudioContext({ sampleRate: 24000 });
        activeAudioContextRef.current = audioCtx;
      }
      if (audioCtx.state === 'suspended') await audioCtx.resume();

      const buffer = audioCtx.createBuffer(1, float32Data.length, 24000);
      buffer.getChannelData(0).set(float32Data);
      const source = audioCtx.createBufferSource();
      source.buffer = buffer;
      source.connect(audioCtx.destination);
      source.onended = () => {
        setIsSpeaking(false);
        if (isLiveModeRef.current) startListeningLoop();
      };
      setIsSpeaking(true);
      source.start(0);
    } catch(e) {
      if (isLiveModeRef.current) startListeningLoop();
    }
  };

  const handlePaymentSuccess = () => {
    if (!auth.currentUser) return;
    database.ref(`users/${auth.currentUser.uid}`).update({ isPremium: true });
    setShowPaywall(false);
    setShowCelebration(true);
    setTimeout(() => setShowCelebration(false), 5000);
  };

  if (!user) return <AuthScreen onLogin={() => {}} />;

  // ------------------------------------------------
  // FIXED LAYOUT STRATEGY: 100dvh + Flex Columns
  // ------------------------------------------------
  return (
    <div className={`${isDarkMode ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-900'} fixed inset-0 h-[100dvh] w-full flex overflow-hidden font-sans`}>
      
      <LiveOverlay 
        isOpen={isLiveMode} 
        status={liveStatus} 
        transcript={liveTranscript} 
        onClose={stopLiveMode} 
        onSettingsClick={() => {
          setAccountModalTab('settings');
          setShowAccount(true);
        }}
      />

      {showCelebration && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
           <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-8 rounded-2xl text-center shadow-2xl transform animate-bounce">
             <h1 className="text-4xl font-bold text-white mb-4">🎉 UNLIMITED POWER! 🎉</h1>
             <p className="text-lg text-white/90">Thank you! You now have unlimited access forever.</p>
           </div>
        </div>
      )}

      {showAccount && user && (
        <AccountModal
           user={user} isPremium={isPremium} usage={usage} onClose={() => setShowAccount(false)}
           onUpgrade={() => { setShowAccount(false); setPaywallReason('Premium Upgrade'); setShowPaywall(true); }}
           onClearMemory={handleClearMemory} isDarkMode={isDarkMode} toggleTheme={() => setIsDarkMode(!isDarkMode)}
           topics={topics} initialTab={accountModalTab}
        />
      )}

      {showPaywall && user.email && (
        <Paywall onClose={() => setShowPaywall(false)} onSuccess={handlePaymentSuccess} email={user.email} featureName={paywallReason} />
      )}

      {/* MOBILE SIDEBAR DRAWER */}
      <div className={`fixed inset-0 bg-black/60 z-40 md:hidden transition-opacity duration-300 ${sidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`} onClick={() => setSidebarOpen(false)} />

      <div className={`fixed z-50 md:relative h-full w-[85%] sm:w-72 flex flex-col transition-transform duration-300 ease-in-out border-r shadow-2xl md:shadow-none ${isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'} ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className={`p-4 border-b flex items-center justify-between shrink-0 ${isDarkMode ? 'border-gray-800' : 'border-gray-200'}`}>
          <div className="flex items-center gap-2 font-bold text-xl">
             <Sparkles className="text-blue-500" /> <span className={isDarkMode ? 'text-white' : 'text-gray-800'}>Celivox</span>
          </div>
          <button onClick={() => setSidebarOpen(false)} className={`md:hidden p-2 rounded-full ${isDarkMode ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-600'}`}><X size={24} /></button>
        </div>
        <div className="p-4 shrink-0">
          <Button onClick={handleNewChat} className="w-full justify-start h-12" variant="primary"><Plus size={20} /> New Chat</Button>
        </div>
        <div className="flex-1 overflow-y-auto px-2 space-y-1 min-h-0">
          {topics.map(topic => (
            <div key={topic.id} className="mb-1 group">
                <div className={`flex flex-col rounded-lg transition-colors ${currentTopicId === topic.id ? (isDarkMode ? 'bg-gray-800' : 'bg-gray-100') : 'hover:bg-gray-800/50'}`}>
                   <button 
                      onClick={() => {
                        if (currentTopicId === topic.id) {
                            setActiveTopicMenuId(prev => prev === topic.id ? null : topic.id);
                        } else {
                            setCurrentTopicId(topic.id);
                            setActiveTopicMenuId(topic.id);
                            setSidebarOpen(false);
                        }
                      }} 
                      className={`w-full text-left px-4 py-3.5 text-sm truncate flex items-center gap-3 ${currentTopicId === topic.id ? (isDarkMode ? 'text-white font-medium' : 'text-gray-900 font-medium') : (isDarkMode ? 'text-gray-400' : 'text-gray-600')}`}
                   >
                      <MessageSquare size={18} className="shrink-0" />
                      
                      {editingTopicId === topic.id ? (
                         <form onSubmit={handleRenameTopic} onClick={e => e.stopPropagation()} className="flex-1">
                            <input 
                              value={renameValue}
                              onChange={e => setRenameValue(e.target.value)}
                              autoFocus
                              onBlur={handleRenameTopic}
                              className={`w-full bg-transparent border-b focus:outline-none p-1 text-sm ${isDarkMode ? 'border-blue-500 text-white' : 'border-blue-600 text-black'}`}
                            />
                         </form>
                      ) : (
                         <span className="truncate flex-1 text-base">{topic.title || 'Untitled Chat'}</span>
                      )}
                   </button>

                   {activeTopicMenuId === topic.id && !editingTopicId && (
                      <div className="flex items-center gap-3 px-4 pb-3 animate-fade-in pl-10">
                         <button 
                           onClick={(e) => { e.stopPropagation(); setEditingTopicId(topic.id); setRenameValue(topic.title); }}
                           className="p-2 hover:bg-gray-600/50 rounded text-gray-400 hover:text-white transition-colors" 
                           title="Rename"
                         >
                            <Edit2 size={16} />
                         </button>
                         <button 
                           onClick={(e) => handleDeleteTopic(topic.id, e)} 
                           className={`p-2 rounded transition-all flex items-center gap-1 ${topicDeleteConfirmId === topic.id ? 'bg-red-600 text-white px-3' : 'hover:bg-red-500/20 text-gray-400 hover:text-red-500'}`}
                           title="Delete Chat"
                         >
                            <Trash2 size={16} />
                            {topicDeleteConfirmId === topic.id && <span className="text-xs font-bold ml-1">Delete</span>}
                         </button>
                      </div>
                   )}
                </div>
            </div>
          ))}
        </div>
        <div className={`p-4 border-t shrink-0 space-y-2 ${isDarkMode ? 'border-gray-800' : 'border-gray-200'}`}>
          <div className="flex items-center justify-between text-xs text-gray-500 mb-3 px-1">
            <span>Daily Limit: {LIMITS.MESSAGES} msgs</span> {isPremium && <span className="text-yellow-500 font-bold">PRO</span>}
          </div>
          
          {!sidebarClearConfirm ? (
            <button 
              type="button"
              onClick={() => setSidebarClearConfirm(true)}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 rounded-xl transition-colors"
            >
              <Trash2 size={18} /> Clear Memory
            </button>
          ) : (
            <div className="flex items-center gap-2">
               <button type="button" onClick={handleClearMemory} className="flex-1 bg-red-600 hover:bg-red-700 text-white text-sm py-3 rounded-xl transition-colors font-bold">Confirm Clear?</button>
               <button type="button" onClick={() => setSidebarClearConfirm(false)} className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-3 rounded-xl transition-colors font-bold">X</button>
            </div>
          )}

          <div onClick={() => { setAccountModalTab('overview'); setShowAccount(true); }} className={`flex items-center justify-between px-4 py-3 rounded-xl cursor-pointer transition-colors mt-2 ${isDarkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-100 hover:bg-gray-200'}`}>
            <div className="flex items-center gap-3 overflow-hidden">
               <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-xs font-bold text-white uppercase">{user.displayName ? user.displayName[0] : 'U'}</div>
               <div className={`truncate text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{user.displayName || 'User'}</div>
            </div>
            <Settings size={18} className="text-gray-400" />
          </div>
          <button onClick={() => auth.signOut()} className="w-full flex items-center gap-2 px-4 py-2 text-xs text-gray-500 hover:text-gray-700 justify-center mt-1"><LogOut size={14} /> Sign Out</button>
        </div>
      </div>

      {/* MAIN CHAT COLUMN */}
      <div className="flex-1 flex flex-col h-full w-full relative min-w-0">
        
        {/* HEADER: FIXED TOP */}
        <div className={`h-16 border-b flex items-center px-4 justify-between shrink-0 z-20 ${isDarkMode ? 'border-gray-800 bg-gray-900 text-white' : 'border-gray-200 bg-white text-gray-900'}`}>
          <div className="flex items-center gap-3 overflow-hidden">
            <button onClick={() => setSidebarOpen(true)} className={`md:hidden -ml-2 p-2 rounded-full ${isDarkMode ? 'active:bg-gray-800' : 'active:bg-gray-100'}`}><Menu size={24} /></button>
            <h2 className="font-semibold text-lg truncate">{topics.find(t => t.id === currentTopicId)?.title || 'New Chat'}</h2>
          </div>
          <div className="flex items-center gap-3 shrink-0">
             {isSpeaking && !isLiveMode && <div className="flex items-center gap-1 text-green-400 text-xs animate-pulse font-medium"><Volume2 size={16} /> <span className="hidden sm:inline">Speaking...</span></div>}
             <button onClick={() => { setAccountModalTab('subscription'); setShowAccount(true); }} className={`px-3 py-1.5 rounded-full text-xs font-bold hover:opacity-80 transition-opacity ${isPremium ? 'bg-yellow-500/20 text-yellow-500' : 'bg-gray-800 text-gray-300 border border-gray-700'}`}>{isPremium ? 'PRO' : 'FREE'}</button>
          </div>
        </div>

        {/* MESSAGES LIST: SCROLLABLE MIDDLE */}
        <div className={`flex-1 overflow-y-auto overflow-x-hidden min-h-0 p-3 md:p-6 space-y-6 md:space-y-8 scroll-smooth overscroll-contain ${isDarkMode ? 'bg-gray-900' : 'bg-[#f0f2f5]'}`}>
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center text-gray-500 opacity-50 px-6">
              <Sparkles size={56} className="mb-4 text-blue-500" />
              <p className="text-xl md:text-2xl font-medium">How can I help you today?</p>
            </div>
          )}
          {messages.map((msg) => (
            <div key={msg.id} className={`flex gap-2 md:gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''} group max-w-full`}>
              <div className={`w-8 h-8 md:w-9 md:h-9 rounded-full flex items-center justify-center shrink-0 select-none ${msg.role === 'user' ? 'bg-blue-600' : 'bg-green-600 text-white shadow-md'}`}>
                {msg.role === 'user' ? <span className="text-xs font-bold text-white">{user.displayName ? user.displayName[0].toUpperCase() : 'U'}</span> : <Sparkles size={16} />}
              </div>
              
              <div className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} max-w-[85%] md:max-w-[75%] lg:max-w-[65%]`}>
                <div 
                  className="cursor-pointer transition-all w-full active:opacity-90"
                  onClick={() => setActiveMessageId(activeMessageId === msg.id ? null : msg.id)}
                >
                  {msg.image && (
                     <img src={msg.image} alt="Content" className="rounded-lg w-full shadow-sm border border-gray-700/50 mb-2 object-cover min-w-[150px]" />
                  )}
                  <div className={`px-4 py-2.5 md:px-5 md:py-3.5 rounded-2xl shadow-sm text-[15px] md:text-[16px] leading-relaxed break-words 
                    ${msg.role === 'user' 
                      ? 'bg-blue-600 text-white rounded-tr-none' 
                      : (isDarkMode ? 'bg-gray-800 text-gray-100 border border-gray-700/50 rounded-tl-none' : 'bg-white text-gray-900 shadow-sm rounded-tl-none')}
                  `}>
                    <ReactMarkdown>{msg.text}</ReactMarkdown>
                  </div>
                  <div className={`text-[10px] md:text-xs mt-1 opacity-50 px-1 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                    {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </div>
                </div>

                {activeMessageId === msg.id && (
                  <div className={`flex items-center gap-1 p-1 rounded-xl animate-fade-in z-10 mt-1 shadow-lg select-none ${isDarkMode ? 'bg-gray-800 border border-gray-600' : 'bg-white border border-gray-200'}`}>
                     {msg.text && (
                       <button type="button" onClick={(e) => handleCopy(msg.text, msg.id, e)} className="p-2 hover:bg-gray-500/20 rounded-lg text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors" title="Copy">
                         {copiedId === msg.id ? <Check size={18} className="text-green-500"/> : <Copy size={18} />}
                       </button>
                     )}
                     {msg.image && (
                       <button type="button" onClick={(e) => handleDownload(msg.image!, e)} className="p-2 hover:bg-gray-500/20 rounded-lg text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors" title="Download">
                         <Download size={18} />
                       </button>
                     )}
                     <button 
                       type="button" 
                       onClick={(e) => handleDelete(msg.id, e)} 
                       className={`p-2 rounded-lg transition-all flex items-center gap-2 ${deleteConfirmId === msg.id ? 'bg-red-600 text-white px-3' : 'hover:bg-red-500/20 text-gray-500 hover:text-red-500'}`}
                       title="Delete"
                     >
                       {deleteConfirmId === msg.id ? <span className="text-xs font-bold">Confirm</span> : <Trash2 size={18} />}
                     </button>
                  </div>
                )}
              </div>
            </div>
          ))}
          {loading && !isLiveMode && (
             <div className="flex gap-3 px-1">
               <div className="w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center shrink-0"><Sparkles size={16} /></div>
               <div className={`px-4 py-3 rounded-2xl rounded-tl-none border flex gap-1.5 items-center h-10 md:h-12 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200 shadow-sm'}`}>
                 <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce"></div>
                 <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce delay-100"></div>
                 <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce delay-200"></div>
               </div>
             </div>
          )}
          <div ref={messagesEndRef} className="h-4" />
        </div>

        {/* INPUT AREA: FIXED BOTTOM (with SAFE AREA padding) */}
        <div className={`shrink-0 p-2 md:p-4 border-t z-20 pb-[env(safe-area-inset-bottom)] ${isDarkMode ? 'border-gray-800 bg-gray-900' : 'border-gray-200 bg-white'}`}>
           {attachment && (
             <div className={`flex items-center gap-2 mb-2 p-2.5 rounded-xl w-fit max-w-[90%] border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-100 border-gray-200'}`}>
               <div className={`text-xs font-medium truncate ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{attachment.name}</div>
               <button onClick={() => setAttachment(null)} className="p-1 hover:bg-gray-500/20 rounded-full"><X size={14} className="text-gray-500" /></button>
             </div>
           )}
           
           <div className={`flex items-end gap-2 md:gap-3`}>
              {/* TOOLS BAR */}
              <div className={`flex items-center gap-1 p-1 rounded-xl border shrink-0 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                 <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="image/*,application/pdf,audio/*" />
                 <button type="button" onClick={() => fileInputRef.current?.click()} className={`p-2.5 rounded-lg transition-colors ${isDarkMode ? 'text-gray-400 hover:text-white hover:bg-gray-700' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-200'}`}><Paperclip size={20} /></button>
                 <button type="button" onClick={toggleImageGen} className={`p-2.5 rounded-lg transition-colors ${isDarkMode ? (input.toLowerCase().startsWith('/imagine') ? 'text-purple-400 bg-purple-500/20' : 'text-gray-400 hover:text-white hover:bg-gray-700') : (input.toLowerCase().startsWith('/imagine') ? 'text-purple-600 bg-purple-100' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-200')}`}><ImageIcon size={20} /></button>
              </div>

              {/* INPUT FIELD */}
              <div className={`flex-1 min-w-0 relative rounded-2xl border transition-all focus-within:ring-2 focus-within:ring-blue-500/50 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                <textarea 
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                  placeholder={input.toLowerCase().startsWith('/imagine') ? "Describe image..." : "Message..."}
                  rows={1}
                  className={`w-full bg-transparent border-none focus:ring-0 outline-none py-3 pl-4 pr-10 resize-none max-h-32 min-h-[48px] text-[15px] md:text-base ${isDarkMode ? 'text-white placeholder-gray-500' : 'text-gray-900 placeholder-gray-500'}`}
                  style={{ lineHeight: '1.5' }}
                />
                <button 
                   type="button" 
                   onClick={handleDictation} 
                   className={`absolute right-2 bottom-1.5 p-2 rounded-full transition-colors ${isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'}`}
                >
                  <Mic size={20} />
                </button>
              </div>

              {/* SEND / LIVE */}
              {input.trim() || attachment ? (
                 <button 
                   type="button" 
                   onClick={() => handleSend()} 
                   className="p-3 rounded-full bg-blue-600 text-white shadow-lg shadow-blue-500/30 hover:bg-blue-700 active:scale-95 transition-all shrink-0"
                 >
                   <Send size={22} className="ml-0.5" />
                 </button>
              ) : (
                 <button 
                   type="button" 
                   onClick={startLiveMode} 
                   className={`p-3 rounded-full shadow-lg active:scale-95 transition-all shrink-0 ${isDarkMode ? 'bg-gray-800 text-blue-400 border border-gray-700' : 'bg-white text-blue-600 border border-gray-200'}`}
                 >
                   <Headphones size={24} />
                 </button>
              )}
           </div>
        </div>
      </div>
    </div>
  );
}
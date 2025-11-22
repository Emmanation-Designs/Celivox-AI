import React, { useState } from 'react';
import firebase from 'firebase/compat/app';
import { auth } from '../firebase';
import { X, User as UserIcon, Zap, Settings, Shield, Download, Moon, Sun, Check, AlertTriangle, Trash2, Smartphone, Database, Lock, CreditCard, Info, Mic } from 'lucide-react';
import { Button } from './Button';
import { UsageLimits, LIMITS } from '../types';

interface AccountModalProps {
  user: firebase.User;
  isPremium: boolean;
  usage: UsageLimits;
  onClose: () => void;
  onUpgrade: () => void;
  onClearMemory: () => Promise<boolean>;
  isDarkMode: boolean;
  toggleTheme: () => void;
  topics: any[]; 
  initialTab?: 'overview' | 'subscription' | 'settings' | 'danger';
}

export const AccountModal: React.FC<AccountModalProps> = ({
  user, isPremium, usage, onClose, onUpgrade, onClearMemory, isDarkMode, toggleTheme, topics, initialTab
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'subscription' | 'settings' | 'danger'>(initialTab || 'overview');
  const [displayName, setDisplayName] = useState(user.displayName || '');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{type: 'success'|'error', text: string} | null>(null);
  const [confirmClear, setConfirmClear] = useState(false); 

  // Personalization State
  const [personality, setPersonality] = useState(localStorage.getItem('celivox_personality') || 'friendly');
  const [voice, setVoice] = useState(localStorage.getItem('celivox_voice') || 'Fenrir');

  const handleUpdateProfile = async () => {
    setLoading(true);
    try {
      await user.updateProfile({ displayName });
      setMessage({ type: 'success', text: 'Profile updated successfully' });
      setTimeout(() => setMessage(null), 3000);
    } catch (e: any) {
      setMessage({ type: 'error', text: e.message });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!user.email) return;
    setLoading(true);
    try {
      await auth.sendPasswordResetEmail(user.email);
      setMessage({ type: 'success', text: `Password reset link sent to ${user.email}` });
    } catch (e: any) {
      setMessage({ type: 'error', text: e.message });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    const confirm = window.prompt('Type "DELETE" to confirm account deletion. This cannot be undone.');
    if (confirm === 'DELETE') {
      try {
        await user.delete();
        onClose();
      } catch (e: any) {
        alert(e.message);
      }
    }
  };

  const handleExportData = () => {
    const dataStr = JSON.stringify(topics, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = 'celivox-data.json';
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const handleSetPersonality = (p: string) => {
    setPersonality(p);
    localStorage.setItem('celivox_personality', p);
    setMessage({ type: 'success', text: `Personality set to ${p}` });
    setTimeout(() => setMessage(null), 1500);
  };

  const handleSetVoice = (v: string) => {
    setVoice(v);
    localStorage.setItem('celivox_voice', v);
    setMessage({ type: 'success', text: `Voice changed to ${v}` });
    setTimeout(() => setMessage(null), 1500);
  };

  const handleClearMemoryAction = async () => {
      if (!confirmClear) {
          setConfirmClear(true);
          return;
      }
      setLoading(true);
      const success = await onClearMemory();
      if (success) {
          setMessage({type: 'success', text: 'Memory Cleared Successfully'});
          setConfirmClear(false);
      } else {
          setMessage({type: 'error', text: 'Failed to clear memory'});
      }
      setLoading(false);
  };

  const msgPercent = Math.min(100, (usage.messages / LIMITS.MESSAGES) * 100);
  const imgPercent = Math.min(100, (usage.images / LIMITS.IMAGES) * 100);
  const uploadPercent = Math.min(100, (usage.uploads / LIMITS.UPLOADS) * 100);

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-hidden">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-5xl h-[100dvh] md:h-[85vh] shadow-2xl flex flex-col md:flex-row overflow-hidden">
        
        {/* Navigation (Sidebar on Desktop, Horizontal Scroll on Mobile) */}
        <div className="w-full md:w-64 bg-gray-800/50 border-b md:border-b-0 md:border-r border-gray-700 p-4 md:p-6 flex flex-row md:flex-col gap-2 overflow-x-auto md:overflow-visible shrink-0 no-scrollbar">
          <div className="hidden md:block mb-8 px-2">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Settings className="text-blue-500" /> Account
            </h2>
          </div>
          
          {[
            { id: 'overview', label: 'Overview', icon: UserIcon },
            { id: 'subscription', label: 'Subscription', icon: Zap },
            { id: 'settings', label: 'Settings', icon: Settings },
            { id: 'danger', label: 'Data/Privacy', icon: Shield },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 md:gap-3 px-3 py-2 md:px-4 md:py-3 rounded-lg text-xs md:text-sm font-medium transition-all whitespace-nowrap shrink-0
                ${activeTab === tab.id 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' 
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'}
              `}
            >
              <tab.icon size={16} className="md:w-5 md:h-5" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Main Content */}
        <div className="flex-1 bg-gray-900 p-4 md:p-8 overflow-y-auto relative scrollbar-hide md:scrollbar-default pb-20 md:pb-8">
          <button onClick={onClose} className="absolute top-4 right-4 md:top-6 md:right-6 text-gray-400 hover:text-white z-10 bg-gray-800/80 rounded-full p-1.5 md:p-2">
            <X size={20} className="md:w-6 md:h-6" />
          </button>

          <div className="max-w-2xl mx-auto mt-4 md:mt-0">
            {message && (
              <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-[80] px-6 py-3 rounded-full shadow-xl flex items-center gap-2 animate-fade-in ${message.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
                {message.type === 'success' ? <Check size={18} /> : <AlertTriangle size={18} />}
                {message.text}
              </div>
            )}

            {/* OVERVIEW TAB */}
            {activeTab === 'overview' && (
              <div className="space-y-6 md:space-y-8 animate-fade-in">
                <div>
                  <h3 className="text-xl md:text-2xl font-bold text-white mb-1">Profile</h3>
                  <p className="text-gray-400 text-sm">Manage your public profile and security.</p>
                </div>

                <div className="flex items-center gap-4 md:gap-6 p-4 md:p-6 bg-gray-800 rounded-xl border border-gray-700">
                   <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-2xl md:text-3xl font-bold text-white shrink-0">
                      {user.displayName ? user.displayName[0].toUpperCase() : user.email?.[0].toUpperCase()}
                   </div>
                   <div className="flex-1 min-w-0">
                     <label className="block text-sm text-gray-400 mb-1">Display Name</label>
                     <input 
                       type="text" 
                       value={displayName}
                       onChange={(e) => setDisplayName(e.target.value)}
                       className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none text-sm md:text-base"
                       placeholder="Enter your name"
                     />
                   </div>
                </div>

                <div className="p-4 md:p-6 bg-gray-800 rounded-xl border border-gray-700 space-y-4">
                   <div>
                     <label className="block text-sm text-gray-400 mb-1">Email Address</label>
                     <input 
                       type="email" 
                       value={user.email || ''}
                       disabled
                       className="w-full bg-gray-900/50 border border-gray-700 rounded-lg px-3 py-2 text-gray-400 cursor-not-allowed text-sm md:text-base"
                     />
                   </div>
                   <div className="flex flex-col sm:flex-row gap-3 pt-2">
                      <Button onClick={handleUpdateProfile} isLoading={loading} className="w-full sm:w-auto">Save Changes</Button>
                      <Button variant="secondary" onClick={handlePasswordReset} isLoading={loading} className="w-full sm:w-auto">Reset Password</Button>
                   </div>
                </div>
              </div>
            )}

            {/* SUBSCRIPTION TAB */}
            {activeTab === 'subscription' && (
              <div className="space-y-6 md:space-y-8 animate-fade-in">
                <div>
                  <h3 className="text-xl md:text-2xl font-bold text-white mb-1">Subscription & Limits</h3>
                  <p className="text-gray-400 text-sm">Manage your plan and check daily usage.</p>
                </div>

                {/* Current Plan Card */}
                <div className="p-4 md:p-6 bg-gradient-to-r from-gray-800 to-gray-800/50 border border-gray-700 rounded-xl relative overflow-hidden">
                  <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start gap-4">
                    <div>
                      <div className="text-xs md:text-sm text-gray-400 uppercase tracking-wider font-semibold mb-1">Current Plan</div>
                      <h4 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-2 flex-wrap">
                        {isPremium ? 'Celivox Premium' : 'Free Starter'} 
                        {isPremium && <span className="bg-yellow-500 text-black text-xs px-2 py-1 rounded-full">PRO</span>}
                      </h4>
                      <p className="text-gray-400 mt-2 max-w-md text-sm">
                        {isPremium 
                          ? "You have unlimited access to all features. Enjoy your creative freedom!" 
                          : "You are on the free tier. Limits reset every midnight local time."}
                      </p>
                    </div>
                    {!isPremium && (
                      <Button onClick={onUpgrade} className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-purple-600 border-0">
                        Upgrade Now
                      </Button>
                    )}
                  </div>
                </div>

                {/* Usage Stats */}
                {!isPremium && (
                  <div className="space-y-6">
                    <h4 className="font-semibold text-lg text-white">Daily Usage (Resets at 00:00)</h4>
                    
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-300">Messages</span>
                          <span className={usage.messages >= LIMITS.MESSAGES ? "text-red-400" : "text-gray-400"}>
                            {usage.messages} / {LIMITS.MESSAGES}
                          </span>
                        </div>
                        <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-500 transition-all duration-500" style={{ width: `${msgPercent}%` }}></div>
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-300">Image Generations</span>
                          <span className={usage.images >= LIMITS.IMAGES ? "text-red-400" : "text-gray-400"}>
                            {usage.images} / {LIMITS.IMAGES}
                          </span>
                        </div>
                        <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                          <div className="h-full bg-purple-500 transition-all duration-500" style={{ width: `${imgPercent}%` }}></div>
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-300">File Uploads</span>
                          <span className={usage.uploads >= LIMITS.UPLOADS ? "text-red-400" : "text-gray-400"}>
                            {usage.uploads} / {LIMITS.UPLOADS}
                          </span>
                        </div>
                        <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                          <div className="h-full bg-green-500 transition-all duration-500" style={{ width: `${uploadPercent}%` }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* SETTINGS TAB */}
            {activeTab === 'settings' && (
               <div className="space-y-6 md:space-y-8 animate-fade-in">
                 <div>
                   <h3 className="text-xl md:text-2xl font-bold text-white mb-1">App Settings</h3>
                   <p className="text-gray-400 text-sm">Customize your Celivox experience.</p>
                 </div>

                 <div className="space-y-4">
                    <div className="p-4 md:p-6 bg-gray-800 rounded-xl border border-gray-700 space-y-6">
                       {/* VOICE SETTINGS */}
                       <div className="space-y-3">
                         <label className="font-medium text-white flex items-center gap-2 text-base md:text-lg">
                            <Mic size={18} className="text-blue-400"/> AI Voice Selection
                         </label>
                         <p className="text-xs text-gray-500 mb-2">Select the voice used in Live Mode and Speech responses.</p>
                         
                         <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {[
                              { id: 'Fenrir', label: 'Fenrir (Male, Deep)', desc: 'Confident & authoritative' },
                              { id: 'Puck', label: 'Puck (Male, Soft)', desc: 'Calm & soothing' },
                              { id: 'Kore', label: 'Kore (Female, Soft)', desc: 'Gentle & caring' },
                              { id: 'Charon', label: 'Charon (Male, Deep)', desc: 'Steady & serious' },
                              { id: 'Zephyr', label: 'Zephyr (Female, Energetic)', desc: 'Bright & clear' }
                            ].map((v) => (
                               <button
                                 key={v.id}
                                 onClick={() => handleSetVoice(v.id)}
                                 className={`p-3 rounded-lg border text-left transition-all active:scale-95 ${voice === v.id ? 'bg-blue-600/20 border-blue-500 text-white ring-1 ring-blue-500' : 'bg-gray-900 border-gray-700 text-gray-400 hover:border-gray-500 hover:bg-gray-800'}`}
                               >
                                  <div className="font-bold text-sm flex items-center gap-2">
                                    {voice === v.id && <div className="w-2 h-2 rounded-full bg-blue-500 shadow-sm shadow-blue-400"></div>}
                                    {v.label}
                                  </div>
                                  <div className="text-xs opacity-70 mt-1">{v.desc}</div>
                               </button>
                            ))}
                         </div>
                       </div>

                       <div className="border-t border-gray-700 pt-6 space-y-3">
                         <label className="block font-medium text-white text-base md:text-lg">AI Personality</label>
                         <select 
                           value={personality}
                           onChange={(e) => handleSetPersonality(e.target.value)}
                           className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                         >
                           <option value="friendly">Friendly & Helpful (Default)</option>
                           <option value="professional">Professional & Concise</option>
                           <option value="creative">Creative & Enthusiastic</option>
                           <option value="sarcastic">Witty & Sarcastic</option>
                         </select>
                       </div>
                    </div>

                    <div className="p-4 bg-gray-800 rounded-xl border border-gray-700 flex items-center justify-between">
                       <div className="flex items-center gap-3">
                          {isDarkMode ? <Moon className="text-purple-400" size={20} /> : <Sun className="text-yellow-400" size={20} />}
                          <div>
                            <div className="font-medium text-white text-sm">Dark Mode</div>
                          </div>
                       </div>
                       <button 
                         onClick={toggleTheme}
                         className={`w-12 h-6 rounded-full p-1 transition-colors ${isDarkMode ? 'bg-blue-600' : 'bg-gray-600'}`}
                       >
                         <div className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform ${isDarkMode ? 'translate-x-6' : 'translate-x-0'}`} />
                       </button>
                    </div>
                 </div>

                 {/* ABOUT CELIVOX */}
                 <div className="mt-8 p-6 bg-gray-800 rounded-xl border border-gray-700 space-y-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-3xl rounded-full"></div>
                    
                    <div className="flex items-center justify-between relative z-10">
                       <h4 className="text-lg font-bold text-white flex items-center gap-2">
                         <Info size={18} className="text-blue-500"/> About Celivox
                       </h4>
                       <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs font-mono rounded border border-blue-500/30">v2.0</span>
                    </div>

                    <p className="text-gray-300 text-sm leading-relaxed">
                      Celivox is Nigeria’s most advanced all-in-one AI companion, built for creators, students, professionals, and everyday hustlers.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                       <div className="flex items-center gap-2 text-xs text-gray-400 bg-gray-900/50 p-2 rounded border border-gray-700/50">
                          <Zap size={14} className="text-yellow-500 shrink-0"/> Powered by Gemini 1.5 Flash & Pro
                       </div>
                       <div className="flex items-center gap-2 text-xs text-gray-400 bg-gray-900/50 p-2 rounded border border-gray-700/50">
                          <Smartphone size={14} className="text-blue-500 shrink-0"/> Text · Voice · Image · Analysis
                       </div>
                       <div className="flex items-center gap-2 text-xs text-gray-400 bg-gray-900/50 p-2 rounded border border-gray-700/50">
                          <Database size={14} className="text-green-500 shrink-0"/> Full offline-capable PWA
                       </div>
                       <div className="flex items-center gap-2 text-xs text-gray-400 bg-gray-900/50 p-2 rounded border border-gray-700/50">
                          <Lock size={14} className="text-red-500 shrink-0"/> Strict privacy — No training on chats
                       </div>
                    </div>

                    <div className="space-y-2">
                       <h5 className="text-sm font-semibold text-white flex items-center gap-2">
                         <Zap size={14} className="text-yellow-500 fill-yellow-500"/> Premium Plans (Unlimited forever)
                       </h5>
                       <div className="bg-gray-900/30 p-3 rounded-lg space-y-2">
                         <div className="flex justify-between text-sm text-gray-400 border-b border-gray-700/50 pb-2">
                           <span>Monthly</span> <span className="text-white">₦10,000</span>
                         </div>
                         <div className="flex justify-between text-sm text-gray-400 border-b border-gray-700/50 pb-2">
                           <span>Yearly</span> <span className="text-white">₦100,000</span>
                         </div>
                         <div className="flex justify-between items-center p-2 rounded bg-gradient-to-r from-yellow-900/20 to-yellow-600/10 border border-yellow-500/30 text-yellow-200 text-sm font-medium mt-1 relative overflow-hidden">
                            <span className="flex flex-col">
                               Lifetime <span className="text-[10px] opacity-70 font-normal">(One-time payment)</span>
                            </span>
                            <span className="font-bold text-yellow-400">₦250,000</span>
                            <div className="absolute -top-0 -right-8 bg-yellow-500 text-black text-[9px] font-bold px-8 py-1 rotate-45 shadow-sm">Most Popular 🔥</div>
                         </div>
                       </div>
                    </div>

                    <div className="pt-4 border-t border-gray-700 text-xs text-center text-gray-500 space-y-1.5">
                      <p className="flex items-center justify-center gap-1">
                         <CreditCard size={12}/> Payments securely processed by Paystack
                      </p>
                      <p className="opacity-75">Bank transfer · USSD · Mobile money · Cards</p>
                      <div className="pt-2">
                        Developed with love in Nigeria ❤️
                        <br/>
                        Contact: <a href="mailto:celivox@gmail.com" className="text-blue-400 hover:underline">celivox@gmail.com</a>
                        <br/>
                        <span className="opacity-50">Version 2.0 | © 2025 Celivox</span>
                      </div>
                    </div>
                 </div>

               </div>
            )}

            {/* DANGER TAB */}
            {activeTab === 'danger' && (
               <div className="space-y-6 md:space-y-8 animate-fade-in">
                 <div>
                   <h3 className="text-xl md:text-2xl font-bold text-red-500 mb-1">Data & Privacy</h3>
                   <p className="text-gray-400 text-sm">Manage your data and account existence.</p>
                 </div>

                 <div className="space-y-4">
                    <div className="p-4 bg-gray-800 rounded-xl border border-gray-700 flex flex-col sm:flex-row items-center justify-between gap-4">
                       <div className="flex items-center gap-3 w-full">
                          <Download className="text-gray-400" />
                          <div>
                            <div className="font-medium text-white">Export Chat History</div>
                            <div className="text-xs text-gray-400">Download all your conversations as JSON</div>
                          </div>
                       </div>
                       <Button variant="secondary" onClick={handleExportData} className="w-full sm:w-auto">Export Data</Button>
                    </div>
                    
                    <div className="p-4 bg-gray-800 rounded-xl border border-gray-700 flex flex-col sm:flex-row items-center justify-between gap-4">
                       <div className="flex items-center gap-3 w-full">
                          <Trash2 className="text-red-400" />
                          <div>
                            <div className="font-medium text-white">Clear Memory</div>
                            <div className="text-xs text-gray-400">Permanently delete all current chats</div>
                          </div>
                       </div>
                       <Button variant="danger" onClick={handleClearMemoryAction} className="w-full sm:w-auto">Clear All</Button>
                    </div>

                    <div className="p-4 border border-red-900/50 bg-red-900/10 rounded-xl mt-8">
                       <h4 className="text-red-500 font-bold mb-2 flex items-center gap-2"><AlertTriangle size={18}/> Danger Zone</h4>
                       <p className="text-gray-400 text-sm mb-4">Deleting your account is permanent. All subscriptions and data will be lost immediately.</p>
                       <Button variant="danger" onClick={handleDeleteAccount} className="w-full">Delete Account Permanently</Button>
                    </div>
                 </div>
               </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
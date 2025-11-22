import React from 'react';
import { X, Check, Lock, Clock } from 'lucide-react';
import { Button } from './Button';

// DECLARE PAYSTACK GLOBAL
declare const PaystackPop: any;

interface PaywallProps {
  onClose: () => void;
  onSuccess: () => void;
  email: string;
  featureName: string;
}

export const Paywall: React.FC<PaywallProps> = ({ onClose, onSuccess, email, featureName }) => {
  // !!! REPLACE WITH YOUR LIVE KEY HERE !!!
  const PAYSTACK_PUBLIC_KEY = "pk_test_35d4066657995717045c48155189226736427603"; 
  
  const plans = [
    { id: 'monthly', name: 'Monthly', price: 10000, label: '₦10,000/mo', badge: null },
    { id: 'yearly', name: 'Yearly', price: 100000, label: '₦100,000/yr', badge: 'Save ₦20,000' },
    { id: 'lifetime', name: 'Lifetime', price: 250000, label: '₦250,000', badge: 'Most Popular 🔥' }
  ];

  const handlePayment = (amount: number, plan: string) => {
    // Disabled for now
    return;
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto h-[100dvh]">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-4xl overflow-hidden shadow-2xl flex flex-col md:flex-row max-h-full md:max-h-[90vh] overflow-y-auto md:overflow-visible scrollbar-hide">
        
        {/* Left Side - Marketing */}
        <div className="md:w-2/5 p-6 md:p-8 bg-gradient-to-br from-blue-600 to-purple-700 text-white flex flex-col justify-between relative overflow-hidden shrink-0 min-h-[300px]">
           <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
           <div className="relative z-10">
             <h2 className="text-2xl md:text-3xl font-bold mb-4">Unlock Celivox</h2>
             <p className="text-blue-100 mb-6 text-sm md:text-base">
               You've reached your daily limit for <b>{featureName}</b>.
             </p>
             <ul className="space-y-3 mb-8">
               {['Unlimited Messages', 'Unlimited Image Gen', 'Unlimited File Uploads', 'Priority Voice Access', 'Exclusive Personalities'].map((item, i) => (
                 <li key={i} className="flex items-center gap-2 text-sm font-medium">
                   <div className="bg-white/20 p-1 rounded-full"><Check size={14} /></div>
                   {item}
                 </li>
               ))}
             </ul>
           </div>
           <div className="relative z-10 text-xs opacity-70 mt-4 md:mt-0">
             Powered by Gemini 2.5 Flash & Pro
           </div>
        </div>

        {/* Right Side - Plans (BLURRED / COMING SOON) */}
        <div className="md:w-3/5 p-6 md:p-8 bg-gray-800 relative">
          <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white bg-gray-700/50 rounded-full p-1 z-20">
            <X size={20} />
          </button>

          <div className="text-center mb-6 md:mb-8 mt-4 md:mt-0">
            <h3 className="text-2xl font-bold text-white mb-2">Choose your plan</h3>
            <p className="text-gray-400 text-sm">Secure payment via Paystack</p>
          </div>

          <div className="relative">
            {/* The Plans List (Blurred) */}
            <div className="space-y-4 blur-sm opacity-50 pointer-events-none select-none filter grayscale">
              {plans.map((plan) => (
                <div 
                  key={plan.id}
                  className={`relative group border-2 rounded-xl p-4 flex items-center justify-between
                    ${plan.id === 'lifetime' ? 'border-blue-500 bg-blue-900/20' : 'border-gray-700 bg-gray-800'}
                  `}
                >
                  {plan.badge && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gray-600 text-gray-300 text-xs font-bold px-3 py-1 rounded-full shadow-lg whitespace-nowrap">
                      {plan.badge}
                    </div>
                  )}
                  <div>
                    <h4 className="font-bold text-lg text-white">{plan.name}</h4>
                    <p className="text-gray-400 text-xs">Billed once</p>
                  </div>
                  <div className="text-right">
                     <div className="text-lg md:text-xl font-bold text-white">{plan.label}</div>
                     <div className="text-xs text-blue-400 font-semibold">Select Plan &rarr;</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Coming Soon Overlay */}
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center text-center p-4">
               <div className="bg-gray-900/90 border border-blue-500/30 p-6 rounded-2xl shadow-2xl backdrop-blur-md transform scale-100 md:scale-110">
                  <div className="bg-blue-500/20 p-3 rounded-full inline-flex mb-3">
                     <Clock size={32} className="text-blue-400" />
                  </div>
                  <h4 className="text-xl font-bold text-white mb-2">Coming Soon</h4>
                  <p className="text-gray-300 text-sm mb-4">
                    We are currently upgrading our premium infrastructure to serve you better.
                  </p>
                  <div className="text-xs text-blue-400 font-semibold bg-blue-900/20 px-3 py-1 rounded-full inline-block">
                    Check back later!
                  </div>
               </div>
            </div>
          </div>

          <div className="mt-8 text-center opacity-50">
             <p className="text-gray-500 text-xs">
               Payments processed securely by Paystack. Supports Card, Bank Transfer, USSD, and Mobile Money.
             </p>
          </div>
        </div>

      </div>
    </div>
  );
}
"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, X, CreditCard, Smartphone, Building2, CheckCircle2 } from "lucide-react";

interface RazorpayMockProps {
  amount: number;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  companyName?: string;
  description?: string;
}

export function RazorpayMock({ amount, open, onClose, onSuccess, companyName = "FlowCapital Escrow", description = "Invoice Tokenization Settlement" }: RazorpayMockProps) {
  const [step, setStep] = useState<'method' | 'processing' | 'success'>('method');
  const [selectedMethod, setSelectedMethod] = useState<'UPI' | 'CARD' | 'NETBANKING' | null>(null);

  useEffect(() => {
    if (open) {
      setStep('method');
      setSelectedMethod(null);
    }
  }, [open]);

  const handlePay = () => {
    if (!selectedMethod) return;
    setStep('processing');
    
    // Simulate payment gateway delay
    setTimeout(() => {
      setStep('success');
      // Trigger success callback after showing the green checkmark
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    }, 2500);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }} 
        animate={{ opacity: 1, scale: 1, y: 0 }} 
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="w-full max-w-sm bg-white rounded-xl shadow-2xl overflow-hidden relative font-sans text-slate-900"
      >
        {/* Razorpay Header Style */}
        <div className="bg-[#3399cc] text-white p-5 flex flex-col items-center relative">
          <button onClick={onClose} className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
          <div className="w-12 h-12 bg-white rounded flex items-center justify-center mb-3 shadow-sm">
            <div className="text-[#3399cc] font-black text-xl italic tracking-tighter">F</div>
          </div>
          <h2 className="font-semibold text-lg">{companyName}</h2>
          <p className="text-white/80 text-xs mb-3">{description}</p>
          <div className="flex items-center gap-1">
            <span className="text-white/80 text-sm">₹</span>
            <span className="text-3xl font-bold">{amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
        </div>

        {/* Dynamic Body */}
        <div className="p-5 bg-slate-50 min-h-[300px] flex flex-col justify-center">
          <AnimatePresence mode="wait">
            {step === 'method' && (
              <motion.div key="method" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-3">
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Select Payment Method (Test Mode)</div>
                
                <button 
                  onClick={() => setSelectedMethod('UPI')}
                  className={`w-full flex items-center gap-4 p-4 rounded-lg border transition-all ${selectedMethod === 'UPI' ? 'border-[#3399cc] bg-blue-50/50 shadow-sm' : 'border-slate-200 bg-white hover:border-slate-300'}`}
                >
                  <div className="w-8 h-8 bg-orange-100 text-orange-600 rounded flex items-center justify-center"><Smartphone className="w-4 h-4"/></div>
                  <div className="text-left"><p className="font-semibold text-sm">UPI / QR</p><p className="text-xs text-slate-500">Google Pay, PhonePe, Paytm</p></div>
                </button>

                <button 
                  onClick={() => setSelectedMethod('CARD')}
                  className={`w-full flex items-center gap-4 p-4 rounded-lg border transition-all ${selectedMethod === 'CARD' ? 'border-[#3399cc] bg-blue-50/50 shadow-sm' : 'border-slate-200 bg-white hover:border-slate-300'}`}
                >
                  <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded flex items-center justify-center"><CreditCard className="w-4 h-4"/></div>
                  <div className="text-left"><p className="font-semibold text-sm">Cards</p><p className="text-xs text-slate-500">Visa, MasterCard, RuPay</p></div>
                </button>

                <button 
                  onClick={() => setSelectedMethod('NETBANKING')}
                  className={`w-full flex items-center gap-4 p-4 rounded-lg border transition-all ${selectedMethod === 'NETBANKING' ? 'border-[#3399cc] bg-blue-50/50 shadow-sm' : 'border-slate-200 bg-white hover:border-slate-300'}`}
                >
                  <div className="w-8 h-8 bg-emerald-100 text-emerald-600 rounded flex items-center justify-center"><Building2 className="w-4 h-4"/></div>
                  <div className="text-left"><p className="font-semibold text-sm">Netbanking</p><p className="text-xs text-slate-500">All Indian Banks</p></div>
                </button>
              </motion.div>
            )}

            {step === 'processing' && (
              <motion.div key="processing" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center py-8">
                <Loader2 className="w-12 h-12 text-[#3399cc] animate-spin mb-4" />
                <p className="text-[#3399cc] font-semibold">Processing Secure Payment...</p>
                <p className="text-slate-500 text-xs mt-2 text-center max-w-[250px]">Please do not close this window or press back on your browser.</p>
              </motion.div>
            )}

            {step === 'success' && (
              <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center py-8">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200, damping: 15 }}>
                  <CheckCircle2 className="w-16 h-16 text-emerald-500 mb-4" />
                </motion.div>
                <p className="text-emerald-600 font-bold text-lg">Payment Successful</p>
                <p className="text-slate-500 text-xs mt-1">Redirecting to FlowCapital...</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer actions */}
        {step === 'method' && (
          <div className="p-4 bg-white border-t border-slate-100">
            <button 
              onClick={handlePay}
              disabled={!selectedMethod}
              className="w-full bg-[#3399cc] disabled:bg-slate-300 disabled:cursor-not-allowed hover:bg-[#2980b9] text-white font-bold py-3.5 rounded-lg transition-colors shadow-lg shadow-blue-500/20"
            >
              Pay Now
            </button>
            <div className="flex items-center justify-center gap-1 mt-3 text-[10px] text-slate-400 font-semibold tracking-wider">
              <span>⚡ SECURED BY</span>
              <span className="font-bold text-slate-500 tracking-tighter italic">Razorpay</span>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}

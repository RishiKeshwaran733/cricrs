import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { motion } from 'framer-motion';
import { Smartphone, LogIn, AlertCircle } from 'lucide-react';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import toast from 'react-hot-toast';

export default function PlayerLoginPage() {
  const [mobileNumber, setMobileNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const { playerLogin } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{10}$/.test(mobileNumber)) {
      toast.error('Please enter a valid 10-digit mobile number');
      return;
    }

    setLoading(true);
    try {
      await playerLogin(mobileNumber);
      toast.success('Login successful!');
      navigate('/player/dashboard');
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-brand-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-brand-500/30">
            <Smartphone className="text-brand-500" size={32} />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Player Portal</h1>
          <p className="text-[var(--color-text-muted)]">Enter your mobile number to view your stats</p>
        </div>

        <Card className="bg-[var(--color-surface)] border-[var(--color-border)] shadow-2xl">
          <CardContent className="p-6">
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-2">Mobile Number</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] font-medium">+91</span>
                  <Input 
                    type="tel"
                    placeholder="9876543210"
                    value={mobileNumber}
                    onChange={e => setMobileNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    className="pl-12 h-12 text-lg bg-[var(--color-bg)] border-[var(--color-border)] text-white"
                  />
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/20 text-sm">
                <AlertCircle className="shrink-0 mt-0.5" size={16} />
                <p>Login requires the exact 10-digit mobile number registered by your admin. No password required.</p>
              </div>

              <Button 
                type="submit" 
                className="w-full h-12 font-bold text-base mt-2" 
                disabled={loading || mobileNumber.length !== 10}
              >
                {loading ? 'Verifying...' : (
                  <>
                    <LogIn className="mr-2" size={18} />
                    View My Stats
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 pt-6 border-t border-[var(--color-border)] text-center">
              <p className="text-sm text-[var(--color-text-muted)]">
                Are you an admin?{' '}
                <button 
                  type="button"
                  onClick={() => navigate('/admin/login')} 
                  className="text-brand-500 hover:text-brand-400 font-medium transition-colors"
                >
                  Admin Login
                </button>
              </p>
              <button 
                type="button"
                onClick={() => navigate('/')} 
                className="mt-2 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
              >
                &larr; Back to Home
              </button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

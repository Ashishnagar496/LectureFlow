import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, Mail, Lock, User, ArrowRight, ShieldCheck, UserCheck } from 'lucide-react';

export const Login: React.FC = () => {
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (isRegister) {
        await register(email, fullName);
        navigate('/onboarding');
      } else {
        await login(email);
        navigate('/dashboard');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickDemo = async (role: 'student' | 'admin') => {
    setSubmitting(true);
    try {
      if (role === 'admin') {
        await login('admin.academics@college.edu', 'admin');
        navigate('/admin');
      } else {
        await login('aarav.sharma@college.edu', 'student');
        navigate('/dashboard');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-[#2563EB] text-white flex items-center justify-center mx-auto">
            <GraduationCap className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-[#F9FAFB] tracking-tight">LectureFlow</h1>
          <p className="text-xs text-[#9CA3AF]">College Lecture Schedule &amp; Notification System</p>
        </div>

        <div className="bg-[#111827] rounded-2xl border border-[#1F2937] p-6 sm:p-8 space-y-6">
          <div className="flex border-b border-[#1F2937]">
            <button
              onClick={() => setIsRegister(false)}
              className={`flex-1 pb-3 text-xs font-semibold uppercase tracking-wider border-b-2 transition-colors ${
                !isRegister ? 'border-brand-primary text-[#F9FAFB]' : 'border-transparent text-[#9CA3AF]'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setIsRegister(true)}
              className={`flex-1 pb-3 text-xs font-semibold uppercase tracking-wider border-b-2 transition-colors ${
                isRegister ? 'border-brand-primary text-[#F9FAFB]' : 'border-transparent text-[#9CA3AF]'
              }`}
            >
              Register
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <div>
                <label className="block text-xs font-semibold text-brand-text mb-1">Full Name</label>
                <div className="relative">
                  <User className="w-4 h-4 text-[#9CA3AF] absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Aarav Sharma"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-[#1F2937] rounded-xl text-sm bg-brand-bg focus:bg-[#111827] focus:outline-none"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-brand-text mb-1">College Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#9CA3AF] absolute left-3 top-2.5" />
                <input
                  type="email"
                  required
                  placeholder="student@college.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-[#1F2937] rounded-xl text-sm bg-brand-bg focus:bg-[#111827] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-brand-text mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#9CA3AF] absolute left-3 top-2.5" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-[#1F2937] rounded-xl text-sm bg-brand-bg focus:bg-[#111827] focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 px-4 rounded-xl bg-[#2563EB] text-white text-xs font-bold hover:bg-[#1D4ED8] transition-colors flex items-center justify-center space-x-1.5"
            >
              <span>{submitting ? 'Authenticating...' : isRegister ? 'Create Account' : 'Sign In'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="pt-4 border-t border-[#1F2937] space-y-2">
            <p className="text-[11px] font-semibold text-[#9CA3AF] uppercase tracking-wider text-center">
              Quick Access
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickDemo('student')}
                className="flex items-center justify-center space-x-1.5 py-2 px-2.5 rounded-lg border border-[#1F2937] bg-brand-bg text-xs font-semibold text-[#F9FAFB] hover:bg-[#111827]"
              >
                <UserCheck className="w-3.5 h-3.5 text-[#60A5FA]" />
                <span>Student</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemo('admin')}
                className="flex items-center justify-center space-x-1.5 py-2 px-2.5 rounded-lg border border-[#1F2937] bg-brand-bg text-xs font-semibold text-[#F9FAFB] hover:bg-[#111827]"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-[#60A5FA]" />
                <span>Admin</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

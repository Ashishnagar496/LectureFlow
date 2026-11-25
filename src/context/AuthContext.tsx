import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Profile, UserRole } from '../types';
import { dataService } from '../services/dataService';
import { supabase, isSupabaseConfigured } from '../services/supabase';

interface AuthContextType {
  user: Profile | null;
  loading: boolean;
  login: (email: string, role?: UserRole) => Promise<void>;
  register: (email: string, fullName: string, role?: UserRole) => Promise<void>;
  logout: () => Promise<void>;
  completeOnboarding: (data: {
    fullName: string;
    departmentId: string;
    semester: number;
    sectionId: string;
    phoneNumber?: string;
    whatsappNumber?: string;
  }) => Promise<void>;
  updateUserSection: (sectionId: string) => Promise<void>;
  switchRole: (newRole: UserRole) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEMO_STUDENT: Profile = {
  id: 'usr_student_01',
  full_name: 'Aarav Sharma',
  email: 'aarav.sharma@college.edu',
  role: 'student',
  department_id: '11111111-1111-1111-1111-111111111111',
  semester: 6,
  section_id: 'a1111111-1111-1111-1111-111111111111',
  phone_number: '+91 98765 43210',
  whatsapp_number: '+91 98765 43210',
  preferred_channel: 'whatsapp',
  is_onboarded: true,
  created_at: new Date().toISOString()
};

const DEMO_ADMIN: Profile = {
  id: 'usr_admin_01',
  full_name: 'Dr. Neeraj Verma',
  email: 'admin.academics@college.edu',
  role: 'admin',
  department_id: '11111111-1111-1111-1111-111111111111',
  semester: 6,
  section_id: 'a1111111-1111-1111-1111-111111111111',
  phone_number: '+91 98765 00000',
  whatsapp_number: '+91 98765 00000',
  preferred_channel: 'whatsapp',
  is_onboarded: true,
  created_at: new Date().toISOString()
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<Profile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function initAuth() {
      try {
        if (isSupabaseConfigured && supabase) {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            const profile = await dataService.getProfile(session.user.id);
            if (profile) {
              setUser(profile);
              setLoading(false);
              return;
            }
          }
        }

        const savedUser = localStorage.getItem('lf_active_user');
        if (savedUser) {
          setUser(JSON.parse(savedUser));
        } else {
          setUser(DEMO_STUDENT);
          localStorage.setItem('lf_active_user', JSON.stringify(DEMO_STUDENT));
        }
      } catch {
        setUser(DEMO_STUDENT);
      } finally {
        setLoading(false);
      }
    }

    initAuth();
  }, []);

  const login = async (email: string, role: UserRole = 'student') => {
    setLoading(true);
    try {
      const targetUser = role === 'admin' ? DEMO_ADMIN : { ...DEMO_STUDENT, email };
      setUser(targetUser);
      localStorage.setItem('lf_active_user', JSON.stringify(targetUser));
    } finally {
      setLoading(false);
    }
  };

  const register = async (email: string, fullName: string, role: UserRole = 'student') => {
    setLoading(true);
    try {
      const newUser: Profile = {
        id: 'usr_' + Date.now(),
        full_name: fullName,
        email,
        role,
        is_onboarded: false,
        created_at: new Date().toISOString()
      };
      setUser(newUser);
      localStorage.setItem('lf_active_user', JSON.stringify(newUser));
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut();
    }
    localStorage.removeItem('lf_active_user');
    setUser(null);
  };

  const completeOnboarding = async (data: {
    fullName: string;
    departmentId: string;
    semester: number;
    sectionId: string;
    phoneNumber?: string;
    whatsappNumber?: string;
  }) => {
    if (!user) return;
    const updated: Profile = {
      ...user,
      full_name: data.fullName,
      department_id: data.departmentId,
      semester: data.semester,
      section_id: data.sectionId,
      phone_number: data.phoneNumber || user.phone_number || null,
      whatsapp_number: data.whatsappNumber || data.phoneNumber || user.whatsapp_number || null,
      is_onboarded: true
    };
    await dataService.updateProfile(user.id, updated);
    setUser(updated);
    localStorage.setItem('lf_active_user', JSON.stringify(updated));
  };

  const updateUserSection = async (sectionId: string) => {
    if (!user) return;
    const updated: Profile = { ...user, section_id: sectionId };
    await dataService.updateProfile(user.id, updated);
    setUser(updated);
    localStorage.setItem('lf_active_user', JSON.stringify(updated));
  };

  const switchRole = async (newRole: UserRole) => {
    const target = newRole === 'admin' ? DEMO_ADMIN : DEMO_STUDENT;
    setUser(target);
    localStorage.setItem('lf_active_user', JSON.stringify(target));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        completeOnboarding,
        updateUserSection,
        switchRole
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

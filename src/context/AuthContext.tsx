import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../lib/api';
import { auth, loginWithGoogle, logoutFirebase, syncUserProfileToFirestore } from '../lib/firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { isAuthorizedAdminEmail, PRIMARY_ADMIN_EMAIL } from '../config/adminConfig';

export interface AdminSessionUser {
  id: string;
  name: string;
  email: string;
  role: string;
  isFirebaseUser?: boolean;
}

interface AuthContextType {
  user: AdminSessionUser | null;
  firebaseUser: FirebaseUser | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  authorizedAdminEmail: string;
  loading: boolean;
  login: (credentials: { email: string; password: string }) => Promise<{ success: boolean; message?: string }>;
  loginWithGoogleAuth: () => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AdminSessionUser | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Sync Firebase Auth state changes with strict single-admin authorization
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        // Sync profile to Firestore
        await syncUserProfileToFirestore(fbUser);

        // Security check: Only the exact authorized admin email receives admin credentials
        const isPermitted = isAuthorizedAdminEmail(fbUser.email);
        if (!isPermitted) {
          // Connected non-admin user
          localStorage.removeItem('priya_admin_token');
          setUser({
            id: fbUser.uid,
            name: fbUser.displayName || fbUser.email?.split('@')[0] || 'User',
            email: fbUser.email || '',
            role: 'PATIENT',
            isFirebaseUser: true,
          });
          setLoading(false);
          return;
        }

        // Check if we need backend session token for authorized admin
        const existingToken = localStorage.getItem('priya_admin_token');
        if (!existingToken && fbUser.email) {
          try {
            const res = await api.googleLogin({
              email: fbUser.email,
              name: fbUser.displayName || fbUser.email.split('@')[0],
              uid: fbUser.uid,
            });
            if (res.success && res.data) {
              localStorage.setItem('priya_admin_token', res.data.token);
              setUser({
                id: res.data.user.id,
                name: res.data.user.name,
                email: res.data.user.email,
                role: res.data.user.role,
                isFirebaseUser: true,
              });
              setLoading(false);
              return;
            }
          } catch (err) {
            console.warn('Backend sync on auth state change failed:', err);
          }
        }

        setUser((prev) => {
          if (prev && !prev.isFirebaseUser && prev.role === 'ADMIN' && isAuthorizedAdminEmail(prev.email)) return prev;
          return {
            id: fbUser.uid,
            name: fbUser.displayName || fbUser.email?.split('@')[0] || 'Clinic Admin',
            email: fbUser.email || '',
            role: 'ADMIN',
            isFirebaseUser: true,
          };
        });
        setLoading(false);
      } else {
        // Only clear user if no local token
        if (!localStorage.getItem('priya_admin_token')) {
          setUser(null);
        }
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const refreshSession = async () => {
    const token = localStorage.getItem('priya_admin_token');
    if (!token) {
      if (!auth.currentUser) {
        setUser(null);
      }
      setLoading(false);
      return;
    }

    try {
      const res = await api.getMe();
      if (res.success && res.data?.user && isAuthorizedAdminEmail(res.data.user.email)) {
        setUser({
          id: res.data.user.userId,
          name: res.data.user.name,
          email: res.data.user.email,
          role: res.data.user.role,
          isFirebaseUser: false,
        });
      } else {
        localStorage.removeItem('priya_admin_token');
        if (!auth.currentUser) {
          setUser(null);
        }
      }
    } catch {
      localStorage.removeItem('priya_admin_token');
      if (!auth.currentUser) {
        setUser(null);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshSession();
  }, []);

  const login = async (credentials: { email: string; password: string }) => {
    // Client-side Gate: reject immediately if not the authorized admin email
    if (!isAuthorizedAdminEmail(credentials.email)) {
      return {
        success: false,
        message: 'Access Denied — this account is not authorized for Admin access.',
      };
    }

    const res = await api.login(credentials);
    if (res.success && res.data && isAuthorizedAdminEmail(res.data.user.email)) {
      localStorage.setItem('priya_admin_token', res.data.token);
      setUser({ ...res.data.user, isFirebaseUser: false });
      return { success: true };
    }
    return {
      success: false,
      message: res.error?.message || 'Login failed. Please check credentials.',
    };
  };

  const loginWithGoogleAuth = async () => {
    try {
      const fbUser = await loginWithGoogle();
      
      // Sync profile to Firestore
      await syncUserProfileToFirestore(fbUser);

      // Security check: Only the exact authorized admin email is granted access
      if (!isAuthorizedAdminEmail(fbUser.email)) {
        localStorage.removeItem('priya_admin_token');
        setUser({
          id: fbUser.uid,
          name: fbUser.displayName || fbUser.email?.split('@')[0] || 'User',
          email: fbUser.email || '',
          role: 'PATIENT',
          isFirebaseUser: true,
        });
        return {
          success: false,
          message: `Access Denied — ${fbUser.email} is not authorized for Admin access.`,
        };
      }

      // Exchange with backend session for authorized admin
      const res = await api.googleLogin({
        email: fbUser.email || '',
        name: fbUser.displayName || fbUser.email?.split('@')[0] || 'Clinic Admin',
        uid: fbUser.uid,
      });

      if (res.success && res.data) {
        localStorage.setItem('priya_admin_token', res.data.token);
        const adminUser: AdminSessionUser = {
          id: res.data.user.id,
          name: res.data.user.name,
          email: res.data.user.email,
          role: res.data.user.role,
          isFirebaseUser: true,
        };
        setUser(adminUser);
        return { success: true };
      } else {
        // Fallback to client session if server endpoint fails
        const adminUser: AdminSessionUser = {
          id: fbUser.uid,
          name: fbUser.displayName || fbUser.email?.split('@')[0] || 'Clinic Admin',
          email: fbUser.email || '',
          role: 'ADMIN',
          isFirebaseUser: true,
        };
        setUser(adminUser);
        return { success: true };
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Google sign-in failed.';
      return { success: false, message: msg };
    }
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch {}
    try {
      await logoutFirebase();
    } catch {}
    localStorage.removeItem('priya_admin_token');
    setUser(null);
  };

  const isAdmin = !!user && user.role === 'ADMIN' && isAuthorizedAdminEmail(user.email);

  return (
    <AuthContext.Provider
      value={{
        user,
        firebaseUser,
        isAuthenticated: !!user,
        isAdmin,
        authorizedAdminEmail: PRIMARY_ADMIN_EMAIL,
        loading,
        login,
        loginWithGoogleAuth,
        logout,
        refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

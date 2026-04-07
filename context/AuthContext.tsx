
import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  signInWithPopup,
  updateEmail,
  updateProfile,
  sendPasswordResetEmail,
  reauthenticateWithCredential,
  EmailAuthProvider
} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';
import { 
  doc, 
  getDoc, 
  setDoc,
  updateDoc,
  onSnapshot,
  collection,
  addDoc
} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';
import { auth, db, googleProvider } from '../lib/firebase';
import { AuthState, User, AccessLog } from '../types';

interface AuthContextType {
  authState: AuthState;
  login: (email: string, pass: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (data: Partial<User>) => Promise<void>;
  updateUserEmail: (newEmail: string, currentPassword?: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ADMIN_EMAIL = 'teste@tese.com';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    loading: true,
  });

  const createAccessLog = async (userId: string, userName: string, type: 'login' | 'logout') => {
    try {
      const log: Omit<AccessLog, 'id'> = {
        userId,
        userName,
        type,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent
      };
      await addDoc(collection(db, 'access_logs'), log);
    } catch (e) {
      console.error("Erro ao gravar log de acesso:", e);
    }
  };

  useEffect(() => {
    let unsubscribeDoc: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        unsubscribeDoc = onSnapshot(doc(db, 'users', firebaseUser.uid), async (userDoc) => {
          if (userDoc.exists()) {
            let userData = userDoc.data() as User;
            const isTargetAdmin = firebaseUser.email?.toLowerCase() === ADMIN_EMAIL;

            if (userData.status === 'suspended' && !isTargetAdmin) {
              await signOut(auth);
              setAuthState({ user: null, isAuthenticated: false, loading: false });
              return;
            }

            if (isTargetAdmin && !userData.isAdmin) {
              updateDoc(doc(db, 'users', firebaseUser.uid), { isAdmin: true }).catch(console.error);
              userData.isAdmin = true;
            }

            // Marca como online ao detectar sessão ativa se ainda não estiver
            if (!userData.isOnline) {
              updateDoc(doc(db, 'users', firebaseUser.uid), { isOnline: true }).catch(console.error);
            }

            setAuthState({
              user: { ...userData, isAdmin: isTargetAdmin || userData.isAdmin },
              isAuthenticated: true,
              loading: false,
            });
          } else {
            setAuthState({ user: null, isAuthenticated: false, loading: false });
          }
        }, (error) => {
          setAuthState({ user: null, isAuthenticated: false, loading: false });
        });
      } else {
        if (unsubscribeDoc) unsubscribeDoc();
        setAuthState({ user: null, isAuthenticated: false, loading: false });
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeDoc) unsubscribeDoc();
    };
  }, []);

  const login = async (email: string, pass: string) => {
    setAuthState(prev => ({ ...prev, loading: true }));
    const userCredential = await signInWithEmailAndPassword(auth, email, pass);
    const uid = userCredential.user.uid;
    
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (userDoc.exists()) {
      let userData = userDoc.data() as User;
      const isTargetAdmin = email.toLowerCase() === ADMIN_EMAIL;
      
      if (userData.status === 'suspended' && !isTargetAdmin) {
        await signOut(auth);
        throw new Error("SUSPENDED_ACCOUNT");
      }

      const lastLogin = new Date().toISOString();
      await updateDoc(doc(db, 'users', uid), { 
        isAdmin: isTargetAdmin || userData.isAdmin,
        isOnline: true,
        lastLogin: lastLogin
      });

      await createAccessLog(uid, userData.name, 'login');

      setAuthState({
        user: { ...userData, isOnline: true, lastLogin, isAdmin: isTargetAdmin || userData.isAdmin },
        isAuthenticated: true,
        loading: false,
      });
    }
  };

  const loginWithGoogle = async () => {
    setAuthState(prev => ({ ...prev, loading: true }));
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    const uid = user.uid;
    
    const userDoc = await getDoc(doc(db, 'users', uid));
    const isTargetAdmin = user.email?.toLowerCase() === ADMIN_EMAIL;
    const lastLogin = new Date().toISOString();
    
    if (userDoc.exists()) {
      const userData = userDoc.data() as User;
      
      if (userData.status === 'suspended' && !isTargetAdmin) {
        await signOut(auth);
        throw new Error("SUSPENDED_ACCOUNT");
      }

      await updateDoc(doc(db, 'users', uid), { 
        isOnline: true, 
        lastLogin,
        isAdmin: isTargetAdmin || userData.isAdmin
      });
      
      await createAccessLog(uid, userData.name, 'login');

      setAuthState({
        user: { ...userData, isOnline: true, lastLogin, isAdmin: isTargetAdmin || userData.isAdmin },
        isAuthenticated: true,
        loading: false,
      });
    } else {
      const newUser: User = {
        id: uid,
        name: user.displayName || '',
        email: user.email || '',
        companyName: '',
        cnpj: '',
        address: '',
        onboardingCompleted: false,
        plan: 'free',
        isAdmin: isTargetAdmin,
        status: 'active',
        isOnline: true,
        lastLogin,
        createdAt: new Date().toISOString()
      };
      await setDoc(doc(db, 'users', uid), newUser);
      await createAccessLog(uid, newUser.name, 'login');

      setAuthState({
        user: newUser,
        isAuthenticated: true,
        loading: false,
      });
    }
  };

  const register = async (data: any) => {
    setAuthState(prev => ({ ...prev, loading: true }));
    const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
    const uid = userCredential.user.uid;
    const isTargetAdmin = data.email.toLowerCase() === ADMIN_EMAIL;
    const lastLogin = new Date().toISOString();
    
    const newUser: User = {
      id: uid,
      name: data.name,
      email: data.email,
      companyName: data.companyName,
      cnpj: data.cnpj,
      address: data.address,
      onboardingCompleted: true,
      plan: 'free',
      isAdmin: isTargetAdmin,
      status: 'active',
      isOnline: true,
      lastLogin,
      createdAt: new Date().toISOString()
    };
    await setDoc(doc(db, 'users', uid), newUser);
    await createAccessLog(uid, newUser.name, 'login');
    
    setAuthState({
      user: newUser,
      isAuthenticated: true,
      loading: false,
    });
  };

  const logout = async () => {
    const user = authState.user;
    setAuthState({ user: null, isAuthenticated: false, loading: true });
    
    if (user) {
      await updateDoc(doc(db, 'users', user.id), { isOnline: false }).catch(console.error);
      await createAccessLog(user.id, user.name, 'logout');
    }
    
    await signOut(auth);
    setAuthState({ user: null, isAuthenticated: false, loading: false });
  };

  const updateUser = async (data: Partial<User>) => {
    if (!authState.user) return;
    const updatedUser = { ...authState.user, ...data };
    
    if (data.name && auth.currentUser) {
      await updateProfile(auth.currentUser, { displayName: data.name });
    }

    await setDoc(doc(db, 'users', authState.user.id), updatedUser, { merge: true });
    setAuthState(prev => ({ ...prev, user: updatedUser as User }));
  };

  const updateUserEmail = async (newEmail: string, currentPassword?: string) => {
    if (!auth.currentUser || !authState.user) return;

    if (currentPassword) {
      const credential = EmailAuthProvider.credential(authState.user.email, currentPassword);
      await reauthenticateWithCredential(auth.currentUser, credential);
    }

    await updateEmail(auth.currentUser, newEmail);
    await updateUser({ email: newEmail });
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  return (
    <AuthContext.Provider value={{ 
      authState, login, loginWithGoogle, register, logout, 
      updateUser, updateUserEmail, resetPassword
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

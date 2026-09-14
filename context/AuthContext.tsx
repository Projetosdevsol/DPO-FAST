
import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  signInWithPopup,
  updateProfile,
  sendPasswordResetEmail,
  reauthenticateWithCredential,
  EmailAuthProvider,
  getMultiFactorResolver,
  PhoneAuthProvider,
  PhoneMultiFactorGenerator,
  multiFactor,
  MultiFactorResolver,
  RecaptchaVerifier,
  verifyBeforeUpdateEmail
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc,
  updateDoc,
  onSnapshot,
  collection,
  addDoc
} from 'firebase/firestore';
import { auth, db, googleProvider } from '../lib/firebase';
import { AuthState, User, AccessLog } from '../types';

interface AuthContextType {
  authState: AuthState;
  login: (email: string, pass: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (data: Partial<User>) => Promise<void>;
  updateUserEmail: (newEmail: string, currentPassword?: string) => Promise<{ verificationSent: boolean }>;
  resetPassword: (email: string) => Promise<void>;
  
  // MFA
  mfaResolver: MultiFactorResolver | null;
  mfaVerificationId: string | null;
  mfaPhoneNumberHint: string | null;
  sendMfaSms: (recaptchaVerifier: any) => Promise<void>;
  confirmMfaCode: (code: string) => Promise<void>;
  enrollMfa: (phoneNumber: string, recaptchaVerifier: any) => Promise<string>;
  confirmMfaEnrollment: (code: string) => Promise<void>;
  unenrollMfa: () => Promise<void>;
  isMfaEnrolled: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ADMIN_EMAIL = 'teste@tese.com';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    loading: true,
  });

  // MFA States
  const [mfaResolver, setMfaResolver] = useState<MultiFactorResolver | null>(null);
  const [mfaVerificationId, setMfaVerificationId] = useState<string | null>(null);
  const [mfaPhoneNumberHint, setMfaPhoneNumberHint] = useState<string | null>(null);
  const [enrollVerificationId, setEnrollVerificationId] = useState<string | null>(null);

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

            // Sincroniza o e-mail do Firebase Auth com o Firestore após confirmação de link
            // (o usuário clicou em "verifyBeforeUpdateEmail" e confirmou o novo e-mail)
            if (firebaseUser.email && userData.email !== firebaseUser.email) {
              updateDoc(doc(db, 'users', firebaseUser.uid), { email: firebaseUser.email }).catch(console.error);
              userData.email = firebaseUser.email;
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

  const handleSuccessfulLogin = async (uid: string, email: string) => {
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

  const login = async (email: string, pass: string) => {
    setAuthState(prev => ({ ...prev, loading: true }));
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, pass);
      const uid = userCredential.user.uid;
      await handleSuccessfulLogin(uid, email);
    } catch (err: any) {
      if (err.code === 'auth/multi-factor-auth-required') {
        const resolver = getMultiFactorResolver(auth, err);
        setMfaResolver(resolver);
        
        // Find phone hints
        const phoneHint = resolver.hints.find(hint => hint.factorId === PhoneMultiFactorGenerator.FACTOR_ID);
        if (phoneHint) {
          setMfaPhoneNumberHint(phoneHint.displayName || (phoneHint as any).phoneNumber || 'Telefone cadastrado');
        }
        setAuthState(prev => ({ ...prev, loading: false }));
        throw err;
      }
      setAuthState(prev => ({ ...prev, loading: false }));
      throw err;
    }
  };

  const sendMfaSms = async (recaptchaVerifier: any) => {
    if (!mfaResolver) throw new Error("MFA_RESOLVER_NOT_FOUND");
    const phoneHint = mfaResolver.hints[0];
    if (!phoneHint) throw new Error("NO_PHONE_HINT_AVAILABLE");
    
    const phoneAuthProvider = new PhoneAuthProvider(auth);
    const verificationId = await phoneAuthProvider.verifyPhoneNumber(
      {
        multiFactorHint: phoneHint,
        session: mfaResolver.session
      },
      recaptchaVerifier
    );
    setMfaVerificationId(verificationId);
  };

  const confirmMfaCode = async (code: string) => {
    if (!mfaResolver || !mfaVerificationId) throw new Error("MFA_SESSION_INVALID");
    
    const cred = PhoneAuthProvider.credential(mfaVerificationId, code);
    const multiFactorAssertion = PhoneMultiFactorGenerator.assertion(cred);
    
    setAuthState(prev => ({ ...prev, loading: true }));
    try {
      const userCredential = await mfaResolver.resolveSignIn(multiFactorAssertion);
      const uid = userCredential.user.uid;
      await handleSuccessfulLogin(uid, userCredential.user.email || '');
      
      // Clear MFA session state
      setMfaResolver(null);
      setMfaVerificationId(null);
      setMfaPhoneNumberHint(null);
    } catch (err) {
      setAuthState(prev => ({ ...prev, loading: false }));
      throw err;
    }
  };

  const enrollMfa = async (phoneNumber: string, recaptchaVerifier: any): Promise<string> => {
    if (!auth.currentUser) throw new Error("USER_NOT_AUTHENTICATED");
    const multiFactorSession = await multiFactor(auth.currentUser).getSession();
    
    const phoneAuthProvider = new PhoneAuthProvider(auth);
    const verificationId = await phoneAuthProvider.verifyPhoneNumber(
      {
        phoneNumber,
        session: multiFactorSession
      },
      recaptchaVerifier
    );
    setEnrollVerificationId(verificationId);
    return verificationId;
  };

  const confirmMfaEnrollment = async (code: string) => {
    if (!auth.currentUser || !enrollVerificationId) throw new Error("ENROLLMENT_SESSION_INVALID");
    
    const cred = PhoneAuthProvider.credential(enrollVerificationId, code);
    const multiFactorAssertion = PhoneMultiFactorGenerator.assertion(cred);
    
    setAuthState(prev => ({ ...prev, loading: true }));
    try {
      await multiFactor(auth.currentUser).enroll(multiFactorAssertion, 'SMS MFA');
      
      // Update local state (refresh user info)
      if (authState.user) {
        await updateUser({});
      }
      setEnrollVerificationId(null);
      setAuthState(prev => ({ ...prev, loading: false }));
    } catch (err) {
      setAuthState(prev => ({ ...prev, loading: false }));
      throw err;
    }
  };

  const unenrollMfa = async () => {
    if (!auth.currentUser) throw new Error("USER_NOT_AUTHENTICATED");
    
    setAuthState(prev => ({ ...prev, loading: true }));
    try {
      const enrolled = multiFactor(auth.currentUser).enrolledFactors;
      if (enrolled.length > 0) {
        await multiFactor(auth.currentUser).unenroll(enrolled[0]);
      }
      if (authState.user) {
        await updateUser({});
      }
      setAuthState(prev => ({ ...prev, loading: false }));
    } catch (err) {
      setAuthState(prev => ({ ...prev, loading: false }));
      throw err;
    }
  };

  const isMfaEnrolled = auth.currentUser 
    ? multiFactor(auth.currentUser).enrolledFactors.length > 0 
    : false;

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
        plan: 'basico',
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
      plan: data.plan || 'basico',
      isAdmin: isTargetAdmin,
      status: 'active',
      status_assinatura: (data.plan === 'free' || isTargetAdmin) ? 'active' : 'past_due',
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

  const updateUserEmail = async (newEmail: string, currentPassword?: string): Promise<{ verificationSent: boolean }> => {
    if (!auth.currentUser || !authState.user) throw new Error('Usuário não autenticado.');

    const emailToAuthenticate = auth.currentUser.email || authState.user.email;

    // Reautentica com a senha atual para operções sensíveis
    if (currentPassword && emailToAuthenticate) {
      const credential = EmailAuthProvider.credential(emailToAuthenticate, currentPassword);
      await reauthenticateWithCredential(auth.currentUser, credential);
    }

    // verifyBeforeUpdateEmail é o método correto no Firebase quando o projeto
    // exige que o novo e-mail seja confirmado antes de efetivar a troca.
    // Envia um link de verificação ao novo e-mail; após o clique, o Firebase Auth
    // atualiza o e-mail automaticamente e o onAuthStateChanged dispara.
    await verifyBeforeUpdateEmail(auth.currentUser, newEmail, {
      url: window.location.origin + '/dashboard/configuracoes',
      handleCodeInApp: false,
    });

    // Não atualizamos o Firestore agora — o e-mail só muda após a confirmação.
    // O onAuthStateChanged cuida da sincronização quando o usuário verificar o link.
    return { verificationSent: true };
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  return (
    <AuthContext.Provider value={{ 
      authState, login, loginWithGoogle, register, logout, 
      updateUser, updateUserEmail, resetPassword,
      mfaResolver, mfaVerificationId, mfaPhoneNumberHint,
      sendMfaSms, confirmMfaCode, enrollMfa, confirmMfaEnrollment,
      unenrollMfa, isMfaEnrolled
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

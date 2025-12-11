import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { toast } from "react-toastify";
import { setAuthToken, removeAuthToken, getAuthToken } from "../lib/api";

interface User {
  id: string;
  email: string;
  created_at: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  forgotPassword: (email: string) => Promise<string | null>;
  resetPassword: (token: string, newPassword: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // ---------------------------
  // Load user from localStorage
  // ---------------------------
  useEffect(() => {
    try {
      const token = getAuthToken();
      const storedUser = localStorage.getItem("auth_user");

      if (token && storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error("Auth check failed:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // ---------------------------
  // LOGIN (OAuth2 compatible)
  // ---------------------------
  const signIn = async (email: string, password: string) => {
    try {
      const form = new URLSearchParams();
      form.append("username", email); // must be "username" for OAuth2
      form.append("password", password);

      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: form,
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        toast.error(errData.detail || "Login failed");
        throw new Error(errData.detail || "Login failed");
      }

      const data = await response.json();
      const accessToken = data.access_token;

      // Save token & user
      setAuthToken(accessToken);
      const userData: User = { id: "unknown", email, created_at: new Date().toISOString() };
      localStorage.setItem("auth_user", JSON.stringify(userData));
      setUser(userData);

      toast.success("Login successful!");
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  };

  // ---------------------------
  // SIGNUP
  // ---------------------------
  const signUp = async (email: string, password: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        toast.error(errData.detail || "Signup failed");
        throw new Error(errData.detail || "Signup failed");
      }

      const data = await res.json();
      const accessToken = data.access_token || data.token; // depending on backend

      setAuthToken(accessToken);
      const userData: User = { id: data.user?.id || "unknown", email, created_at: new Date().toISOString() };
      localStorage.setItem("auth_user", JSON.stringify(userData));
      setUser(userData);

      toast.success("Signup successful!");
    } catch (error) {
      console.error("Signup error:", error);
      throw error;
    }
  };

  // ---------------------------
  // LOGOUT
  // ---------------------------
  const signOut = async () => {
    try {
      const token = getAuthToken();
      if (token) {
        await fetch(`${API_BASE_URL}/auth/signout`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });
      }
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      removeAuthToken();
      localStorage.removeItem("auth_user");
      setUser(null);
      toast.success("Logged out");
    }
  };

  // ---------------------------
  // FORGOT PASSWORD
  // ---------------------------
  const forgotPassword = async (email: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.detail || "Failed to send reset link");
        return null;
      }

      const data = await res.json();
      toast.success("Reset token generated");
      return data.reset_token;
    } catch (error) {
      console.error(error);
      toast.error("Failed to send reset link");
      return null;
    }
  };

  // ---------------------------
  // RESET PASSWORD
  // ---------------------------
  const resetPassword = async (token: string, newPassword: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, new_password: newPassword }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.detail || "Password reset failed");
        return false;
      }

      toast.success("Password reset successful!");
      return true;
    } catch (error) {
      console.error(error);
      toast.error("Password reset failed");
      return false;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signIn,
        signUp,
        signOut,
        forgotPassword,
        resetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ---------------------------
// Custom Hook
// ---------------------------
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}


// import { createContext, useContext, useState, ReactNode } from "react";
// import axios from "axios";

// interface User {
//   id: string;
//   email: string;
//   role?: string;
// }

// interface AuthContextType {
//   user: User | null;
//   loading: boolean;
//   signIn: (email: string, password: string) => Promise<void>;
//   signUp: (email: string, password: string) => Promise<void>;
//   forgotPassword: (email: string) => Promise<{ reset_token: string }>;
//   resetPassword: (token: string, newPassword: string) => Promise<void>;
//   signOut: () => void;
// }

// const AuthContext = createContext<AuthContextType | undefined>(undefined);

// const API_BASE_URL =
//   import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

// export function AuthProvider({ children }: { children: ReactNode }) {
//   const [user, setUser] = useState<User | null>(null);
//   const [loading, setLoading] = useState(false);

//   // -------------------- SIGN IN --------------------
//   const signIn = async (email: string, password: string) => {
//     setLoading(true);
//     try {
//       const formData = new FormData();
//       formData.append("username", email); // FastAPI OAuth2 expects 'username'
//       formData.append("password", password);

//       const res = await axios.post(`${API_BASE_URL}/auth/login`, formData, {
//         headers: { "Content-Type": "multipart/form-data" },
//       });

//       const token = res.data.access_token;
//       localStorage.setItem("token", token);

//       // Optionally use full user info if backend returns it
//       const userInfo: User = {
//         id: res.data.user?.id || "me",
//         email: res.data.user?.email || email,
//         role: res.data.user?.role,
//       };
//       setUser(userInfo);
//     } catch (err: any) {
//       throw new Error(err.response?.data?.detail || "Login failed");
//     } finally {
//       setLoading(false);
//     }
//   };

//   // -------------------- SIGN UP --------------------
//   const signUp = async (email: string, password: string) => {
//     setLoading(true);
//     try {
//       await axios.post(`${API_BASE_URL}/auth/register`, {
//         email,
//         password,
//         role: "user",
//       });
//     } catch (err: any) {
//       throw new Error(err.response?.data?.detail || "Sign up failed");
//     } finally {
//       setLoading(false);
//     }
//   };

//   // -------------------- FORGOT PASSWORD --------------------
//   const forgotPassword = async (email: string) => {
//     try {
//       const res = await fetch(
//         `${API_BASE_URL}/auth/forgot-password?email=${encodeURIComponent(email)}`,
//         {
//           method: "POST",
//         }
//       );

//       if (!res.ok) {
//         const data = await res.json();
//         throw new Error(data.detail || "Failed to request reset token");
//       }

//       const data = await res.json();
//       return { reset_token: data.reset_token };
//     } catch (err: any) {
//       throw new Error(err.message || "Failed to request reset token");
//     }
//   };

//   // -------------------- RESET PASSWORD --------------------
//   const resetPassword = async (token: string, newPassword: string) => {
//     try {
//       const res = await fetch(`${API_BASE_URL}/auth/reset-password`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ token, new_password: newPassword }),
//       });

//       if (!res.ok) {
//         const data = await res.json();
//         throw new Error(data.detail || "Reset failed");
//       }
//     } catch (err: any) {
//       throw new Error(err.message || "Reset failed");
//     }
//   };

//   // -------------------- SIGN OUT --------------------
//   const signOut = () => {
//     localStorage.removeItem("token");
//     setUser(null);
//   };

//   return (
//     <AuthContext.Provider
//       value={{
//         user,
//         loading,
//         signIn,
//         signUp,
//         forgotPassword,
//         resetPassword,
//         signOut,
//       }}
//     >
//       {children}
//     </AuthContext.Provider>
//   );
// }

// // -------------------- CUSTOM HOOK --------------------
// export function useAuth() {
//   const context = useContext(AuthContext);
//   if (!context) throw new Error("useAuth must be used within AuthProvider");
//   return context;
// }
// import { createContext, useContext, useState, ReactNode } from "react";
// import axios from "axios";
// import { authAPI } from "../lib/api";

// interface User {
//   id: string;
//   email: string;
//   role?: string;
// }

// interface AuthContextType {
//   user: User | null;
//   loading: boolean;
//   signIn: (email: string, password: string) => Promise<void>;
//   signUp: (email: string, password: string) => Promise<void>;
//   forgotPassword: (email: string) => Promise<{ reset_token: string }>;
//   resetPassword: (token: string, newPassword: string) => Promise<void>;
//   signOut: () => void;
// }

// const AuthContext = createContext<AuthContextType | undefined>(undefined);

// const API_BASE_URL =
//   import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

// export function AuthProvider({ children }: { children: ReactNode }) {
//   const [user, setUser] = useState<User | null>(null);
//   const [loading, setLoading] = useState(false);

// const signIn = async (email: string, password: string) => {
//   setLoading(true);
//   try {
//     const formData = new FormData();
//     formData.append("username", email);  // OAuth2PasswordRequestForm uses 'username'
//     formData.append("password", password);

//     const res = await axios.post(`${API_BASE_URL}/auth/login`, formData, {
//       headers: { "Content-Type": "multipart/form-data" },
//     });

//     const token = res.data.access_token;
//     localStorage.setItem("token", token);

//     setUser({ id: "me", email }); // minimal info
//   } catch (err: any) {
//     throw new Error(err.response?.data?.detail || "Login failed");
//   } finally {
//     setLoading(false);
//   }
// };

//  const signUp = async (email: string, password: string) => {
//   setLoading(true);
//   try {
//     await axios.post(`${API_BASE_URL}/auth/register`, {
//       email,
//       password,
//       role: "user",
//     });
//   } catch (err: any) {
//     throw new Error(err.response?.data?.detail || "Sign up failed");
//   } finally {
//     setLoading(false);
//   }
// };

//    const forgotPassword = async (email: string) => {
//     const res = await fetch(`${API_BASE_URL}/auth/forgot-password?email=${email}`, {
//       method: "POST",
//     });

//     if (!res.ok) {
//       const data = await res.json();
//       throw new Error(data.detail || "Failed to request reset token");
//     }

//     const data = await res.json();
//     return data.reset_token;
//   };

//   const resetPassword = async (token: string, newPassword: string) => {
//     const res = await fetch(`${API_BASE_URL}auth/reset-password`, {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({ token, new_password: newPassword }),
//     });

//     if (!res.ok) {
//       const data = await res.json();
//       throw new Error(data.detail || "Reset failed");
//     }
//   };

//   const signOut = () => {
//     localStorage.removeItem("token");
//     setUser(null);
//   };

//   return (
//     <AuthContext.Provider value={{ user, loading, signIn, signUp, forgotPassword, resetPassword, signOut }}>
//       {children}
//     </AuthContext.Provider>
//   );
// }

// export function useAuth() {
//   const context = useContext(AuthContext);
//   if (!context) throw new Error("useAuth must be used within AuthProvider");
//   return context;
// }

// import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
// import { User } from '@supabase/supabase-js';
// import { supabase } from '../lib/supabase';
// import { toast } from "react-toastify";

// // interface AuthContextType {
// //   user: User | null;
// //   loading: boolean;
// //   signIn: (email: string, password: string) => Promise<void>;
// //   signUp: (email: string, password: string) => Promise<void>;
// //   signOut: () => Promise<void>;
// // }
// interface User {
//   id: string;
//   email: string;
//   created_at: string;
// }

// interface AuthContextType {
//   user: User | null;
//   loading: boolean;
//   signIn: (email: string, password: string) => Promise<void>;
//   signUp: (email: string, password: string) => Promise<void>;
//   signOut: () => Promise<void>;
//   forgotPassword: (email: string) => Promise<string | null>;
//   resetPassword: (token: string, newPassword: string) => Promise<boolean>;
// }

// const AuthContext = createContext<AuthContextType | undefined>(undefined);

// const API_BASE_URL =
//   import.meta.env.VITE_API_BASE_URL || "http://localhost:5174";

// export function AuthProvider({ children }: { children: ReactNode }) {
//   const [user, setUser] = useState<User | null>(null);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     supabase.auth.getSession().then(({ data: { session } }) => {
//       setUser(session?.user ?? null);
//       setLoading(false);
//     });

//     const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
//       (async () => {
//         setUser(session?.user ?? null);
//       })();
//     });

//     return () => subscription.unsubscribe();
//   }, []);

//   const signIn = async (email: string, password: string) => {
//     const { error } = await supabase.auth.signInWithPassword({ email, password });
//     if (error) throw error;
//   };

//   const signUp = async (email: string, password: string) => {
//     const { error } = await supabase.auth.signUp({ email, password });
//     if (error) throw error;
//   };

//   async function resetPassword(email: string) {
//   const { error } = await supabase.auth.resetPasswordForEmail(email, {
//     redirectTo: "http://localhost:5174/reset-password",
//   });

//   if (error) throw error;
// }

//   const signOut = async () => {
//     const { error } = await supabase.auth.signOut();
//     if (error) throw error;
//   };

//   return (
//     <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut, resetPassword }}>
//       {children}
//     </AuthContext.Provider>
//   );
// }

// export function useAuth() {
//   const context = useContext(AuthContext);
//   if (context === undefined) {
//     throw new Error('useAuth must be used within an AuthProvider');
//   }
//   return context;
// }


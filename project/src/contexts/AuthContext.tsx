import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { toast } from "react-toastify";
import { setAuthToken, removeAuthToken, getAuthToken } from "../lib/api";

interface User {
  id: string;
  email: string;
  role?: string;
  created_at: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  forgotPassword: (email: string) => Promise<string>; // returns reset token
  resetPassword: (token: string, newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

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

  const signIn = async (email: string, password: string) => {
    try {
      const form = new URLSearchParams();
      form.append("username", email);
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

  const signUp = async (email: string, password: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, role: "user" }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        toast.error(errData.detail || "Signup failed");
        throw new Error(errData.detail || "Signup failed");
      }

      toast.success("Signup successful! Please log in.");
    } catch (error) {
      console.error("Signup error:", error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      const token = getAuthToken();
      if (token) {
        await fetch(`${API_BASE_URL}/auth/logout`, {
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
        throw new Error(data.detail || "Failed to send reset link");
      }

      const data = await res.json();
      toast.success("Check your email for the password reset link");
      return data.reset_token; // return token for internal use
    } catch (error) {
      console.error(error);
      toast.error("Failed to send reset link");
      throw error;
    }
  };

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
        throw new Error(data.detail || "Password reset failed");
      }

      toast.success("Password reset successful!");
    } catch (error) {
      console.error(error);
      toast.error("Password reset failed");
      throw error;
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

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}

// import { createContext, useContext, useEffect, useState, ReactNode } from "react";
// import { toast } from "react-toastify";
// import { setAuthToken, removeAuthToken, getAuthToken } from "../lib/api";

// interface User {
//   id: string;
//   email: string;
//   role?: string;
//   created_at: string;
// }

// interface AuthContextType {
//   user: User | null;
//   loading: boolean;
//   signIn: (email: string, password: string) => Promise<void>;
//   signUp: (email: string, password: string) => Promise<void>;
//   signOut: () => Promise<void>;
//   forgotPassword: (email: string) => Promise<void>;
//   resetPassword: (token: string, newPassword: string) => Promise<void>;
// }

// const AuthContext = createContext<AuthContextType | undefined>(undefined);

// const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

// export function AuthProvider({ children }: { children: ReactNode }) {
//   const [user, setUser] = useState<User | null>(null);
//   const [loading, setLoading] = useState(true);

//   // ---------------------------
//   // Load user from localStorage
//   // ---------------------------
//   useEffect(() => {
//     try {
//       const token = getAuthToken();
//       const storedUser = localStorage.getItem("auth_user");

//       if (token && storedUser) {
//         setUser(JSON.parse(storedUser));
//       }
//     } catch (error) {
//       console.error("Auth check failed:", error);
//     } finally {
//       setLoading(false);
//     }
//   }, []);

//   // ---------------------------
//   // LOGIN
//   // ---------------------------
//   const signIn = async (email: string, password: string) => {
//     try {
//       const form = new URLSearchParams();
//       form.append("username", email); // OAuth2 expects "username"
//       form.append("password", password);

//       const response = await fetch(`${API_BASE_URL}/auth/login`, {
//         method: "POST",
//         headers: { "Content-Type": "application/x-www-form-urlencoded" },
//         body: form,
//       });

//       if (!response.ok) {
//         const errData = await response.json().catch(() => ({}));
//         toast.error(errData.detail || "Login failed");
//         throw new Error(errData.detail || "Login failed");
//       }

//       const data = await response.json();
//       const accessToken = data.access_token;

//       setAuthToken(accessToken);
//       const userData: User = { id: "unknown", email, created_at: new Date().toISOString() };
//       localStorage.setItem("auth_user", JSON.stringify(userData));
//       setUser(userData);

//       toast.success("Login successful!");
//     } catch (error) {
//       console.error("Login error:", error);
//       throw error;
//     }
//   };

//   // ---------------------------
//   // SIGNUP
//   // ---------------------------
//   const signUp = async (email: string, password: string) => {
//     try {
//       const res = await fetch(`${API_BASE_URL}/auth/register`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ email, password, role: "user" }),
//       });

//       if (!res.ok) {
//         const errData = await res.json().catch(() => ({}));
//         toast.error(errData.detail || "Signup failed");
//         throw new Error(errData.detail || "Signup failed");
//       }

//       toast.success("Signup successful! Please log in.");
//     } catch (error) {
//       console.error("Signup error:", error);
//       throw error;
//     }
//   };

//   // ---------------------------
//   // LOGOUT
//   // ---------------------------
//   const signOut = async () => {
//     try {
//       const token = getAuthToken();
//       if (token) {
//         await fetch(`${API_BASE_URL}/auth/logout`, {
//           method: "POST",
//           headers: { Authorization: `Bearer ${token}` },
//         });
//       }
//     } catch (error) {
//       console.error("Logout error:", error);
//     } finally {
//       removeAuthToken();
//       localStorage.removeItem("auth_user");
//       setUser(null);
//       toast.success("Logged out");
//     }
//   };

//   // ---------------------------
//   // FORGOT PASSWORD
//   // ---------------------------
//   const forgotPassword = async (email: string) => {
//     try {
//       const res = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ email }),
//       });

//       if (!res.ok) {
//         const data = await res.json().catch(() => ({}));
//         toast.error(data.detail || "Failed to send reset link");
//         return;
//       }

//       toast.success("Check your email for the password reset link");
//     } catch (error) {
//       console.error(error);
//       toast.error("Failed to send reset link");
//     }
//   };

//   // ---------------------------
//   // RESET PASSWORD
//   // ---------------------------
//   const resetPassword = async (token: string, newPassword: string) => {
//     try {
//       const res = await fetch(`${API_BASE_URL}/auth/reset-password`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ token, new_password: newPassword }),
//       });

//       if (!res.ok) {
//         const data = await res.json().catch(() => ({}));
//         toast.error(data.detail || "Password reset failed");
//         return;
//       }

//       toast.success("Password reset successful!");
//     } catch (error) {
//       console.error(error);
//       toast.error("Password reset failed");
//     }
//   };

//   return (
//     <AuthContext.Provider
//       value={{
//         user,
//         loading,
//         signIn,
//         signUp,
//         signOut,
//         forgotPassword,
//         resetPassword,
//       }}
//     >
//       {children}
//     </AuthContext.Provider>
//   );
// }

// // ---------------------------
// // Custom Hook
// // ---------------------------
// export function useAuth() {
//   const context = useContext(AuthContext);
//   if (!context) throw new Error("useAuth must be used within an AuthProvider");
//   return context;
// }


// import { createContext, useContext, useEffect, useState, ReactNode } from "react";
// import { toast } from "react-toastify";
// import { setAuthToken, removeAuthToken, getAuthToken } from "../lib/api";

// interface User {
//   id: string;
//   email: string;
//   role?: string;
//   created_at: string;
// }

// interface AuthContextType {
//   user: User | null;
//   loading: boolean;
//   signIn: (email: string, password: string) => Promise<void>;
//   signUp: (email: string, password: string) => Promise<void>;
//   signOut: () => Promise<void>;
//   forgotPassword: (email: string) => Promise<void>;
//   resetPassword: (token: string, newPassword: string) => Promise<void>;
// }

// const AuthContext = createContext<AuthContextType | undefined>(undefined);

// const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

// export function AuthProvider({ children }: { children: ReactNode }) {
//   const [user, setUser] = useState<User | null>(null);
//   const [loading, setLoading] = useState(true);

//   // ---------------------------
//   // Load user from localStorage
//   // ---------------------------
//   useEffect(() => {
//     try {
//       const token = getAuthToken();
//       const storedUser = localStorage.getItem("auth_user");

//       if (token && storedUser) {
//         setUser(JSON.parse(storedUser));
//       }
//     } catch (error) {
//       console.error("Auth check failed:", error);
//     } finally {
//       setLoading(false);
//     }
//   }, []);

//   // ---------------------------
//   // LOGIN
//   // ---------------------------
//   const signIn = async (email: string, password: string) => {
//     try {
//       const form = new URLSearchParams();
//       form.append("username", email); // OAuth2 expects "username"
//       form.append("password", password);

//       const response = await fetch(`${API_BASE_URL}/auth/login`, {
//         method: "POST",
//         headers: { "Content-Type": "application/x-www-form-urlencoded" },
//         body: form,
//       });

//       if (!response.ok) {
//         const errData = await response.json().catch(() => ({}));
//         toast.error(errData.detail || "Login failed");
//         throw new Error(errData.detail || "Login failed");
//       }

//       const data = await response.json();
//       const accessToken = data.access_token;

//       setAuthToken(accessToken);
//       const userData: User = { id: "unknown", email, created_at: new Date().toISOString() };
//       localStorage.setItem("auth_user", JSON.stringify(userData));
//       setUser(userData);

//       toast.success("Login successful!");
//     } catch (error) {
//       console.error("Login error:", error);
//       throw error;
//     }
//   };

//   // ---------------------------
//   // SIGNUP
//   // ---------------------------
//   const signUp = async (email: string, password: string) => {
//     try {
//       const res = await fetch(`${API_BASE_URL}/auth/register`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ email, password, role: "user" }),
//       });

//       if (!res.ok) {
//         const errData = await res.json().catch(() => ({}));
//         toast.error(errData.detail || "Signup failed");
//         throw new Error(errData.detail || "Signup failed");
//       }

//       toast.success("Signup successful! Please log in.");
//     } catch (error) {
//       console.error("Signup error:", error);
//       throw error;
//     }
//   };

//   // ---------------------------
//   // LOGOUT
//   // ---------------------------
//   const signOut = async () => {
//     try {
//       const token = getAuthToken();
//       if (token) {
//         await fetch(`${API_BASE_URL}/auth/logout`, {
//           method: "POST",
//           headers: { Authorization: `Bearer ${token}` },
//         });
//       }
//     } catch (error) {
//       console.error("Logout error:", error);
//     } finally {
//       removeAuthToken();
//       localStorage.removeItem("auth_user");
//       setUser(null);
//       toast.success("Logged out");
//     }
//   };

//   // ---------------------------
//   // FORGOT PASSWORD
//   // ---------------------------
//   const forgotPassword = async (email: string) => {
//     try {
//       const res = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ email }),
//       });

//       if (!res.ok) {
//         const data = await res.json().catch(() => ({}));
//         toast.error(data.detail || "Failed to send reset link");
//         return;
//       }

//       toast.success("Check your email for the password reset link");
//     } catch (error) {
//       console.error(error);
//       toast.error("Failed to send reset link");
//     }
//   };

//   // ---------------------------
//   // RESET PASSWORD
//   // ---------------------------
//   const resetPassword = async (token: string, newPassword: string) => {
//     try {
//       const res = await fetch(`${API_BASE_URL}/auth/reset-password`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ token, new_password: newPassword }),
//       });

//       if (!res.ok) {
//         const data = await res.json().catch(() => ({}));
//         toast.error(data.detail || "Password reset failed");
//         return;
//       }

//       toast.success("Password reset successful!");
//     } catch (error) {
//       console.error(error);
//       toast.error("Password reset failed");
//     }
//   };

//   return (
//     <AuthContext.Provider
//       value={{
//         user,
//         loading,
//         signIn,
//         signUp,
//         signOut,
//         forgotPassword,
//         resetPassword,
//       }}
//     >
//       {children}
//     </AuthContext.Provider>
//   );
// }

// // ---------------------------
// // Custom Hook
// // ---------------------------
// export function useAuth() {
//   const context = useContext(AuthContext);
//   if (!context) throw new Error("useAuth must be used within an AuthProvider");
//   return context;
// }

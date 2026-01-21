import { useState } from "react";
import { Loader2, X } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

export function AuthPage() {
  const {
    signIn,
    signUp,
    verifyEmail,
    forgotPassword,
    resetPassword,
  } = useAuth();

  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  // 🔐 Reset modal
  const [showResetModal, setShowResetModal] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [resetError, setResetError] = useState("");
  const [resetSuccess, setResetSuccess] = useState("");

  // ---------- LOGIN ----------
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      await signIn(email, password);
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  // ---------- SEND OTP (SIGN UP) ----------
  const handleSignUp = async () => {
    if (!email || !password) {
      setError("Email and password are required.");
      return;
    }

    setError("");
    setSuccess("");
    setLoading(true);

    try {
      await signUp(email, password);
      setSuccess("OTP sent to your email. Please verify.");
    } catch (err: any) {
      setError(err.message || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  // ---------- VERIFY EMAIL ----------
  const handleVerifyEmail = async () => {
    if (!otp) {
      setError("OTP is required.");
      return;
    }

    setError("");
    setSuccess("");
    setLoading(true);

    try {
      await verifyEmail(otp);
      setSuccess("Email verified successfully. You can now sign in.");
      setIsSignUp(false);
      setPassword("");
      setOtp("");
    } catch (err: any) {
      setError(err.message || "Email verification failed");
    } finally {
      setLoading(false);
    }
  };

  // ---------- FORGOT PASSWORD ----------
  const handleForgotPassword = async () => {
    if (!email) {
      setError("Please enter your email first.");
      return;
    }

    setError("");
    setSuccess("");
    setLoading(true);

    try {
      await forgotPassword(email);
      setShowResetModal(true);
      setOtp("");
      setNewPassword("");
      setSuccess("OTP sent to your email.");
    } catch (err: any) {
      setError(err.message || "Failed to send OTP.");
    } finally {
      setLoading(false);
    }
  };

  // ---------- RESET PASSWORD ----------
  const handleResetSubmit = async () => {
    setResetError("");
    setResetSuccess("");

    if (!otp || !newPassword) {
      setResetError("OTP and new password are required.");
      return;
    }

    try {
      await resetPassword(otp, newPassword);
      setResetSuccess("Password updated successfully!");
      setShowResetModal(false);
      setOtp("");
      setNewPassword("");
    } catch (err: any) {
      setResetError(err.message || "Password reset failed.");
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center px-6">
      <div
        className="absolute inset-0 bg-cover bg-center blur-sm"
        style={{ backgroundImage: "url('/bg-map.jpeg')" }}
      />
      <div className="absolute inset-0 bg-white/60 backdrop-blur-md" />

      <div className="relative flex w-full max-w-6xl items-center justify-between">
        <div className="hidden md:block w-1/2 pr-12">
          <h1 className="text-5xl font-bold text-blue-700 mb-4">GPS Tracker</h1>
          <p className="text-lg text-gray-800 mb-8">
            Track assets in real-time and manage devices securely.
          </p>
          <img src="/illustration1.png" className="w-full max-w-md" />
        </div>

        <div className="w-full md:w-1/3">
          <div className="bg-white shadow-2xl rounded-xl p-6">
            {error && (
              <div className="p-3 bg-red-100 text-red-700 rounded mb-2">
                {error}
              </div>
            )}
            {success && (
              <div className="p-3 bg-green-100 text-green-700 rounded mb-2">
                {success}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="email"
                placeholder="Email address"
                className="w-full px-4 py-3 border rounded-lg"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />

              <input
                type="password"
                placeholder="Password"
                className="w-full px-4 py-3 border rounded-lg"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />

              {!isSignUp && (
                <div className="text-right">
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    className="text-blue-600 text-sm hover:underline"
                  >
                    Forgot Password?
                  </button>
                </div>
              )}

              {!isSignUp && (
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg flex justify-center"
                >
                  {loading ? <Loader2 className="animate-spin" /> : "Sign In"}
                </button>
              )}

              {isSignUp && (
                <>
                  <button
                    type="button"
                    onClick={handleSignUp}
                    disabled={loading}
                    className="w-full bg-blue-600 text-white py-3 rounded-lg"
                  >
                    Create Account
                  </button>

                  <input
                    type="text"
                    placeholder="Enter OTP"
                    className="w-full px-4 py-3 border rounded-lg"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                  />

                  <button
                    type="button"
                    onClick={handleVerifyEmail}
                    disabled={loading}
                    className="w-full bg-indigo-600 text-white py-3 rounded-lg flex justify-center"
                  >
                    {loading ? (
                      <Loader2 className="animate-spin" />
                    ) : (
                      "Verify Email"
                    )}
                  </button>
                </>
              )}
            </form>

            <div className="flex items-center my-4">
              <div className="flex-1 border-t" />
              <span className="px-3 text-gray-500 text-sm">or</span>
              <div className="flex-1 border-t" />
            </div>

            <button
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError("");
                setSuccess("");
                setPassword("");
                setOtp("");
              }}
              className="w-full bg-green-600 text-white py-3 rounded-lg"
            >
              {isSignUp ? "Sign In Instead" : "Sign Up / Create Account"}
            </button>
          </div>
        </div>
      </div>

      {showResetModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40">
          <div className="bg-white p-6 rounded-xl w-full max-w-md relative">
            <button
              className="absolute right-3 top-3"
              onClick={() => setShowResetModal(false)}
            >
              <X />
            </button>

            <h2 className="text-xl font-bold mb-3">Reset Password</h2>

            <input
              className="w-full border p-2 rounded mb-3"
              placeholder="Enter OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
            />

            <input
              type="password"
              className="w-full border p-2 rounded"
              placeholder="New password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />

            <button
              onClick={handleResetSubmit}
              className="w-full mt-4 bg-blue-600 text-white py-2 rounded-lg"
            >
              Update Password
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// import { useState } from "react";
// import { Loader2, X } from "lucide-react";
// import { useAuth } from "../contexts/AuthContext";

// export function AuthPage() {
//   const { signIn, signUp, forgotPassword, resetPassword } = useAuth();

//   const [isSignUp, setIsSignUp] = useState(false);
//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");
//   const [error, setError] = useState("");
//   const [success, setSuccess] = useState("");
//   const [loading, setLoading] = useState(false);

//   // 🔐 Reset modal
//   const [showResetModal, setShowResetModal] = useState(false);
//   const [otp, setOtp] = useState("");
//   const [newPassword, setNewPassword] = useState("");
//   const [resetError, setResetError] = useState("");
//   const [resetSuccess, setResetSuccess] = useState("");

//   // ---------- LOGIN / SIGNUP ----------
//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setError("");
//     setSuccess("");
//     setLoading(true);

//     try {
//       if (isSignUp) {
//         await signUp(email, password, otp);
//         setSuccess("Account created. Please verify your email.");
//         setIsSignUp(false);
//         setPassword("");
//         setOtp("");
//       } else {
//         await signIn(email, password);
//       }
//     } catch (err: any) {
//       setError(err.message || "Something went wrong");
//     } finally {
//       setLoading(false);
//     }
//   };

//   // ---------- FORGOT PASSWORD ----------
//   const handleForgotPassword = async () => {
//     if (!email) {
//       setError("Please enter your email first.");
//       return;
//     }

//     setError("");
//     setSuccess("");
//     setLoading(true);

//     try {
//       await forgotPassword(email);
//       setShowResetModal(true);
//       setOtp("");
//       setNewPassword("");
//       setSuccess("OTP sent to your email.");
//     } catch (err: any) {
//       setError(err.message || "Failed to send OTP.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   // ---------- RESET PASSWORD ----------
//   const handleResetSubmit = async () => {
//     setResetError("");
//     setResetSuccess("");

//     if (!otp || !newPassword) {
//       setResetError("OTP and new password are required.");
//       return;
//     }

//     try {
//       await resetPassword(otp, newPassword);
//       setResetSuccess("Password updated successfully!");
//       setShowResetModal(false);
//       setOtp("");
//       setNewPassword("");
//     } catch (err: any) {
//       setResetError(err.message || "Password reset failed.");
//     }
//   };

//   return (
//     <div className="min-h-screen relative flex items-center justify-center px-6">
//       {/* Background */}
//       <div
//         className="absolute inset-0 bg-cover bg-center blur-sm"
//         style={{ backgroundImage: "url('/bg-map.jpeg')" }}
//       />
//       <div className="absolute inset-0 bg-white/60 backdrop-blur-md" />

//       <div className="relative flex w-full max-w-6xl items-center justify-between">
//         {/* Illustration */}
//         <div className="hidden md:block w-1/2 pr-12">
//           <h1 className="text-5xl font-bold text-blue-700 mb-4">
//             GPS Tracker
//           </h1>
//           <p className="text-lg text-gray-800 mb-8">
//             Track assets in real-time and manage devices securely.
//           </p>
//           <img src="/illustration1.png" className="w-full max-w-md" />
//         </div>

//         {/* Auth Card */}
//         <div className="w-full md:w-1/3">
//           <div className="bg-white shadow-2xl rounded-xl p-6">
//             {error && (
//               <div className="p-3 bg-red-100 text-red-700 rounded mb-2">
//                 {error}
//               </div>
//             )}
//             {success && (
//               <div className="p-3 bg-green-100 text-green-700 rounded mb-2">
//                 {success}
//               </div>
//             )}

//             <form onSubmit={handleSubmit} className="space-y-4">
//               <input
//                 type="email"
//                 placeholder="Email address"
//                 className="w-full px-4 py-3 border rounded-lg"
//                 value={email}
//                 onChange={(e) => setEmail(e.target.value)}
//                 required
//               />

//               <input
//                 type="password"
//                 placeholder="Password"
//                 className="w-full px-4 py-3 border rounded-lg"
//                 value={password}
//                 onChange={(e) => setPassword(e.target.value)}
//                 required
//               />

//               {!isSignUp && (
//                 <div className="text-right">
//                   <button
//                     type="button"
//                     onClick={handleForgotPassword}
//                     className="text-blue-600 text-sm hover:underline"
//                   >
//                     Forgot Password?
//                   </button>
//                 </div>
//               )}

//               <button
//                 type="submit"
//                 disabled={loading}
//                 className="w-full bg-blue-600 text-white py-3 rounded-lg flex justify-center"
//               >
//                 {loading ? (
//                   <Loader2 className="animate-spin" />
//                 ) : isSignUp ? (
//                   "Create Account"
//                 ) : (
//                   "Sign In"
//                 )}
//               </button>

//               {/* ✅ OTP FIELD MOVED HERE (AFTER CREATE ACCOUNT BUTTON) */}
//               {isSignUp && (
//                 <input
//                   type="text"
//                   placeholder="Enter OTP"
//                   className="w-full px-4 py-3 border rounded-lg"
//                   value={otp}
//                   onChange={(e) => setOtp(e.target.value)}
//                   required
//                 />
//               )}
//             </form>

//             <div className="flex items-center my-4">
//               <div className="flex-1 border-t" />
//               <span className="px-3 text-gray-500 text-sm">or</span>
//               <div className="flex-1 border-t" />
//             </div>

//             <button
//               onClick={() => {
//                 setIsSignUp(!isSignUp);
//                 setError("");
//                 setSuccess("");
//                 setPassword("");
//                 setOtp("");
//               }}
//               className="w-full bg-green-600 text-white py-3 rounded-lg"
//             >
//               {isSignUp ? "Sign In Instead" : "Sign Up / Create Account"}
//             </button>
//           </div>
//         </div>
//       </div>

//       {/* RESET PASSWORD MODAL */}
//       {showResetModal && (
//         <div className="fixed inset-0 flex items-center justify-center bg-black/40">
//           <div className="bg-white p-6 rounded-xl w-full max-w-md relative">
//             <button
//               className="absolute right-3 top-3"
//               onClick={() => setShowResetModal(false)}
//             >
//               <X />
//             </button>

//             <h2 className="text-xl font-bold mb-3">Reset Password</h2>

//             {resetError && (
//               <div className="p-2 bg-red-100 text-red-700 rounded mb-2">
//                 {resetError}
//               </div>
//             )}
//             {resetSuccess && (
//               <div className="p-2 bg-green-100 text-green-700 rounded mb-2">
//                 {resetSuccess}
//               </div>
//             )}

//             <input
//               className="w-full border p-2 rounded mb-3"
//               placeholder="Enter OTP"
//               value={otp}
//               onChange={(e) => setOtp(e.target.value)}
//             />

//             <input
//               type="password"
//               className="w-full border p-2 rounded"
//               placeholder="New password"
//               value={newPassword}
//               onChange={(e) => setNewPassword(e.target.value)}
//             />

//             <button
//               onClick={handleResetSubmit}
//               className="w-full mt-4 bg-blue-600 text-white py-2 rounded-lg"
//             >
//               Update Password
//             </button>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }



// import { useState } from "react";
// import { Loader2, X } from "lucide-react";
// import { useAuth } from "../contexts/AuthContext";

// export function AuthPage() {
//   const { signIn, signUp, forgotPassword, resetPassword } = useAuth();

//   const [isSignUp, setIsSignUp] = useState(false);
//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");
//   const [error, setError] = useState("");
//   const [success, setSuccess] = useState("");
//   const [loading, setLoading] = useState(false);

//   const [showResetModal, setShowResetModal] = useState(false);
//   const [resetToken, setResetToken] = useState("");
//   const [newPassword, setNewPassword] = useState("");
//   const [resetError, setResetError] = useState("");
//   const [resetSuccess, setResetSuccess] = useState("");

//   // ---------- Handlers ----------
//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setError(""); setSuccess(""); setLoading(true);
//     try {
//       if (isSignUp) {
//         await signUp(email, password);
//         setSuccess("Account created! Please log in.");
//         setIsSignUp(false);
//         setPassword("");
//       } else {
//         await signIn(email, password);
//       }
//     } catch (err: any) {
//       setError(err.message || "Something went wrong");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleForgotPassword = async () => {
//     if (!email) return setError("Enter your email first.");
//     setError(""); setSuccess(""); setLoading(true);
//     try {
//       await forgotPassword(email);
//       setShowResetModal(true);
//       setSuccess("Check your email for the reset link.");
//     } catch (err: any) {
//       setError(err.message || "Failed to send reset request.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleResetSubmit = async () => {
//     setResetError(""); setResetSuccess("");
//     if (!newPassword) return setResetError("Enter a new password.");
//     if (!resetToken) return setResetError("Enter the reset token from email.");

//     try {
//       await resetPassword(resetToken, newPassword);
//       setResetSuccess("Password updated successfully!");
//       setNewPassword("");
//       setResetToken("");
//       setShowResetModal(false);
//     } catch (err: any) {
//       setResetError(err.message || "Reset failed.");
//     }
//   };

//   return (
//     <div className="min-h-screen relative flex items-center justify-center px-6">
//       {/* Background */}
//       <div className="absolute inset-0 bg-cover bg-center filter blur-sm" style={{ backgroundImage: "url('/bg-map.jpeg')" }} />
//       <div className="absolute inset-0 bg-white/60 backdrop-blur-md" />

//       <div className="relative flex w-full max-w-6xl items-center justify-between">
//         {/* Illustration */}
//         <div className="hidden md:block w-1/2 pr-12">
//           <h1 className="text-5xl font-bold text-blue-700 mb-4 drop-shadow">GPS Tracker</h1>
//           <p className="text-lg text-gray-800 mb-8">Track assets in real-time and manage devices securely.</p>
//           <img src="/illustration1.png" className="w-full max-w-md" alt="Illustration" />
//         </div>

//         {/* Auth Card */}
//         <div className="w-full md:w-1/3">
//           <div className="bg-white shadow-2xl rounded-xl p-6 backdrop-blur-md bg-opacity-90">
//             {error && <div className="p-3 bg-red-100 border border-red-300 text-red-700 rounded-lg">{error}</div>}
//             {success && <div className="p-3 bg-green-100 border border-green-300 text-green-700 rounded-lg">{success}</div>}

//             <form onSubmit={handleSubmit} className="space-y-4 mt-4">
//               <input
//                 type="email"
//                 placeholder="Email address"
//                 className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 bg-white/90"
//                 value={email}
//                 onChange={e => setEmail(e.target.value)}
//                 required
//               />

//               <input
//                 type="password"
//                 placeholder="Password"
//                 className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 bg-white/90"
//                 value={password}
//                 onChange={e => setPassword(e.target.value)}
//                 required
//               />

//               {!isSignUp && (
//                 <div className="text-right">
//                   <button
//                     type="button"
//                     className="text-blue-600 text-sm hover:underline"
//                     onClick={handleForgotPassword}
//                   >
//                     Forgot Password?
//                   </button>
//                 </div>
//               )}

//               <button
//                 type="submit"
//                 disabled={loading}
//                 className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition flex items-center justify-center"
//               >
//                 {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : isSignUp ? "Create Account" : "Log In"}
//               </button>
//             </form>

//             <div className="flex items-center my-4">
//               <div className="flex-1 border-t" />
//               <span className="px-3 text-gray-500 text-sm">or</span>
//               <div className="flex-1 border-t" />
//             </div>

//             <button
//               onClick={() => { setIsSignUp(!isSignUp); setError(""); setSuccess(""); setPassword(""); }}
//               className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700"
//             >
//               {isSignUp ? "Sign In Instead" : "Create New Account"}
//             </button>
//           </div>
//         </div>
//       </div>

//       {/* Reset Modal */}
//       {showResetModal && (
//         <div className="fixed inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm">
//           <div className="bg-white p-6 rounded-xl w-full max-w-md shadow-xl relative">
//             <button className="absolute right-3 top-3" onClick={() => setShowResetModal(false)}>
//               <X className="w-5 h-5" />
//             </button>
//             <h2 className="text-xl font-bold mb-2">Reset Password</h2>
//             <p className="text-gray-600 text-sm mb-4">Enter the token sent to your email and your new password.</p>

//             {resetError && <div className="p-2 bg-red-100 text-red-700 rounded mb-2">{resetError}</div>}
//             {resetSuccess && <div className="p-2 bg-green-100 text-green-700 rounded mb-2">{resetSuccess}</div>}

//             <div className="mt-2">
//               <label className="text-sm font-medium">Reset Token</label>
//               <input
//                 className="w-full border p-2 rounded mt-1"
//                 value={resetToken}
//                 onChange={e => setResetToken(e.target.value)}
//                 placeholder="Paste the token from email"
//               />
//             </div>

//             <div className="mt-2">
//               <label className="text-sm font-medium">New Password</label>
//               <input
//                 type="password"
//                 className="w-full border p-2 rounded mt-1"
//                 value={newPassword}
//                 onChange={e => setNewPassword(e.target.value)}
//               />
//             </div>

//             <button
//               onClick={handleResetSubmit}
//               className="w-full mt-4 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
//             >
//               Update Password
//             </button>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }

// import { useState } from "react";
// import { Loader2, X } from "lucide-react";
// import { useAuth } from "../contexts/AuthContext";

// export function AuthPage() {
//   const { signIn, signUp, forgotPassword, resetPassword } = useAuth();

//   // ---------- States ----------
//   const [isSignUp, setIsSignUp] = useState(false);
//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");

//   const [error, setError] = useState("");
//   const [success, setSuccess] = useState("");
//   const [loading, setLoading] = useState(false);

//   // Reset Modal
//   const [showResetModal, setShowResetModal] = useState(false);
//   const [resetToken, setResetToken] = useState("");
//   const [newPassword, setNewPassword] = useState("");
//   const [resetError, setResetError] = useState("");
//   const [resetSuccess, setResetSuccess] = useState("");

//   // ---------- Handlers ----------
//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setError(""); setSuccess(""); setLoading(true);
//     try {
//       if (isSignUp) {
//         await signUp(email, password);
//         setSuccess("Account created! Please log in.");
//         setIsSignUp(false);
//         setPassword("");
//       } else {
//         await signIn(email, password);
//       }
//     } catch (err: any) {
//       setError(err.message || "Something went wrong");
//     } finally { setLoading(false); }
//   };

//   const handleForgotPassword = async () => {
//     if (!email) return setError("Enter your email first.");
//     setError(""); setSuccess(""); setLoading(true);
//     try {
//       const token = await forgotPassword(email);
//       if (token) {
//         setResetToken(token);
//         setShowResetModal(true);
//         setSuccess("Reset token generated! Check your email.");
//       }
//     } catch (err: any) {
//       setError(err.message || "Failed to send reset request.");
//     } finally { setLoading(false); }
//   };

//   const handleResetSubmit = async () => {
//     setResetError(""); setResetSuccess("");
//     try {
//       const ok = await resetPassword(resetToken, newPassword);
//       if (ok) {
//         setResetSuccess("Password updated successfully!");
//         setNewPassword("");
//         setShowResetModal(false);
//       }
//     } catch (err: any) {
//       setResetError(err.message || "Reset failed.");
//     }
//   };

//   // ---------- JSX ----------
//   return (
//     <div className="min-h-screen relative flex items-center justify-center px-6">
//       {/* Background */}
//       <div className="absolute inset-0 bg-cover bg-center filter blur-sm" style={{ backgroundImage: "url('/bg-map.jpeg')" }} />
//       <div className="absolute inset-0 bg-white/60 backdrop-blur-md" />

//       <div className="relative flex w-full max-w-6xl items-center justify-between">
//         {/* Illustration */}
//         <div className="hidden md:block w-1/2 pr-12">
//           <h1 className="text-5xl font-bold text-blue-700 mb-4 drop-shadow">GPS Tracker</h1>
//           <p className="text-lg text-gray-800 mb-8">Track assets in real-time and manage devices securely.</p>
//           <img src="/illustration1.png" className="w-full max-w-md" alt="Illustration" />
//         </div>

//         {/* Auth Card */}
//         <div className="w-full md:w-1/3">
//           <div className="bg-white shadow-2xl rounded-xl p-6 backdrop-blur-md bg-opacity-90">
//             {error && <div className="p-3 bg-red-100 border border-red-300 text-red-700 rounded-lg">{error}</div>}
//             {success && <div className="p-3 bg-green-100 border border-green-300 text-green-700 rounded-lg">{success}</div>}

//             <form onSubmit={handleSubmit} className="space-y-4 mt-4">
//               <input
//                 type="email"
//                 placeholder="Email address"
//                 className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 bg-white/90"
//                 value={email}
//                 onChange={e => setEmail(e.target.value)}
//                 required
//               />

//               <input
//                 type="password"
//                 placeholder="Password"
//                 className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 bg-white/90"
//                 value={password}
//                 onChange={e => setPassword(e.target.value)}
//                 required
//               />

//               {!isSignUp && (
//                 <div className="text-right">
//                   <button
//                     type="button"
//                     className="text-blue-600 text-sm hover:underline"
//                     onClick={handleForgotPassword}
//                   >
//                     Forgot Password?
//                   </button>
//                 </div>
//               )}

//               <button
//                 type="submit"
//                 disabled={loading}
//                 className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition flex items-center justify-center"
//               >
//                 {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : isSignUp ? "Create Account" : "Log In"}
//               </button>
//             </form>

//             <div className="flex items-center my-4">
//               <div className="flex-1 border-t" />
//               <span className="px-3 text-gray-500 text-sm">or</span>
//               <div className="flex-1 border-t" />
//             </div>

//             <button
//               onClick={() => { setIsSignUp(!isSignUp); setError(""); setSuccess(""); setPassword(""); }}
//               className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700"
//             >
//               {isSignUp ? "Sign In Instead" : "Create New Account"}
//             </button>
//           </div>
//         </div>
//       </div>

//       {/* Reset Modal */}
//       {showResetModal && (
//         <div className="fixed inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm">
//           <div className="bg-white p-6 rounded-xl w-full max-w-md shadow-xl relative">
//             <button className="absolute right-3 top-3" onClick={() => setShowResetModal(false)}>
//               <X className="w-5 h-5" />
//             </button>
//             <h2 className="text-xl font-bold mb-2">Reset Password</h2>
//             <p className="text-gray-600 text-sm mb-4">Use the token sent to your email.</p>

//             {resetError && <div className="p-2 bg-red-100 text-red-700 rounded mb-2">{resetError}</div>}
//             {resetSuccess && <div className="p-2 bg-green-100 text-green-700 rounded mb-2">{resetSuccess}</div>}

//             <div className="mt-2">
//               <label className="text-sm font-medium">Reset Token</label>
//               <textarea
//                 className="w-full border p-2 rounded mt-1"
//                 value={resetToken}
//                 onChange={e => setResetToken(e.target.value)}
//               />
//             </div>

//             <div className="mt-2">
//               <label className="text-sm font-medium">New Password</label>
//               <input
//                 type="password"
//                 className="w-full border p-2 rounded mt-1"
//                 value={newPassword}
//                 onChange={e => setNewPassword(e.target.value)}
//               />
//             </div>

//             <button
//               onClick={handleResetSubmit}
//               className="w-full mt-4 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
//             >
//               Update Password
//             </button>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }



// import { useState } from "react";
// import { Loader2, X } from "lucide-react";
// import { useAuth } from "../contexts/AuthContext";

// export function AuthPage() {
//   const [isSignUp, setIsSignUp] = useState(false);
//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");

//   const [error, setError] = useState("");
//   const [success, setSuccess] = useState("");
//   const [loading, setLoading] = useState(false);

//   const { signIn, signUp, forgotPassword, resetPassword } = useAuth();

//   const [showResetModal, setShowResetModal] = useState(false);
//   const [resetToken, setResetToken] = useState("");
//   const [newPassword, setNewPassword] = useState("");
//   const [resetError, setResetError] = useState("");
//   const [resetSuccess, setResetSuccess] = useState("");

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setError(""); setSuccess(""); setLoading(true);
//     try {
//       if (isSignUp) {
//         await signUp(email, password);
//         setSuccess("Account created! Please log in.");
//         setIsSignUp(false);
//       } else {
//         await signIn(email, password);
//       }
//     } catch (err: any) {
//       setError(err.message || "Something went wrong");
//     } finally { setLoading(false); }
//   };

//   const handleForgotPassword = async () => {
//     if (!email) return setError("Enter your email first.");
//     setLoading(true); setError(""); setSuccess("");
//     try {
//       const result = await forgotPassword(email);
//       setSuccess("Reset token generated! Check your email.");
//       setResetToken(result.reset_token);
//       setShowResetModal(true);
//     } catch (err: any) {
//       setError(err.message || "Failed to send reset request.");
//     } finally { setLoading(false); }
//   };

//   const handleResetSubmit = async () => {
//     setResetError(""); setResetSuccess("");
//     try {
//       await resetPassword(resetToken, newPassword);
//       setResetSuccess("Password updated successfully!");
//       setNewPassword("");
//     } catch (err: any) {
//       setResetError(err.message || "Reset failed.");
//     }
//   };

//   return (
//     <div className="min-h-screen relative flex items-center justify-center px-6">
//       {/* Background */}
//       <div className="absolute inset-0 bg-cover bg-center filter blur-sm" style={{ backgroundImage: "url('/bg-map.jpeg')" }} />
//       <div className="absolute inset-0 bg-white/60 backdrop-blur-md" />

//       <div className="relative flex w-full max-w-6xl items-center justify-between">
//         {/* Illustration */}
//         <div className="hidden md:block w-1/2 pr-12">
//           <h1 className="text-5xl font-bold text-blue-700 mb-4 drop-shadow">GPS Tracker</h1>
//           <p className="text-lg text-gray-800 mb-8">Track assets in real-time.</p>
//           <img src="/illustration1.png" className="w-full max-w-md" alt="Illustration" />
//         </div>

//         {/* Auth card */}
//         <div className="w-full md:w-1/3">
//           <div className="bg-white shadow-2xl rounded-xl p-6 backdrop-blur-md bg-opacity-90">
//             {error && <div className="p-3 bg-red-100 border border-red-300 text-red-700 rounded-lg">{error}</div>}
//             {success && <div className="p-3 bg-green-100 border border-green-300 text-green-700 rounded-lg">{success}</div>}

//             <form onSubmit={handleSubmit} className="space-y-4 mt-4">
//               <input type="email" placeholder="Email address" className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 bg-white/90"
//                 value={email} onChange={e => setEmail(e.target.value)} required />

//               {!isSignUp && <input type="password" placeholder="Password" className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 bg-white/90"
//                 value={password} onChange={e => setPassword(e.target.value)} />}

//               {!isSignUp && (
//                 <div className="text-right">
//                   <button type="button" className="text-blue-600 text-sm hover:underline" onClick={handleForgotPassword}>Forgot Password?</button>
//                 </div>
//               )}

//               <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition flex items-center justify-center">
//                 {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : isSignUp ? "Create Account" : "Log In"}
//               </button>
//             </form>

//             <div className="flex items-center my-4">
//               <div className="flex-1 border-t" />
//               <span className="px-3 text-gray-500 text-sm">or</span>
//               <div className="flex-1 border-t" />
//             </div>

//             <button onClick={() => { setIsSignUp(!isSignUp); setError(""); setSuccess(""); }}
//               className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700">
//               {isSignUp ? "Sign In Instead" : "Create New Account"}
//             </button>
//           </div>
//         </div>
//       </div>

//       {/* Reset Modal */}
//       {showResetModal && (
//         <div className="fixed inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm">
//           <div className="bg-white p-6 rounded-xl w-full max-w-md shadow-xl relative">
//             <button className="absolute right-3 top-3" onClick={() => setShowResetModal(false)}><X className="w-5 h-5" /></button>
//             <h2 className="text-xl font-bold mb-2">Reset Password</h2>
//             <p className="text-gray-600 text-sm mb-4">Use the token sent to your email.</p>
//             {resetError && <div className="p-2 bg-red-100 text-red-700 rounded">{resetError}</div>}
//             {resetSuccess && <div className="p-2 bg-green-100 text-green-700 rounded">{resetSuccess}</div>}

//             <div className="mt-4">
//               <label className="text-sm font-medium">Reset Token</label>
//               <textarea className="w-full border p-2 rounded mt-1" value={resetToken} onChange={e => setResetToken(e.target.value)} />
//             </div>

//             <div className="mt-4">
//               <label className="text-sm font-medium">New Password</label>
//               <input type="password" className="w-full border p-2 rounded mt-1" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
//             </div>

//             <button onClick={handleResetSubmit} className="w-full mt-4 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">Update Password</button>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }


// import axios from "axios";

// const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

// // ---------------------- LOGIN ----------------------
// export const loginUser = async (email: string, password: string) => {
//   try {
//     const params = new URLSearchParams();
//     params.append("username", email); // OAuth2PasswordRequestForm uses "username"
//     params.append("password", password);

//     const response = await axios.post(
//       `${API_BASE_URL}/auth/login`,
//       params,
//       {
//         headers: { "Content-Type": "application/x-www-form-urlencoded" }
//       }
//     );

//     return response.data;

//   } catch (error: any) {
//     throw error.response?.data || { error: "Login failed" };
//   }
// };

// // ---------------------- REGISTER ----------------------
// export const registerUser = async (email: string, password: string, role: string) => {
//   try {
//     const response = await axios.post(`${API_BASE_URL}/auth/register`, {
//       email,
//       password,
//       role,
//     });

//     return response.data;

//   } catch (error: any) {
//     throw error.response?.data || { error: "Registration failed" };
//   }
// };

// // ---------------------- FORGOT PASSWORD ----------------------
// export const forgotPassword = async (email: string) => {
//   try {
//     const response = await axios.post(
//       `${API_BASE_URL}/auth/forgot-password?email=${email}`
//     );

//     return response.data;

//   } catch (error: any) {
//     throw error.response?.data || { error: "Failed to send reset link" };
//   }
// };

// // ---------------------- VERIFY RESET TOKEN ----------------------
// export const verifyResetToken = async (token: string) => {
//   try {
//     const response = await axios.get(
//       `${API_BASE_URL}/auth/verify-reset-token/${token}`
//     );

//     return response.data;

//   } catch (error: any) {
//     throw error.response?.data || { error: "Invalid or expired token" };
//   }
// };

// // ---------------------- RESET PASSWORD ----------------------
// export const resetPassword = async (token: string, newPassword: string) => {
//   try {
//     const response = await axios.post(`${API_BASE_URL}/auth/reset-password`, {
//       token,
//       new_password: newPassword
//     });

//     return response.data;

//   } catch (error: any) {
//     throw error.response?.data || { error: "Password reset failed" };
//   }
// };

// // ---------------------- LOGOUT ----------------------
// export const logoutUser = () => {
//   localStorage.removeItem("access_token");
//   return true;
// };

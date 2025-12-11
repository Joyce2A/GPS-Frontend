// import { useState } from "react";
// import { useAuth } from "../contexts/AuthContext";
// import { Eye, EyeOff } from "lucide-react";
// import { useNavigate } from "react-router-dom";

// export function AuthPage() {
//   const { signIn, signUp, forgotPassword, resetPassword, loading } = useAuth();
//   const navigate = useNavigate();

//   const [view, setView] = useState<"login" | "signup" | "forgot" | "reset">("login");
//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");
//   const [resetToken, setResetToken] = useState("");
//   const [showPasswordLogin, setShowPasswordLogin] = useState(false);
//   const [showPasswordSignup, setShowPasswordSignup] = useState(false);
//   const [showPasswordReset, setShowPasswordReset] = useState(false);
//   const [error, setError] = useState("");
//   const [success, setSuccess] = useState("");

//   // -------------------- HANDLERS --------------------

//   const handleLogin = async () => {
//     setError("");
//     setSuccess("");
//     try {
//       await signIn(email, password);
//       setSuccess("Logged in successfully!");
//       setTimeout(() => navigate("/dashboard"), 500); // redirect after login
//     } catch (err: any) {
//       setError(err.message);
//     }
//   };

//   const handleSignup = async () => {
//     setError("");
//     setSuccess("");
//     try {
//       await signUp(email, password);
//       setSuccess("Account created! Please log in.");
//       setView("login");
//     } catch (err: any) {
//       setError(err.message);
//     }
//   };

//   const handleForgot = async () => {
//     setError("");
//     setSuccess("");
//     try {
//       const data = await forgotPassword(email);
//       setResetToken(data.reset_token);
//       setView("reset");
//       setSuccess("Reset token sent. Please enter a new password.");
//     } catch (err: any) {
//       setError(err.message);
//     }
//   };

//   const handleReset = async () => {
//     setError("");
//     setSuccess("");
//     try {
//       await resetPassword(resetToken, password);
//       setSuccess("Password reset successfully! Please login.");
//       setView("login");
//       setPassword("");
//       setResetToken("");
//     } catch (err: any) {
//       setError(err.message);
//     }
//   };

//   // -------------------- UI --------------------

//   const getSubheading = () => {
//     switch (view) {
//       case "login":
//         return "Sign in to your account";
//       case "signup":
//         return "Create a new account";
//       case "forgot":
//         return "Enter your email to reset password";
//       case "reset":
//         return "Set a new password";
//       default:
//         return "";
//     }
//   };

//   return (
//     <div
//       className="min-h-screen flex items-center justify-center bg-cover bg-center"
//       style={{ backgroundImage: "url('/map-background.png')" }}
//     >
//       <div className="flex w-full max-w-6xl bg-white rounded-lg shadow overflow-hidden">
//         {/* Illustration */}
//         <div className="hidden md:block md:w-1/2 bg-blue-100">
//           <img
//             src="/illustration1.png"
//             alt="Illustration"
//             className="h-full w-full object-cover"
//           />
//         </div>

//         {/* Auth Form */}
//         <div className="w-full md:w-1/2 p-10">
//           <h1 className="text-4xl font-bold mb-3 text-center">GPS Tracker</h1>
//           <p className="text-xl text-gray-600 mb-4 text-center">{getSubheading()}</p>
//           {error && <p className="text-red-600 mb-2 text-center">{error}</p>}
//           {success && <p className="text-green-600 mb-2 text-center">{success}</p>}

//           {/* LOGIN */}
//           {view === "login" && (
//             <>
//               <label className="block text-gray-700 mb-2 font-medium text-lg">Email</label>
//               <input
//                 type="email"
//                 className="border p-3 w-full mb-4 text-lg rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
//                 value={email}
//                 onChange={(e) => setEmail(e.target.value)}
//               />

//               <label className="block text-gray-700 mb-2 font-medium text-lg">Password</label>
//               <div className="relative mb-4">
//                 <input
//                   type={showPasswordLogin ? "text" : "password"}
//                   className="border p-3 w-full pr-12 text-lg rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
//                   value={password}
//                   onChange={(e) => setPassword(e.target.value)}
//                 />
//                 <span
//                   className="absolute right-3 top-3 cursor-pointer"
//                   onClick={() => setShowPasswordLogin(!showPasswordLogin)}
//                 >
//                   {showPasswordLogin ? <EyeOff size={24} /> : <Eye size={24} />}
//                 </span>
//               </div>

//               <button
//                 className={`w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded text-lg mb-4 ${
//                   loading ? "opacity-60 cursor-not-allowed" : ""
//                 }`}
//                 onClick={handleLogin}
//                 disabled={loading}
//               >
//                 {loading ? "Loading..." : "Sign In"}
//               </button>

//               <p
//                 className="text-base text-blue-600 cursor-pointer mb-2"
//                 onClick={() => setView("forgot")}
//               >
//                 Forgot Password?
//               </p>
//               <p className="text-base text-center">
//                 Don't have an account?{" "}
//                 <span
//                   className="text-blue-600 cursor-pointer"
//                   onClick={() => setView("signup")}
//                 >
//                   Signup
//                 </span>
//               </p>
//             </>
//           )}

//           {/* SIGNUP */}
//           {view === "signup" && (
//             <>
//               <label className="block text-gray-700 mb-2 font-medium text-lg">Email</label>
//               <input
//                 type="email"
//                 className="border p-3 w-full mb-4 text-lg rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
//                 value={email}
//                 onChange={(e) => setEmail(e.target.value)}
//               />

//               <label className="block text-gray-700 mb-2 font-medium text-lg">Password</label>
//               <div className="relative mb-4">
//                 <input
//                   type={showPasswordSignup ? "text" : "password"}
//                   className="border p-3 w-full pr-12 text-lg rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
//                   value={password}
//                   onChange={(e) => setPassword(e.target.value)}
//                 />
//                 <span
//                   className="absolute right-3 top-3 cursor-pointer"
//                   onClick={() => setShowPasswordSignup(!showPasswordSignup)}
//                 >
//                   {showPasswordSignup ? <EyeOff size={24} /> : <Eye size={24} />}
//                 </span>
//               </div>

//               <button
//                 className={`w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded text-lg mb-4 ${
//                   loading ? "opacity-60 cursor-not-allowed" : ""
//                 }`}
//                 onClick={handleSignup}
//                 disabled={loading}
//               >
//                 {loading ? "Loading..." : "Signup"}
//               </button>

//               <p
//                 className="text-base text-blue-600 cursor-pointer text-center"
//                 onClick={() => setView("login")}
//               >
//                 Back to Sign In
//               </p>
//             </>
//           )}

//           {/* FORGOT PASSWORD */}
//           {view === "forgot" && (
//             <>
//               <label className="block text-gray-700 mb-2 font-medium text-lg">Email</label>
//               <input
//                 type="email"
//                 className="border p-3 w-full mb-4 text-lg rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
//                 value={email}
//                 onChange={(e) => setEmail(e.target.value)}
//               />

//               <button
//                 className={`w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded text-lg ${
//                   loading ? "opacity-60 cursor-not-allowed" : ""
//                 }`}
//                 onClick={handleForgot}
//                 disabled={loading}
//               >
//                 {loading ? "Loading..." : "Get Reset Token"}
//               </button>

//               <p
//                 className="text-base text-blue-600 cursor-pointer mt-4 text-center"
//                 onClick={() => setView("login")}
//               >
//                 Back to Sign In
//               </p>
//             </>
//           )}

//           {/* RESET PASSWORD */}
//           {view === "reset" && (
//             <>
//               <label className="block text-gray-700 mb-2 font-medium text-lg">New Password</label>
//               <div className="relative mb-4">
//                 <input
//                   type={showPasswordReset ? "text" : "password"}
//                   className="border p-3 w-full pr-12 text-lg rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
//                   value={password}
//                   onChange={(e) => setPassword(e.target.value)}
//                 />
//                 <span
//                   className="absolute right-3 top-3 cursor-pointer"
//                   onClick={() => setShowPasswordReset(!showPasswordReset)}
//                 >
//                   {showPasswordReset ? <EyeOff size={24} /> : <Eye size={24} />}
//                 </span>
//               </div>

//               <button
//                 className={`w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded text-lg ${
//                   loading ? "opacity-60 cursor-not-allowed" : ""
//                 }`}
//                 onClick={handleReset}
//                 disabled={loading}
//               >
//                 {loading ? "Loading..." : "Reset Password"}
//               </button>

//               <p
//                 className="text-base text-blue-600 cursor-pointer mt-4 text-center"
//                 onClick={() => setView("login")}
//               >
//                 Back to Sign In
//               </p>
//             </>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// }


// import { useState } from "react";
// import { useAuth } from "../contexts/AuthContext";
// import { Eye, EyeOff } from "lucide-react";

// export function AuthPage() {
//   const { signIn, signUp, forgotPassword, resetPassword } = useAuth();

//   const [view, setView] = useState<"login" | "signup" | "forgot" | "reset">("login");
//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");
//   const [resetToken, setResetToken] = useState("");
//   const [showPasswordLogin, setShowPasswordLogin] = useState(false);
//   const [showPasswordSignup, setShowPasswordSignup] = useState(false);
//   const [showPasswordReset, setShowPasswordReset] = useState(false);
//   const [error, setError] = useState("");
//   const [success, setSuccess] = useState("");

//   // LOGIN
//   const handleLogin = async () => {
//     try {
//       setError("");
//       await signIn(email, password);
//       setSuccess("Logged in successfully!");
//     } catch (err: any) {
//       setError(err.message);
//     }
//   };

//   // SIGNUP
//   const handleSignup = async () => {
//     try {
//       setError("");
//       await signUp(email, password);
//       setSuccess("Account created! Please log in.");
//       setView("login");
//     } catch (err: any) {
//       setError(err.message);
//     }
//   };

//   // FORGOT PASSWORD
//   const handleForgot = async () => {
//     try {
//       setError("");
//       const token = await forgotPassword(email);
//       if (token) {
//         setResetToken(token);
//         setView("reset");
//       }
//     } catch (err: any) {
//       setError(err.message);
//     }
//   };

//   // RESET PASSWORD
//   const handleReset = async () => {
//     try {
//       setError("");
//       await resetPassword(resetToken, password);
//       setSuccess("Password reset successfully! Please login.");
//       setView("login");
//     } catch (err: any) {
//       setError(err.message);
//     }
//   };

//   const getSubheading = () => {
//     switch (view) {
//       case "login":
//         return "Sign in to your account";
//       case "signup":
//         return "Create a new account";
//       case "forgot":
//         return "Enter your email to reset password";
//       case "reset":
//         return "Set a new password";
//       default:
//         return "";
//     }
//   };

//   return (
//     <div
//       className="min-h-screen flex items-center justify-center bg-cover bg-center"
//       style={{ backgroundImage: "url('/map-background.png')" }} // Map background
//     >
//       <div className="flex w-full max-w-6xl bg-white rounded-lg shadow overflow-hidden">
//         {/* Illustration Side */}
//         <div className="hidden md:block md:w-1/2 bg-blue-100">
//           <img
//             src="/illustration1.png"
//             alt="Illustration"
//             className="h-full w-full object-cover"
//           />
//         </div>

//         {/* Auth Form Side */}
//         <div className="w-full md:w-1/2 p-10">
//           <h1 className="text-4xl font-bold mb-3 text-center">GPS Tracker</h1>
//           <p className="text-xl text-gray-600 mb-4 text-center">{getSubheading()}</p>

//           {error && <p className="text-red-600 mb-2 text-center">{error}</p>}
//           {success && <p className="text-green-600 mb-2 text-center">{success}</p>}

//           {/* LOGIN */}
//           {view === "login" && (
//             <>
//               <label className="block text-gray-700 mb-2 font-medium text-lg">Email</label>
//               <input
//                 type="email"
//                 className="border p-3 w-full mb-4 text-lg rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
//                 value={email}
//                 onChange={(e) => setEmail(e.target.value)}
//               />

//               <label className="block text-gray-700 mb-2 font-medium text-lg">Password</label>
//               <div className="relative mb-4">
//                 <input
//                   type={showPasswordLogin ? "text" : "password"}
//                   className="border p-3 w-full pr-12 text-lg rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
//                   value={password}
//                   onChange={(e) => setPassword(e.target.value)}
//                 />
//                 <span
//                   className="absolute right-3 top-3 cursor-pointer"
//                   onClick={() => setShowPasswordLogin(!showPasswordLogin)}
//                 >
//                   {showPasswordLogin ? <EyeOff size={24} /> : <Eye size={24} />}
//                 </span>
//               </div>

//               <button
//                 className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded text-lg mb-4"
//                 onClick={handleLogin}
//               >
//                 Sign In
//               </button>

//               <p
//                 className="text-base text-blue-600 cursor-pointer mb-2"
//                 onClick={() => setView("forgot")}
//               >
//                 Forgot Password?
//               </p>

//               <p className="text-base text-center">
//                 Don't have an account?{" "}
//                 <span
//                   className="text-blue-600 cursor-pointer"
//                   onClick={() => setView("signup")}
//                 >
//                   Signup
//                 </span>
//               </p>
//             </>
//           )}

//           {/* SIGNUP */}
//           {view === "signup" && (
//             <>
//               <label className="block text-gray-700 mb-2 font-medium text-lg">Email</label>
//               <input
//                 type="email"
//                 className="border p-3 w-full mb-4 text-lg rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
//                 value={email}
//                 onChange={(e) => setEmail(e.target.value)}
//               />

//               <label className="block text-gray-700 mb-2 font-medium text-lg">Password</label>
//               <div className="relative mb-4">
//                 <input
//                   type={showPasswordSignup ? "text" : "password"}
//                   className="border p-3 w-full pr-12 text-lg rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
//                   value={password}
//                   onChange={(e) => setPassword(e.target.value)}
//                 />
//                 <span
//                   className="absolute right-3 top-3 cursor-pointer"
//                   onClick={() => setShowPasswordSignup(!showPasswordSignup)}
//                 >
//                   {showPasswordSignup ? <EyeOff size={24} /> : <Eye size={24} />}
//                 </span>
//               </div>

//               <button
//                 className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded text-lg mb-4"
//                 onClick={handleSignup}
//               >
//                 Signup
//               </button>

//               <p
//                 className="text-base text-blue-600 cursor-pointer text-center"
//                 onClick={() => setView("login")}
//               >
//                 Back to Sign In
//               </p>
//             </>
//           )}

//           {/* FORGOT PASSWORD */}
//           {view === "forgot" && (
//             <>
//               <label className="block text-gray-700 mb-2 font-medium text-lg">Email</label>
//               <input
//                 type="email"
//                 className="border p-3 w-full mb-4 text-lg rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
//                 value={email}
//                 onChange={(e) => setEmail(e.target.value)}
//               />

//               <button
//                 className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded text-lg"
//                 onClick={handleForgot}
//               >
//                 Get Reset Token
//               </button>

//               <p
//                 className="text-base text-blue-600 cursor-pointer mt-4 text-center"
//                 onClick={() => setView("login")}
//               >
//                 Back to Sign In
//               </p>
//             </>
//           )}

//           {/* RESET PASSWORD */}
//           {view === "reset" && (
//             <>
//               <label className="block text-gray-700 mb-2 font-medium text-lg">New Password</label>
//               <div className="relative mb-4">
//                 <input
//                   type={showPasswordReset ? "text" : "password"}
//                   className="border p-3 w-full pr-12 text-lg rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
//                   value={password}
//                   onChange={(e) => setPassword(e.target.value)}
//                 />
//                 <span
//                   className="absolute right-3 top-3 cursor-pointer"
//                   onClick={() => setShowPasswordReset(!showPasswordReset)}
//                 >
//                   {showPasswordReset ? <EyeOff size={24} /> : <Eye size={24} />}
//                 </span>
//               </div>

//               <button
//                 className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded text-lg"
//                 onClick={handleReset}
//               >
//                 Reset Password
//               </button>

//               <p
//                 className="text-base text-blue-600 cursor-pointer mt-4 text-center"
//                 onClick={() => setView("login")}
//               >
//                 Back to Sign In
//               </p>
//             </>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// }
import { useState } from "react";
import { Loader2, X } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

export function AuthPage() {
  const { signIn, signUp, forgotPassword, resetPassword } = useAuth();

  // ---------- States ----------
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  // Reset Modal
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [resetError, setResetError] = useState("");
  const [resetSuccess, setResetSuccess] = useState("");

  // ---------- Handlers ----------
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setSuccess(""); setLoading(true);
    try {
      if (isSignUp) {
        await signUp(email, password);
        setSuccess("Account created! Please log in.");
        setIsSignUp(false);
        setPassword("");
      } else {
        await signIn(email, password);
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally { setLoading(false); }
  };

  const handleForgotPassword = async () => {
    if (!email) return setError("Enter your email first.");
    setError(""); setSuccess(""); setLoading(true);
    try {
      const token = await forgotPassword(email);
      if (token) {
        setResetToken(token);
        setShowResetModal(true);
        setSuccess("Reset token generated! Check your email.");
      }
    } catch (err: any) {
      setError(err.message || "Failed to send reset request.");
    } finally { setLoading(false); }
  };

  const handleResetSubmit = async () => {
    setResetError(""); setResetSuccess("");
    try {
      const ok = await resetPassword(resetToken, newPassword);
      if (ok) {
        setResetSuccess("Password updated successfully!");
        setNewPassword("");
        setShowResetModal(false);
      }
    } catch (err: any) {
      setResetError(err.message || "Reset failed.");
    }
  };

  // ---------- JSX ----------
  return (
    <div className="min-h-screen relative flex items-center justify-center px-6">
      {/* Background */}
      <div className="absolute inset-0 bg-cover bg-center filter blur-sm" style={{ backgroundImage: "url('/bg-map.jpeg')" }} />
      <div className="absolute inset-0 bg-white/60 backdrop-blur-md" />

      <div className="relative flex w-full max-w-6xl items-center justify-between">
        {/* Illustration */}
        <div className="hidden md:block w-1/2 pr-12">
          <h1 className="text-5xl font-bold text-blue-700 mb-4 drop-shadow">GPS Tracker</h1>
          <p className="text-lg text-gray-800 mb-8">Track assets in real-time and manage devices securely.</p>
          <img src="/illustration1.png" className="w-full max-w-md" alt="Illustration" />
        </div>

        {/* Auth Card */}
        <div className="w-full md:w-1/3">
          <div className="bg-white shadow-2xl rounded-xl p-6 backdrop-blur-md bg-opacity-90">
            {error && <div className="p-3 bg-red-100 border border-red-300 text-red-700 rounded-lg">{error}</div>}
            {success && <div className="p-3 bg-green-100 border border-green-300 text-green-700 rounded-lg">{success}</div>}

            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <input
                type="email"
                placeholder="Email address"
                className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 bg-white/90"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />

              <input
                type="password"
                placeholder="Password"
                className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 bg-white/90"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />

              {!isSignUp && (
                <div className="text-right">
                  <button
                    type="button"
                    className="text-blue-600 text-sm hover:underline"
                    onClick={handleForgotPassword}
                  >
                    Forgot Password?
                  </button>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition flex items-center justify-center"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : isSignUp ? "Create Account" : "Log In"}
              </button>
            </form>

            <div className="flex items-center my-4">
              <div className="flex-1 border-t" />
              <span className="px-3 text-gray-500 text-sm">or</span>
              <div className="flex-1 border-t" />
            </div>

            <button
              onClick={() => { setIsSignUp(!isSignUp); setError(""); setSuccess(""); setPassword(""); }}
              className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700"
            >
              {isSignUp ? "Sign In Instead" : "Create New Account"}
            </button>
          </div>
        </div>
      </div>

      {/* Reset Modal */}
      {showResetModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white p-6 rounded-xl w-full max-w-md shadow-xl relative">
            <button className="absolute right-3 top-3" onClick={() => setShowResetModal(false)}>
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-bold mb-2">Reset Password</h2>
            <p className="text-gray-600 text-sm mb-4">Use the token sent to your email.</p>

            {resetError && <div className="p-2 bg-red-100 text-red-700 rounded mb-2">{resetError}</div>}
            {resetSuccess && <div className="p-2 bg-green-100 text-green-700 rounded mb-2">{resetSuccess}</div>}

            <div className="mt-2">
              <label className="text-sm font-medium">Reset Token</label>
              <textarea
                className="w-full border p-2 rounded mt-1"
                value={resetToken}
                onChange={e => setResetToken(e.target.value)}
              />
            </div>

            <div className="mt-2">
              <label className="text-sm font-medium">New Password</label>
              <input
                type="password"
                className="w-full border p-2 rounded mt-1"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
              />
            </div>

            <button
              onClick={handleResetSubmit}
              className="w-full mt-4 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
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

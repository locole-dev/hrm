import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AlertCircle, ArrowRight, Eye, EyeOff, Mail } from "lucide-react";
import { isAxiosError } from "axios";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { BrandMark } from "@/components/brand-mark";
import { useAuth } from "@/hooks/use-auth";

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [email, setEmail] = useState("admin@hrm.local");
  const [password, setPassword] = useState("Admin@123456");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      await login({ email, password });
      const nextPath =
        typeof location.state === "object" &&
        location.state &&
        "from" in location.state &&
        typeof location.state.from === "string"
          ? location.state.from
          : "/";
      navigate(nextPath, { replace: true });
    } catch (error) {
      if (!isAxiosError(error)) {
        setError("Login failed. Please try again.");
      } else if (!error.response) {
        setError("Cannot reach backend API. Please check backend server and API base URL.");
      } else if (error.response.status === 401) {
        setError("Invalid email or password.");
      } else {
        setError("Login failed. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="bg-[#f7f9fb] text-[#191c1e] antialiased min-h-screen flex items-center justify-center overflow-x-hidden font-sans">
      {/* Background Decor */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-[20%] -left-[10%] w-[60%] h-[70%] bg-[#d7e2ff]/40 rounded-full blur-[120px]"></div>
        <div className="absolute -bottom-[10%] -right-[5%] w-[40%] h-[50%] bg-[#d5e3fc]/50 rounded-full blur-[100px]"></div>
      </div>

      <main className="relative z-10 grid w-full max-w-screen-xl grid-cols-1 items-center gap-10 px-4 py-8 sm:px-6 sm:py-12 lg:grid-cols-12 lg:gap-12">
        {/* Left Column */}
        <div className="lg:col-span-6 xl:col-span-7 space-y-10">
          <div className="flex items-center space-x-3">
            <BrandMark className="size-12 shrink-0 shadow-[0_12px_24px_rgba(0,52,111,0.18)]" />
            <h1 className="text-3xl font-extrabold tracking-tight text-[#00346f]">Architect HRM</h1>
          </div>
          <div className="space-y-6">
            <h2 className="text-4xl font-extrabold text-[#191c1e] leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl">
              The Orchestrated <span className="text-[#004a99]">Workspace.</span>
            </h2>
            <p className="text-[#424751] text-lg max-w-md leading-relaxed">
              Designed for clarity. Built for precision. Manage your workforce within a curated, breathable narrative environment.
            </p>
          </div>
          <div className="flex flex-col gap-6 pt-2 sm:flex-row sm:items-center sm:gap-8 sm:pt-6">
            <div className="flex flex-col">
              <span className="text-2xl font-bold text-[#00346f]">12k+</span>
              <span className="text-xs uppercase tracking-widest text-[#737783] font-semibold mt-1">Employees Managed</span>
            </div>
            <div className="hidden h-10 w-[1px] bg-[#c2c6d3]/60 sm:block"></div>
            <div className="flex flex-col">
              <span className="text-2xl font-bold text-[#00346f]">99.9%</span>
              <span className="text-xs uppercase tracking-widest text-[#737783] font-semibold mt-1">Uptime Precision</span>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-6 xl:col-span-5 flex justify-center lg:justify-end">
          <div className="w-full max-w-[440px] bg-white/80 backdrop-blur-[20px] p-8 lg:p-10 rounded-2xl shadow-[0_20px_40px_rgba(25,28,30,0.06)] border border-[#c2c6d3]/30">
            <div className="mb-10">
              <h3 className="text-2xl font-bold mb-2 text-[#191c1e]">Secure Login</h3>
              <p className="text-[#424751] text-sm">Welcome back. Enter your credentials to access the Admin Console.</p>
            </div>
            
            {error && (
              <Alert variant="destructive" className="mb-6 rounded-xl">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Login error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Email Field */}
              <div className="relative group">
                <label htmlFor="email" className="text-xs font-semibold text-[#737783] tracking-wider uppercase mb-2 block">
                  Corporate Email
                </label>
                <div className="relative">
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    className="w-full bg-transparent border-b-2 border-[#e0e3e5] focus:border-[#00346f] hover:border-[#c2c6d3] focus:outline-none focus:ring-0 px-0 py-3 text-[#191c1e] transition-all placeholder:text-[#c2c6d3]/70"
                  />
                  <Mail className="absolute right-0 top-1/2 -translate-y-1/2 text-[#c2c6d3] size-5" />
                </div>
              </div>

              {/* Password Field */}
              <div className="relative group">
                <div className="flex justify-between items-center mb-2">
                  <label htmlFor="password" className="text-xs font-semibold text-[#737783] tracking-wider uppercase block">
                    Password
                  </label>
                  <a href="#" className="text-xs font-semibold text-[#00346f] hover:text-[#004a99] transition-colors">
                    Forgot Password?
                  </a>
                </div>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-transparent border-b-2 border-[#e0e3e5] focus:border-[#00346f] hover:border-[#c2c6d3] focus:outline-none focus:ring-0 px-0 py-3 text-[#191c1e] transition-all placeholder:text-[#c2c6d3]/70 pr-8"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-0 top-1/2 -translate-y-1/2 text-[#c2c6d3] hover:text-[#00346f] transition-colors"
                  >
                    {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                  </button>
                </div>
              </div>

              {/* Options */}
              <div className="flex items-center">
                <label className="flex items-center cursor-pointer group">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded-sm border-[#c2c6d3] text-[#00346f] focus:ring-[#00346f]/20 cursor-pointer"
                  />
                  <span className="ml-3 text-sm font-medium text-[#424751] group-hover:text-[#191c1e] transition-colors">
                    Keep me signed in for 30 days
                  </span>
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-[linear-gradient(135deg,_#00346f_0%,_#004a99_100%)] text-white font-bold py-4 rounded-xl shadow-[0_8px_16px_rgba(0,52,111,0.2)] hover:shadow-[0_12px_24px_rgba(0,52,111,0.3)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all flex items-center justify-center space-x-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                <span>{isSubmitting ? "Signing into Dashboard..." : "Sign into Dashboard"}</span>
                <ArrowRight className="size-5" />
              </button>
            </form>

            <div className="mt-10 pt-8 border-t border-[#e0e3e5] text-center">
              <p className="text-sm text-[#424751]">
                New organization?
                <a href="#" className="font-bold text-[#00346f] hover:underline ml-1">Request Platform Access</a>
              </p>
            </div>

            {/* Seed Demo injected block */}
            <div className="mt-8 rounded-xl bg-[#00346f]/5 p-4 text-sm text-[#00346f] relative border border-[#00346f]/10">
              <span className="font-semibold block mb-2 opacity-80">Seed Demo Accounts:</span>
              <div className="space-y-1 font-medium text-[#00346f] text-xs opacity-90">
                <div>admin@hrm.local / Admin@123456</div>
                <div>manager@hrm.local / Manager@123456</div>
                <div>ngoc.tran@hrm.local / Employee@123456</div>
              </div>
            </div>

          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="fixed bottom-8 w-full px-8 flex justify-between items-center z-10 text-[#737783] text-[10px] uppercase tracking-widest pointer-events-none hidden md:flex">
        <div className="flex space-x-6 pointer-events-auto">
          <a href="#" className="hover:text-[#00346f] transition-colors">Privacy</a>
          <a href="#" className="hover:text-[#00346f] transition-colors">Security Standards</a>
          <a href="#" className="hover:text-[#00346f] transition-colors">Global Support</a>
        </div>
        <div>© 2024 ARCHITECT HRM. ALL RIGHTS RESERVED.</div>
      </footer>
    </div>
  );
}

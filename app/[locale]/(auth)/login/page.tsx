"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useTheme } from "next-themes";
import { useEffect } from "react";

export default function LoginPage() {
  const [role, setRole] = useState<"renter" | "owner">("renter");
  const [showPassword, setShowPassword] = useState(false);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background-light dark:bg-background-dark">
      {/* Left Side: Lifestyle Hero */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-background-dark items-center justify-center p-12 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-black/40 z-10"></div>
          <div 
            className="w-full h-full bg-cover bg-center" 
            style={{ 
              backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuAdN-lLu8tESgKMpAuZi9tGbaoTaBrPk29pfmNjBRWhU9joWWj5fJ3yG_R_LP-fBdE8DaRmWv1bd_hWdpt0sFmjUo7OtLiA16NXPVHDKPS7alaTnr6BsRyrVErtsdFm21nqo1YlkCzroV7HmV2DoHoAsUP_8LVFHFlXVj8ePHQWR9mAWEQ_idHq1UAb9O3n9iDifrl_62aVoIICzdoLtv54QQGtontyCLu9L_lwo0JDOxh_RHHoguOaqMKJVWOQFAOTUeH-XpRQvQ8")'
            }}
          ></div>
        </div>
        
        <div className="relative z-20 w-full max-w-md">
          {/* Logo NestHub avec espace devant */}
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2 bg-primary rounded-lg">
              <svg className="size-8 text-[#0d1b13]" fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                <path d="M42.1739 20.1739L27.8261 5.82609C29.1366 7.13663 28.3989 10.1876 26.2002 13.7654C24.8538 15.9564 22.9595 18.3449 20.6522 20.6522C18.3449 22.9595 15.9564 24.8538 13.7654 26.2002C10.1876 28.3989 7.13663 29.1366 5.82609 27.8261L20.1739 42.1739C21.4845 43.4845 24.5355 42.7467 28.1133 40.548C30.3042 39.2016 32.6927 37.3073 35 35C37.3073 32.6927 39.2016 30.3042 40.548 28.1133C42.7467 24.5355 43.4845 21.4845 42.1739 20.1739Z" fill="currentColor"></path>
              </svg>
            </div>
            <h1 className="text-white text-4xl font-bold tracking-tight">NestHub</h1>
          </div>

          <h2 className="text-white text-5xl font-bold leading-tight mb-6">Your AI-powered home journey starts here.</h2>
          <p className="text-white/80 text-lg leading-relaxed max-w-sm">
            A comprehensive platform for renting and managing properties with trust and transparency.
          </p>
          
          <div className="mt-12 flex gap-4">
            <div className="flex -space-x-2">
              <div className="size-10 rounded-full border-2 border-white bg-gray-200 overflow-hidden bg-cover bg-center" 
                style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuBSpSNqU4V7Py3h2Oay224pZ0uPcQ72LM8rMGhbb-yPK_RIW7kDJhG0c77vt8Xusxoi8I990m7XbP1ovP54QVULjyIznCT9J53Beq1b1I0-epNjZXn0PMcX4B7QGlnb5rsr5BhOi0AMP_xwZBLhUQzu8R1lvP2jxmtyUrQBvwkmTqWrqQ0rsfvbFjk-s1xnQ52QiOAwHf60OlZnmPraydMh2nkYujAw3mBuM8Mp0_s7E3hRvOwSIL_8eZdFUZmc7TgP0Ht9-49uaaw")' }}
              ></div>
              <div className="size-10 rounded-full border-2 border-white bg-gray-200 overflow-hidden bg-cover bg-center" 
                style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuAe9t5-KvOpUEFCG7Gnfezy1193VOy3Blfvu3sq3TTiy8iIYnA_CvqEKB7HTkr1t0JaN4W0UnrrFxl78JIBA4KcpA6jr5RN4gYzmnT4eOHOU4529AL0wIuMHxUwGMLf_G7CD1k1mKk2WvdU30m7H5Jh-aNZFT6L9z3OGevhKmSDYpcg3c1mIfwoW9jGXJIudejx1KTnOIdqsR5zougIJdDYhLbv1Nlrh1n6cvy7BJ8c31bT9DSOgNvObuziJ6pyd3SCLgmD_FjTwtY")' }}
              ></div>
              <div className="size-10 rounded-full border-2 border-white bg-gray-200 overflow-hidden bg-cover bg-center" 
                style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuCzmr-dmT7IkdwvuB1jWR4s2bu_3CnQDfiYXjwMigE0-oqjSviYFD58Z5VvXJRrVFHHG38vdCmEF2W1FkEm84q9_penqRfFDaOzgs9GLkJ5Cs4lqVZz34Wz8ZZuC7NnVIaA15Vs2NUm2Sj7OhUadmcwXufG66S2jv9Q1cYldXlaC7aNxXioBVp_V7XDZUCrX7a5YKATs0pZFTb3Hw3i1wLxySYlFQoUOGW5kPxLgi7a1nrTHWYUIv8IKk1vZ_41ictmfe_URsWs-IA")' }}
              ></div>
            </div>
            <p className="text-white text-sm font-medium self-center">Join 5,000+ owners and renters</p>
          </div>
        </div>
      </div>

      {/* Right Side: Login Form */}
      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center px-6 py-12 bg-white dark:bg-background-dark">
        <div className="w-full max-w-md">
          {/* Mobile Logo avec espace */}
          <div className="lg:hidden flex items-center gap-2 mb-10 justify-center">
            <div className="size-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="material-symbols-outlined text-white text-xl">home</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">NestHub</h2>
          </div>

          <div className="mb-10 text-center lg:text-left">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Welcome back</h2>
            <p className="text-gray-500 dark:text-gray-400">Please enter your details to log in to your account.</p>
          </div>

          {/* Theme Switcher - À ajouter ici */}
          <div className="flex justify-end mb-4">
            {/* Ton ThemeSwitcher component ici */}
          </div>

          {/* Role Switcher */}
          <div className="segmented-control mb-8 bg-gray-100 dark:bg-white/5 p-1 rounded-xl flex">
            <input 
              checked={role === "renter"} 
              className="hidden" 
              id="renter" 
              name="role" 
              type="radio" 
              value="renter"
              onChange={() => setRole("renter")}
            />
            <label 
              className={`flex-1 text-center py-2.5 rounded-lg text-sm font-semibold cursor-pointer transition-all ${
                role === "renter" 
                  ? "bg-white dark:bg-background-dark shadow-sm text-gray-900 dark:text-white" 
                  : "text-gray-500 dark:text-gray-400"
              }`} 
              htmlFor="renter"
            >
              Renter
            </label>
            
            <input 
              checked={role === "owner"} 
              className="hidden" 
              id="owner" 
              name="role" 
              type="radio" 
              value="owner"
              onChange={() => setRole("owner")}
            />
            <label 
              className={`flex-1 text-center py-2.5 rounded-lg text-sm font-semibold cursor-pointer transition-all ${
                role === "owner" 
                  ? "bg-white dark:bg-background-dark shadow-sm text-gray-900 dark:text-white" 
                  : "text-gray-500 dark:text-gray-400"
              }`} 
              htmlFor="owner"
            >
              Owner
            </label>
          </div>

          {/* Form Fields */}
          <form className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2" htmlFor="email">
                Email Address
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg">mail</span>
                <input 
                  className="w-full pl-12 pr-4 py-3.5 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all dark:text-white" 
                  id="email" 
                  name="email" 
                  placeholder="name@company.com" 
                  required 
                  type="email"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300" htmlFor="password">
                  Password
                </label>
                <Link href="#" className="text-sm font-semibold text-emerald-600 dark:text-primary hover:underline">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg">lock</span>
                <input 
                  className="w-full pl-12 pr-12 py-3.5 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all dark:text-white" 
                  id="password" 
                  name="password" 
                  placeholder="••••••••" 
                  required 
                  type={showPassword ? "text" : "password"}
                />
                <button 
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <span className="material-symbols-outlined text-lg">
                    {showPassword ? "visibility_off" : "visibility"}
                  </span>
                </button>
              </div>
            </div>

            <div className="flex items-center">
              <input 
                className="size-4 text-primary border-gray-300 rounded focus:ring-primary" 
                id="remember" 
                type="checkbox"
              />
              <label className="ml-2 text-sm text-gray-600 dark:text-gray-400" htmlFor="remember">
                Keep me logged in
              </label>
            </div>

            <button 
              className="w-full py-4 bg-primary text-[#0d1b13] font-bold rounded-xl hover:bg-emerald-400 active:scale-[0.98] transition-all flex items-center justify-center gap-2" 
              type="submit"
            >
              Log In
              <span className="material-symbols-outlined">arrow_forward</span>
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-10">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200 dark:border-white/10"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white dark:bg-background-dark text-gray-500 font-medium">
                Or continue with
              </span>
            </div>
          </div>

          {/* Social Logins */}
          <div className="grid grid-cols-2 gap-4">
            <button className="flex items-center justify-center gap-2 py-3 px-4 border border-gray-200 dark:border-white/10 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 transition-all text-sm font-semibold text-gray-700 dark:text-gray-200">
              <svg className="size-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"></path>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"></path>
              </svg>
              Google
            </button>
            
            <button className="flex items-center justify-center gap-2 py-3 px-4 border border-gray-200 dark:border-white/10 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 transition-all text-sm font-semibold text-gray-700 dark:text-gray-200">
              <svg className="size-5 fill-current" viewBox="0 0 24 24">
                <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.82-.779.883-1.467 2.337-1.286 3.713 1.35.104 2.727-.715 3.573-1.703z"></path>
              </svg>
              Apple
            </button>
          </div>

          <p className="mt-10 text-center text-sm text-gray-600 dark:text-gray-400">
            Dont have an account? 
            <Link href="#" className="font-bold text-emerald-600 dark:text-primary hover:underline ml-1">
              Sign up for free
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
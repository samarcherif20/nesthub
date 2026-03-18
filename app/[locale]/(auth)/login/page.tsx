"use client";

import { SignIn } from "@clerk/nextjs";
import { motion } from "framer-motion";
import Image from "next/image";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  useEffect(() => {
    const redirect = localStorage.getItem("redirectAfterLogin");
    if (redirect) {
      localStorage.removeItem("redirectAfterLogin");
      router.push(redirect);
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0B1E3F] to-[#112B4E] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="relative w-12 h-12">
            <Image
              src="/logo/logo.png"
              alt="NestHub Logo"
              fill
              className="object-contain"
            />
          </div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 via-sky-600 to-purple-500 text-transparent bg-clip-text">
            N E S T H U B
          </h2>
        </div>

        <SignIn 
          routing="path" 
          path="/fr/login"
          signUpUrl="/fr/inscription"
          afterSignInUrl="/fr/dashboard"
        />
      </motion.div>
    </div>
  );
}
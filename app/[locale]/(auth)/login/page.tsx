"use client";

import { SignIn } from "@clerk/nextjs";
import { motion } from "framer-motion";
import Image from "next/image";

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0B1E3F] to-[#112B4E] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
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

        {/* Composant Clerk SignIn */}
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
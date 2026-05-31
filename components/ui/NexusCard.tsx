"use client";

import { ChevronRightIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useRef, useEffect, useState } from "react";
import { useTranslations } from "next-intl";

const NexusCard = () => {
  const router = useRouter();
  const t = useTranslations("NexusCard");
  const [showModal, setShowModal] = useState(false);
  const [hasNotifications, setHasNotifications] = useState(false);
  const nexusRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Détection du thème - INVERSÉE
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    // Vérifier le thème actuel (Tailwind dark mode)
    const checkTheme = () => {
      const isDarkMode = document.documentElement.classList.contains("dark");
      // INVERSION : mode clair système = carte dark (true)
      //            mode sombre système = carte slate (false)
      setIsDark(!isDarkMode);
    };

    checkTheme();

    // Observer les changements de thème
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  // Simulation notification (optionnelle)
  useEffect(() => {
    const timer = setTimeout(() => setHasNotifications(true), 3000);
    return () => clearTimeout(timer);
  }, []);

  // Effet 3D
  useEffect(() => {
    const element = nexusRef.current;
    if (!element) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = element.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      const rotateX = ((y - centerY) / centerY) * -6;
      const rotateY = ((x - centerX) / centerX) * 6;

      element.style.setProperty("--rx", `${rotateX}deg`);
      element.style.setProperty("--ry", `${rotateY}deg`);
    };

    const handleMouseLeave = () => {
      element.style.setProperty("--rx", "0deg");
      element.style.setProperty("--ry", "0deg");
    };

    element.addEventListener("mousemove", handleMouseMove);
    element.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      element.removeEventListener("mousemove", handleMouseMove);
      element.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  // Animation canvas constellations (seulement en mode dark)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !isDark) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let particles: Particle[] = [];

    const resizeCanvas = () => {
      const container = canvas.parentElement;
      if (container) {
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
      }
    };

    class Particle {
      x: number;
      y: number;
      size: number;
      speedX: number;
      speedY: number;
      opacity: number;

      constructor(width: number, height: number) {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.size = Math.random() * 1.5 + 0.5;
        this.speedX = (Math.random() - 0.5) * 0.3;
        this.speedY = (Math.random() - 0.5) * 0.3;
        this.opacity = Math.random() * 0.4 + 0.2;
      }

      update(width: number, height: number) {
        this.x += this.speedX;
        this.y += this.speedY;
        if (this.x < 0) this.x = width;
        if (this.x > width) this.x = 0;
        if (this.y < 0) this.y = height;
        if (this.y > height) this.y = 0;
      }

      draw(ctx: CanvasRenderingContext2D) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${this.opacity})`;
        ctx.fill();
      }
    }

    const initParticles = (width: number, height: number) => {
      particles = [];
      for (let i = 0; i < 80; i++) {
        particles.push(new Particle(width, height));
      }
    };

    const connectParticles = (
      ctx: CanvasRenderingContext2D,
      width: number,
      height: number,
    ) => {
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          if (distance < 120) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(139, 92, 246, ${0.1 * (1 - distance / 120)})`;
            ctx.lineWidth = 0.5;
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }
    };

    const animate = () => {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((particle) => {
        particle.update(canvas.width, canvas.height);
        particle.draw(ctx);
      });
      connectParticles(ctx, canvas.width, canvas.height);
      animationFrameId = requestAnimationFrame(animate);
    };

    const setup = () => {
      resizeCanvas();
      if (canvas.width > 0 && canvas.height > 0) {
        initParticles(canvas.width, canvas.height);
        animate();
      }
    };

    const resizeObserver = new ResizeObserver(() => {
      resizeCanvas();
      if (canvas.width > 0 && canvas.height > 0) {
        particles = [];
        initParticles(canvas.width, canvas.height);
      }
    });

    const parentElement = canvas.parentElement;
    if (parentElement) {
      resizeObserver.observe(parentElement);
      setup();
    }

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
    };
  }, [isDark]);

  // Fonction de redirection
  const handleDiscover = () => {
    router.push("/upgrade-role");
  };

  return (
    <>
      <div
        ref={nexusRef}
        className="w-full max-w-[270px] mx-auto"
        style={{
          transform:
            "perspective(1000px) rotateX(var(--rx, 0deg)) rotateY(var(--ry, 0deg))",
          transition: "transform 0.2s ease-out",
        }}
      >
        <div
          className={`relative rounded-[32px] overflow-hidden transition-all duration-500
          ${
            isDark
              ? "shadow-[0_20px_80px_rgba(124,58,237,0.25)] hover:shadow-[0_30px_100px_rgba(124,58,237,0.35)]"
              : "shadow-[0_20px_40px_rgba(0,0,0,0.08)] hover:shadow-[0_30px_50px_rgba(0,0,0,0.12)]"
          }`}
        >
          {/* FOND - Version Dark Mode */}
          {isDark && (
            <div className="absolute inset-0 bg-gradient-to-br from-[#0a0a0f] via-[#0d0d15] to-[#050508]">
              <div className="absolute inset-0 opacity-60">
                <div className="absolute top-0 left-0 w-[600px] h-[600px] rounded-full bg-violet-600/20 blur-[100px]" />
                <div className="absolute top-1/2 right-0 w-[500px] h-[500px] rounded-full bg-indigo-500/20 blur-[100px]" />
                <div className="absolute bottom-0 left-1/4 w-[700px] h-[700px] rounded-full bg-cyan-500/15 blur-[120px]" />
                <div className="absolute bottom-1/2 right-1/4 w-[400px] h-[400px] rounded-full bg-pink-500/15 blur-[80px]" />
              </div>

              <canvas
                ref={canvasRef}
                className="absolute inset-0 w-full h-full"
              />

              <div
                className="absolute inset-0 opacity-[0.03] mix-blend-overlay"
                style={{
                  backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 2px, white 2px, white 3px)`,
                }}
              />

              <div className="absolute inset-0 shadow-[inset_0_0_150px_rgba(0,0,0,0.8),inset_0_-80px_80px_rgba(0,0,0,0.5)]" />
            </div>
          )}

          {/* FOND - Version Light Mode */}
          {!isDark && (
            <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-zinc-100">
              <div className="absolute inset-0 opacity-30">
                <div className="absolute top-0 left-0 w-[600px] h-[600px] rounded-full bg-violet-200/40 blur-[100px]" />
                <div className="absolute top-1/2 right-0 w-[500px] h-[500px] rounded-full bg-indigo-200/30 blur-[100px]" />
                <div className="absolute bottom-0 left-1/4 w-[700px] h-[700px] rounded-full bg-cyan-200/25 blur-[120px]" />
              </div>
              <div className="absolute inset-0 shadow-[inset_0_0_150px_rgba(0,0,0,0.02)]" />
            </div>
          )}

          {/* CONTENU */}
          <div
            className={`relative z-10 p-6 sm:p-10 transition-colors duration-300
            ${isDark ? "text-white" : "text-zinc-900"}`}
          >
            <div
              className={`font-mono text-[9px] tracking-[0.25em] uppercase font-medium mb-4 sm:mb-5 transition-colors duration-300
              ${isDark ? "text-violet-300/70" : "text-violet-600/70"}`}
            >
              {t("badge")}
            </div>

            <h2 className="text-[40px] sm:text-[52px] leading-[0.85] font-light tracking-[-0.04em] mb-4 sm:mb-5">
              {t("titleLine1")}
              <br />
              <span
                className={`text-[40px] mb-8 font-medium bg-clip-text text-transparent transition-all duration-300 
                ${
                  isDark
                    ? "bg-gradient-to-r from-white via-violet-200 to-cyan-200"
                    : "bg-gradient-to-r from-zinc-800 via-violet-700 to-cyan-700"
                }`}
              >
                {t("titleLine2")}
              </span>
            </h2>

            <p
              className={`text-[13px] sm:text-[14px] leading-[1.6] font-light max-w-[42ch] tracking-[-0.01em] transition-colors duration-300
              ${isDark ? "text-zinc-300" : "text-zinc-600"}`}
            >
              {t("description")}
              <span
                className={`block mt-5 mb-5 text-[11px] sm:text-[12px] transition-colors duration-300
                ${isDark ? "text-violet-300" : "text-violet-600"}`}
              >
                {t("descriptionNote")}
              </span>
            </p>

            {/* Bouton CTA - Redirige vers /switch-role */}
            <button
              onClick={handleDiscover}
              className={`group relative w-full overflow-hidden rounded-xl font-medium text-[13px] py-3.5 flex items-center justify-center gap-3 active:scale-[0.98] transition-all duration-300
                ${
                  isDark
                    ? "bg-gradient-to-r from-white via-zinc-50 to-white text-zinc-950 hover:shadow-[0_8px_32px_rgba(255,255,255,0.2)]"
                    : "bg-gradient-to-r from-zinc-800 via-zinc-700 to-zinc-800 text-white hover:shadow-[0_8px_32px_rgba(0,0,0,0.2)]"
                }`}
              type="button"
            >
              <span>{t("ctaButton")}</span>
              <ChevronRightIcon
                className={`w-4 h-4 transition-transform group-hover:translate-x-0.5 ${isDark ? "text-zinc-950" : "text-white"}`}
              />
            </button>

            {/* Stats */}
            <div className="mt-5 text-center">
              <div className="flex items-center justify-center gap-2">
                <span
                  className={`w-1 h-1 rounded-full ${isDark ? "bg-violet-400/50" : "bg-violet-500/50"}`}
                />
                <span
                  className={`font-mono text-[8px] sm:text-[9px] font-light transition-colors duration-300
                  ${isDark ? "text-zinc-400/80" : "text-zinc-500"}`}
                >
                  {t("footerText")}
                </span>
                <span
                  className={`w-1 h-1 rounded-full ${isDark ? "bg-violet-400/50" : "bg-violet-500/50"}`}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default NexusCard;
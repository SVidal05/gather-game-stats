import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from "framer-motion";
import { X, ChevronRight, ChevronLeft, Sparkles, Users, Gamepad2, Trophy, Medal, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";

interface TutorialStep {
  targetSelector: string;
  titleKey: string;
  descriptionKey: string;
  icon: React.ElementType;
  position: "bottom" | "top" | "left" | "right";
  action?: () => void;
}

interface OnboardingTutorialProps {
  userId: string;
  onComplete: () => void;
  onNavigate?: (tab: string) => void;
}

export function OnboardingTutorial({ userId, onComplete, onNavigate }: OnboardingTutorialProps) {
  const { t } = useI18n();
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [isVisible, setIsVisible] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const observerRef = useRef<MutationObserver | null>(null);

  // Spring-animated spotlight position & size for smooth transitions
  const spotlightX = useMotionValue(0);
  const spotlightY = useMotionValue(0);
  const spotlightW = useMotionValue(0);
  const spotlightH = useMotionValue(0);

  const springConfig = { stiffness: 200, damping: 30, mass: 0.8 };
  const animX = useSpring(spotlightX, springConfig);
  const animY = useSpring(spotlightY, springConfig);
  const animW = useSpring(spotlightW, springConfig);
  const animH = useSpring(spotlightH, springConfig);

  const steps: TutorialStep[] = [
    {
      targetSelector: "[data-tour='create-group']",
      titleKey: "onboarding.step1Title",
      descriptionKey: "onboarding.step1Desc",
      icon: Users,
      position: "bottom",
    },
    {
      targetSelector: "[data-tour='add-player']",
      titleKey: "onboarding.step2Title",
      descriptionKey: "onboarding.step2Desc",
      icon: Users,
      position: "bottom",
    },
    {
      targetSelector: "[data-tour='play-tab']",
      titleKey: "onboarding.step3Title",
      descriptionKey: "onboarding.step3Desc",
      icon: Gamepad2,
      position: "bottom",
    },
    {
      targetSelector: "[data-tour='overview']",
      titleKey: "onboarding.step4Title",
      descriptionKey: "onboarding.step4Desc",
      icon: LayoutDashboard,
      position: "top",
    },
    {
      targetSelector: "[data-tour='leaderboard']",
      titleKey: "onboarding.step5Title",
      descriptionKey: "onboarding.step5Desc",
      icon: Trophy,
      position: "bottom",
    },
    {
      targetSelector: "[data-tour='achievements']",
      titleKey: "onboarding.step6Title",
      descriptionKey: "onboarding.step6Desc",
      icon: Medal,
      position: "bottom",
    },
  ];

  const step = steps[currentStep];
  const padding = 8;

  const updateTargetRect = useCallback(() => {
    if (!step) return;
    const el = document.querySelector(step.targetSelector);
    if (el) {
      const rect = el.getBoundingClientRect();
      setTargetRect(rect);

      // Animate spotlight to new position
      spotlightX.set(rect.left - padding);
      spotlightY.set(rect.top - padding);
      spotlightW.set(rect.width + padding * 2);
      spotlightH.set(rect.height + padding * 2);

      el.scrollIntoView({ behavior: "smooth", block: "center" });
    } else {
      setTargetRect(null);
    }
  }, [step, spotlightX, spotlightY, spotlightW, spotlightH]);

  useEffect(() => {
    const timer = setTimeout(updateTargetRect, 350);

    observerRef.current = new MutationObserver(() => {
      setTimeout(updateTargetRect, 100);
    });
    observerRef.current.observe(document.body, { childList: true, subtree: true });

    window.addEventListener("resize", updateTargetRect);
    window.addEventListener("scroll", updateTargetRect, true);

    return () => {
      clearTimeout(timer);
      observerRef.current?.disconnect();
      window.removeEventListener("resize", updateTargetRect);
      window.removeEventListener("scroll", updateTargetRect, true);
    };
  }, [updateTargetRect]);

  const handleComplete = async () => {
    setIsVisible(false);
    await supabase
      .from("profiles")
      .update({ onboarding_completed: true } as any)
      .eq("user_id", userId);
    onComplete();
  };

  const handleSkip = () => {
    handleComplete();
  };

  const navigateToStep = (nextStep: number) => {
    setIsTransitioning(true);

    // Brief fade-out of tooltip, then switch step
    setTimeout(() => {
      setCurrentStep(nextStep);
      if (onNavigate) {
        const tabMap = ["groups", "players", "play", "overview", "ranking", "profile"];
        if (tabMap[nextStep]) onNavigate(tabMap[nextStep]);
      }
      // Allow the new content to mount before fading in
      setTimeout(() => setIsTransitioning(false), 100);
    }, 200);
  };

  const handleNext = () => {
    if (currentStep >= steps.length - 1) {
      handleComplete();
      return;
    }
    navigateToStep(currentStep + 1);
  };

  const handlePrev = () => {
    if (currentStep <= 0) return;
    navigateToStep(currentStep - 1);
  };

  if (!isVisible) return null;

  const StepIcon = step.icon;

  // Calculate tooltip position, ensuring it stays within viewport
  const getTooltipStyle = (): React.CSSProperties => {
    if (!targetRect) {
      return {
        position: "fixed",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
      };
    }

    const gap = 16;
    const tooltipHeight = 180;
    const leftPos = Math.max(16, Math.min(targetRect.left + targetRect.width / 2 - 160, window.innerWidth - 336));

    const spaceBelow = window.innerHeight - targetRect.bottom - gap;
    const spaceAbove = targetRect.top - gap;

    const placeBelow = step.position === "bottom" && spaceBelow >= tooltipHeight;
    const placeAbove = step.position === "top" || !placeBelow;

    if (placeBelow) {
      return { position: "fixed", top: targetRect.bottom + gap, left: leftPos };
    }

    if (placeAbove && spaceAbove >= tooltipHeight) {
      return { position: "fixed", bottom: window.innerHeight - targetRect.top + gap, left: leftPos };
    }

    const visibleTop = Math.max(0, targetRect.top);
    const visibleBottom = Math.min(window.innerHeight, targetRect.bottom);
    const centerY = (visibleTop + visibleBottom) / 2;
    return {
      position: "fixed",
      top: Math.max(16, Math.min(centerY - tooltipHeight / 2, window.innerHeight - tooltipHeight - 16)),
      left: leftPos,
    };
  };

  return (
    <AnimatePresence mode="wait">
      {isVisible && (
        <motion.div
          className="fixed inset-0 z-[9999]"
          role="dialog"
          aria-modal="true"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
        >
          {/* Overlay with animated spotlight cutout */}
          <svg className="fixed inset-0 w-full h-full" style={{ zIndex: 1 }}>
            <defs>
              <mask id="spotlight-mask">
                <rect x="0" y="0" width="100%" height="100%" fill="white" />
                {targetRect && (
                  <motion.rect
                    x={animX}
                    y={animY}
                    width={animW}
                    height={animH}
                    rx="12"
                    fill="black"
                  />
                )}
              </mask>
            </defs>
            <rect
              x="0" y="0" width="100%" height="100%"
              fill="rgba(0,0,0,0.7)"
              mask="url(#spotlight-mask)"
            />
          </svg>

          {/* Animated spotlight ring */}
          {targetRect && (
            <motion.div
              className="fixed rounded-xl ring-2 ring-primary ring-offset-2 ring-offset-transparent pointer-events-none"
              style={{
                zIndex: 2,
                left: animX,
                top: animY,
                width: animW,
                height: animH,
              }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            />
          )}

          {/* Tooltip card with smooth crossfade */}
          <AnimatePresence mode="wait">
            {!isTransitioning && (
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, y: 16, scale: 0.92 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -12, scale: 0.95 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                className="w-[320px] bg-card border border-border rounded-2xl shadow-2xl overflow-hidden"
                style={{ ...getTooltipStyle(), zIndex: 3 }}
              >
                {/* Step header */}
                <div className="bg-primary/10 px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <motion.div
                      key={`icon-${currentStep}`}
                      initial={{ rotate: -90, scale: 0 }}
                      animate={{ rotate: 0, scale: 1 }}
                      transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.1 }}
                      className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center"
                    >
                      <StepIcon className="w-4 h-4 text-primary" />
                    </motion.div>
                    <div>
                      <motion.p
                        key={`label-${currentStep}`}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: 0.15 }}
                        className="text-[10px] font-bold text-primary/70 uppercase tracking-wider"
                      >
                        {t("onboarding.stepOf").replace("{current}", String(currentStep + 1)).replace("{total}", String(steps.length))}
                      </motion.p>
                      <motion.h3
                        key={`title-${currentStep}`}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: 0.2 }}
                        className="text-sm font-bold text-foreground leading-tight"
                      >
                        {t(step.titleKey as any)}
                      </motion.h3>
                    </div>
                  </div>
                  <button
                    onClick={handleSkip}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-all duration-200"
                    aria-label={t("onboarding.skip")}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Step body */}
                <motion.div
                  key={`desc-${currentStep}`}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.25 }}
                  className="px-4 py-3"
                >
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {t(step.descriptionKey as any)}
                  </p>
                </motion.div>

                {/* Progress + actions */}
                <div className="px-4 pb-3 flex items-center justify-between">
                  {/* Step dots */}
                  <div className="flex items-center gap-1.5">
                    {steps.map((_, i) => (
                      <motion.div
                        key={i}
                        layout
                        className={`h-1.5 rounded-full ${
                          i === currentStep
                            ? "bg-primary"
                            : i < currentStep
                            ? "bg-primary/40"
                            : "bg-muted-foreground/20"
                        }`}
                        animate={{ width: i === currentStep ? 24 : 6 }}
                        transition={{ type: "spring", stiffness: 300, damping: 25 }}
                      />
                    ))}
                  </div>

                  {/* Navigation buttons */}
                  <div className="flex items-center gap-1.5">
                    {currentStep > 0 && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={handlePrev}
                        className="h-8 px-2.5 rounded-xl text-xs"
                      >
                        <ChevronLeft className="w-3.5 h-3.5 mr-0.5" />
                        {t("onboarding.prev")}
                      </Button>
                    )}
                    {currentStep === 0 && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={handleSkip}
                        className="h-8 px-2.5 rounded-xl text-xs text-muted-foreground"
                      >
                        {t("onboarding.skip")}
                      </Button>
                    )}
                    <Button
                      size="sm"
                      onClick={handleNext}
                      className="h-8 px-3 rounded-xl text-xs font-bold gap-1"
                    >
                      {currentStep >= steps.length - 1 ? (
                        <>
                          <Sparkles className="w-3.5 h-3.5" />
                          {t("onboarding.finish")}
                        </>
                      ) : (
                        <>
                          {t("onboarding.next")}
                          <ChevronRight className="w-3.5 h-3.5" />
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

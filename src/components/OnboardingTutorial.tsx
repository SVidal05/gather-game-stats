import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronRight, ChevronLeft, Sparkles, Users, Gamepad2, Trophy, Medal } from "lucide-react";
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
  const observerRef = useRef<MutationObserver | null>(null);

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
      targetSelector: "[data-tour='leaderboard']",
      titleKey: "onboarding.step4Title",
      descriptionKey: "onboarding.step4Desc",
      icon: Trophy,
      position: "bottom",
    },
    {
      targetSelector: "[data-tour='achievements']",
      titleKey: "onboarding.step5Title",
      descriptionKey: "onboarding.step5Desc",
      icon: Medal,
      position: "bottom",
    },
  ];

  const step = steps[currentStep];

  const updateTargetRect = useCallback(() => {
    if (!step) return;
    const el = document.querySelector(step.targetSelector);
    if (el) {
      const rect = el.getBoundingClientRect();
      setTargetRect(rect);
      // Scroll into view if needed
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    } else {
      setTargetRect(null);
    }
  }, [step]);

  useEffect(() => {
    // Give the DOM time to render after tab navigation
    const timer = setTimeout(updateTargetRect, 350);

    // Also observe DOM mutations to catch dynamic content
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
    // Mark onboarding completed in DB
    await supabase
      .from("profiles")
      .update({ onboarding_completed: true } as any)
      .eq("user_id", userId);
    onComplete();
  };

  const handleSkip = () => {
    handleComplete();
  };

  const handleNext = () => {
    if (currentStep >= steps.length - 1) {
      handleComplete();
      return;
    }

    const nextStep = currentStep + 1;
    setCurrentStep(nextStep);

    // Navigate to the appropriate tab for each step
    if (onNavigate) {
      switch (nextStep) {
        case 0: onNavigate("groups"); break;
        case 1: onNavigate("players"); break;
        case 2: onNavigate("play"); break;
        case 3: onNavigate("ranking"); break;
        case 4: onNavigate("profile"); break;
      }
    }
  };

  const handlePrev = () => {
    if (currentStep <= 0) return;
    const prevStep = currentStep - 1;
    setCurrentStep(prevStep);

    if (onNavigate) {
      switch (prevStep) {
        case 0: onNavigate("groups"); break;
        case 1: onNavigate("players"); break;
        case 2: onNavigate("play"); break;
        case 3: onNavigate("ranking"); break;
        case 4: onNavigate("profile"); break;
      }
    }
  };

  if (!isVisible) return null;

  const StepIcon = step.icon;
  const padding = 8;

  // Calculate tooltip position
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

    switch (step.position) {
      case "bottom":
        return {
          position: "fixed",
          top: targetRect.bottom + gap,
          left: Math.max(16, Math.min(targetRect.left + targetRect.width / 2 - 160, window.innerWidth - 336)),
        };
      case "top":
        return {
          position: "fixed",
          bottom: window.innerHeight - targetRect.top + gap,
          left: Math.max(16, Math.min(targetRect.left + targetRect.width / 2 - 160, window.innerWidth - 336)),
        };
      default:
        return {
          position: "fixed",
          top: targetRect.bottom + gap,
          left: Math.max(16, Math.min(targetRect.left + targetRect.width / 2 - 160, window.innerWidth - 336)),
        };
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <div className="fixed inset-0 z-[9999]" role="dialog" aria-modal="true">
          {/* Overlay with spotlight cutout using SVG mask */}
          <svg className="fixed inset-0 w-full h-full" style={{ zIndex: 1 }}>
            <defs>
              <mask id="spotlight-mask">
                <rect x="0" y="0" width="100%" height="100%" fill="white" />
                {targetRect && (
                  <rect
                    x={targetRect.left - padding}
                    y={targetRect.top - padding}
                    width={targetRect.width + padding * 2}
                    height={targetRect.height + padding * 2}
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

          {/* Spotlight ring around target */}
          {targetRect && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed rounded-xl ring-2 ring-primary ring-offset-2 ring-offset-transparent pointer-events-none"
              style={{
                zIndex: 2,
                left: targetRect.left - padding,
                top: targetRect.top - padding,
                width: targetRect.width + padding * 2,
                height: targetRect.height + padding * 2,
              }}
            />
          )}

          {/* Tooltip card */}
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, y: 12, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            className="w-[320px] bg-card border border-border rounded-2xl shadow-2xl overflow-hidden"
            style={{ ...getTooltipStyle(), zIndex: 3 }}
          >
            {/* Step header */}
            <div className="bg-primary/10 px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                  <StepIcon className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-primary/70 uppercase tracking-wider">
                    {t("onboarding.stepOf").replace("{current}", String(currentStep + 1)).replace("{total}", String(steps.length))}
                  </p>
                  <h3 className="text-sm font-bold text-foreground leading-tight">
                    {t(step.titleKey as any)}
                  </h3>
                </div>
              </div>
              <button
                onClick={handleSkip}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-all"
                aria-label={t("onboarding.skip")}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Step body */}
            <div className="px-4 py-3">
              <p className="text-xs text-muted-foreground leading-relaxed">
                {t(step.descriptionKey as any)}
              </p>
            </div>

            {/* Progress + actions */}
            <div className="px-4 pb-3 flex items-center justify-between">
              {/* Step dots */}
              <div className="flex items-center gap-1.5">
                {steps.map((_, i) => (
                  <div
                    key={i}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      i === currentStep
                        ? "w-6 bg-primary"
                        : i < currentStep
                        ? "w-1.5 bg-primary/40"
                        : "w-1.5 bg-muted-foreground/20"
                    }`}
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
        </div>
      )}
    </AnimatePresence>
  );
}

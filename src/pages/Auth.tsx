import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, Lock, ArrowRight, KeyRound } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

type Mode = "login" | "signup" | "reset";

export default function Auth() {
  const { t } = useI18n();
  const { signIn, signUp, resetPassword } = useAuth();
  const { toast } = useToast();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (mode === "reset") {
      const { error } = await resetPassword(email);
      setLoading(false);
      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      } else {
        toast({ title: t("auth.resetSent"), description: t("auth.resetSentMsg") });
        setMode("login");
      }
      return;
    }

    const action = mode === "login" ? signIn : signUp;
    const { error } = await action(email, password);
    setLoading(false);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else if (mode === "signup") {
      toast({ title: t("auth.signupSuccess"), description: t("auth.signupSuccessMsg") });
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🎲</div>
          <h1 className="text-2xl font-extrabold text-foreground">GameNight</h1>
          <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold">Tracker</span>
          <p className="text-muted-foreground text-xs mt-3">
            {mode === "login" ? t("auth.loginSubtitle") : mode === "signup" ? t("auth.signupSubtitle") : t("auth.resetSubtitle")}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="game-card space-y-3">
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder={t("auth.email")}
                className="pl-10 rounded-xl h-12"
                required
              />
            </div>

            {mode !== "reset" && (
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder={t("auth.password")}
                  className="pl-10 rounded-xl h-12"
                  required
                  minLength={6}
                />
              </div>
            )}
          </div>

          <Button type="submit" className="w-full rounded-2xl h-12 font-bold gap-2" disabled={loading}>
            {loading ? (
              <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
            ) : mode === "reset" ? (
              <><KeyRound className="w-4 h-4" /> {t("auth.sendReset")}</>
            ) : (
              <><ArrowRight className="w-4 h-4" /> {mode === "login" ? t("auth.signIn") : t("auth.signUp")}</>
            )}
          </Button>
        </form>

        <div className="mt-5 text-center space-y-2">
          {mode === "login" && (
            <>
              <button onClick={() => setMode("reset")} className="text-xs text-muted-foreground hover:text-primary transition-colors">
                {t("auth.forgotPassword")}
              </button>
              <p className="text-xs text-muted-foreground">
                {t("auth.noAccount")}{" "}
                <button onClick={() => setMode("signup")} className="text-primary font-bold hover:underline">
                  {t("auth.signUp")}
                </button>
              </p>
            </>
          )}
          {mode === "signup" && (
            <p className="text-xs text-muted-foreground">
              {t("auth.hasAccount")}{" "}
              <button onClick={() => setMode("login")} className="text-primary font-bold hover:underline">
                {t("auth.signIn")}
              </button>
            </p>
          )}
          {mode === "reset" && (
            <button onClick={() => setMode("login")} className="text-xs text-primary font-bold hover:underline">
              {t("auth.backToLogin")}
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}

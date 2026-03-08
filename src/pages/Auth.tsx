import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Mail, Lock, ArrowRight, KeyRound, User } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { lovable } from "@/integrations/lovable/index";
import logo from "@/assets/logo.png";

type Mode = "login" | "signup" | "reset";

export default function Auth() {
  const { t } = useI18n();
  const { signIn, signUp, resetPassword, user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && user) navigate("/");
  }, [authLoading, user, navigate]);

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

    if (mode === "signup") {
      const { error } = await signUp(email, password, username);
      setLoading(false);
      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      }
      return;
    }

    const { error } = await signIn(email, password);
    setLoading(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      toast({ title: "Error", description: String(result.error), variant: "destructive" });
    }
    setLoading(false);
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
          <img src={logo} alt="GameNight" className="w-16 h-16 mx-auto mb-4" />
          <h1 className="text-3xl font-display font-bold text-foreground">GameNight</h1>
          <span className="text-xs bg-primary/10 text-primary px-2.5 py-1 rounded-md font-semibold">Tracker</span>
          <p className="text-muted-foreground text-sm mt-4">
            {mode === "login" ? t("auth.loginSubtitle") : mode === "signup" ? t("auth.signupSubtitle") : t("auth.resetSubtitle")}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="game-card space-y-3">
            {mode === "signup" && (
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder={t("auth.username")}
                  className="pl-10 rounded-lg h-12"
                  required
                  minLength={2}
                />
              </div>
            )}

            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder={t("auth.email")}
                className="pl-10 rounded-lg h-12"
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
                  className="pl-10 rounded-lg h-12"
                  required
                  minLength={6}
                />
              </div>
            )}
          </div>

          <Button type="submit" className="w-full rounded-lg h-12 font-semibold gap-2 shadow-md hover:shadow-lg transition-shadow" disabled={loading}>
            {loading ? (
              <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
            ) : mode === "reset" ? (
              <><KeyRound className="w-4 h-4" /> {t("auth.sendReset")}</>
            ) : (
              <><ArrowRight className="w-4 h-4" /> {mode === "login" ? t("auth.signIn") : t("auth.signUp")}</>
            )}
          </Button>
        </form>

        {/* Google Sign In */}
        {mode !== "reset" && (
          <div className="mt-4">
            <div className="relative flex items-center justify-center my-4">
              <div className="border-t border-border flex-1" />
              <span className="px-3 text-xs text-muted-foreground font-medium">{t("auth.orWith")}</span>
              <div className="border-t border-border flex-1" />
            </div>
            <Button
              type="button"
              variant="outline"
              className="w-full rounded-lg h-12 font-semibold gap-2"
              onClick={handleGoogleLogin}
              disabled={loading}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Google
            </Button>
          </div>
        )}

        <div className="mt-6 text-center space-y-2">
          {mode === "login" && (
            <>
              <button onClick={() => setMode("reset")} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                {t("auth.forgotPassword")}
              </button>
              <p className="text-sm text-muted-foreground">
                {t("auth.noAccount")}{" "}
                <button onClick={() => setMode("signup")} className="text-primary font-semibold hover:underline">
                  {t("auth.signUp")}
                </button>
              </p>
            </>
          )}
          {mode === "signup" && (
            <p className="text-sm text-muted-foreground">
              {t("auth.hasAccount")}{" "}
              <button onClick={() => setMode("login")} className="text-primary font-semibold hover:underline">
                {t("auth.signIn")}
              </button>
            </p>
          )}
          {mode === "reset" && (
            <button onClick={() => setMode("login")} className="text-sm text-primary font-semibold hover:underline">
              {t("auth.backToLogin")}
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}

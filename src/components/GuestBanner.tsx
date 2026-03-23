import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UserPlus, Mail, Lock, User, X, ArrowRight } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export function GuestBanner() {
  const { isGuest, linkGuestAccount } = useAuth();
  const { t } = useI18n();
  const { toast } = useToast();
  const [showDialog, setShowDialog] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isGuest) return null;

  const handleLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await linkGuestAccount(email, password, username);
    setLoading(false);
    if (error) {
      const msg = error?.message?.toLowerCase() || "";
      if (msg.includes("already") || msg.includes("registered")) {
        toast({ title: "Error", description: "Este correo ya está registrado. Usa otro.", variant: "destructive" });
      } else {
        toast({ title: "Error", description: error.message || "Ha ocurrido un error", variant: "destructive" });
      }
    } else {
      setShowDialog(false);
      toast({ title: t("auth.accountLinked"), description: t("auth.accountLinkedMsg") });
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-4 mb-3 p-3 rounded-xl bg-warning/10 border border-warning/20 flex items-center gap-3"
      >
        <UserPlus className="w-4 h-4 text-warning shrink-0" />
        <p className="text-xs text-foreground flex-1">{t("auth.guestBanner")}</p>
        <Button
          size="sm"
          className="rounded-lg text-xs h-8 px-3 font-semibold shrink-0"
          onClick={() => setShowDialog(true)}
        >
          {t("auth.createAccount")}
        </Button>
      </motion.div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-sm rounded-xl">
          <DialogHeader>
            <DialogTitle>{t("auth.linkAccountTitle")}</DialogTitle>
            <DialogDescription className="text-sm">
              {t("auth.linkAccountMsg")}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleLink} className="space-y-3 mt-2">
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder={t("auth.username")}
                className="pl-10 rounded-lg h-11"
                required
                minLength={2}
              />
            </div>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder={t("auth.email")}
                className="pl-10 rounded-lg h-11"
                required
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder={t("auth.password")}
                className="pl-10 rounded-lg h-11"
                required
                minLength={6}
              />
            </div>
            <Button
              type="submit"
              className="w-full rounded-lg h-11 font-semibold gap-2"
              disabled={loading}
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              ) : (
                <><ArrowRight className="w-4 h-4" /> {t("auth.createAccount")}</>
              )}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

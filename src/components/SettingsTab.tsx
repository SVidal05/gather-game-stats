import { useState } from "react";
import { motion } from "framer-motion";
import { Sun, Moon, Globe, LogOut, User, Check, Monitor, HelpCircle, Send } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useI18n, LANGUAGE_OPTIONS, Language } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { GuestBanner } from "@/components/GuestBanner";
import { supabase } from "@/integrations/supabase/client";

interface SettingsTabProps {
  isDark: boolean;
  onToggleDark: () => void;
  themeMode?: "system" | "light" | "dark";
  onSetThemeMode?: (mode: "system" | "light" | "dark") => void;
}

export function SettingsTab({ isDark, onToggleDark, themeMode = "system", onSetThemeMode }: SettingsTabProps) {
  const { lang, setLang, t } = useI18n();
  const { user, username, updateUsername, signOut, isGuest } = useAuth();
  const { toast } = useToast();
  const [editingUsername, setEditingUsername] = useState(false);
  const [newUsername, setNewUsername] = useState(username);
  const [saving, setSaving] = useState(false);

  // Support form state
  const [supportName, setSupportName] = useState(username || "");
  const [supportEmail, setSupportEmail] = useState(user?.email || "");
  const [supportMessage, setSupportMessage] = useState("");
  const [sendingSupport, setSendingSupport] = useState(false);
  const [supportSent, setSupportSent] = useState(false);

  const handleSaveUsername = async () => {
    setSaving(true);
    const { error } = await updateUsername(newUsername);
    setSaving(false);
    if (error) {
      toast({ title: "Error", description: String(error.message || error), variant: "destructive" });
    } else {
      setEditingUsername(false);
      toast({ title: "✓", description: t("settings.usernameSaved") });
    }
  };

  const handleSendSupport = async () => {
    if (!supportMessage.trim()) return;
    setSendingSupport(true);
    try {
      const id = crypto.randomUUID();
      const { error } = await supabase.functions.invoke("send-transactional-email", {
        body: {
          templateName: "support-message",
          recipientEmail: "noreply@gamenightstats.org",
          idempotencyKey: `support-${id}`,
          templateData: {
            name: supportName || "Anónimo",
            email: supportEmail || "No proporcionado",
            message: supportMessage,
          },
        },
      });
      if (error) throw error;
      setSupportSent(true);
      setSupportMessage("");
      toast({ title: "✓", description: t("settings.sent") });
    } catch {
      toast({ title: "Error", description: t("settings.sendError"), variant: "destructive" });
    }
    setSendingSupport(false);
  };

  const themeModes: { value: "system" | "light" | "dark"; icon: typeof Sun; label: string }[] = [
    { value: "system", icon: Monitor, label: "System" },
    { value: "light", icon: Sun, label: t("profile.light") },
    { value: "dark", icon: Moon, label: t("profile.dark") },
  ];

  return (
    <div className="space-y-6" data-tour="settings">
      <div>
        <h2 className="text-2xl font-display font-bold text-foreground">{t("settings.title")}</h2>
        <p className="text-muted-foreground text-sm mt-1">{t("settings.subtitle")}</p>
      </div>

      {/* Account */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="game-card space-y-4">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <User className="w-4 h-4 text-primary" />
          {t("settings.account")}
        </h3>

        {isGuest ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">{t("auth.guestBanner")}</p>
          </div>
        ) : (
          <>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">{t("auth.email")}</label>
              <p className="text-sm font-semibold text-foreground truncate">{user?.email}</p>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">{t("auth.username")}</label>
              {editingUsername ? (
                <div className="flex gap-2">
                  <Input
                    value={newUsername}
                    onChange={e => setNewUsername(e.target.value)}
                    className="rounded-lg h-10 text-sm"
                    placeholder={t("auth.username")}
                  />
                  <Button size="sm" onClick={handleSaveUsername} disabled={saving} className="rounded-lg px-3">
                    {saving ? <div className="w-3 h-3 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" /> : <Check className="w-4 h-4" />}
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-foreground">{username || "—"}</p>
                  <button
                    data-tour="edit-username"
                    onClick={() => { setNewUsername(username); setEditingUsername(true); }}
                    className="text-xs text-primary font-semibold hover:underline"
                  >
                    {t("settings.edit")}
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </motion.div>

      {/* Language */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="game-card space-y-3">
        <label className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Globe className="w-4 h-4 text-primary" />
          {t("profile.language")}
        </label>
        <div className="flex gap-2">
          {LANGUAGE_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => setLang(opt.value)}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-3 rounded-lg text-sm font-semibold transition-all ${
                lang === opt.value
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              <span className="text-lg">{opt.flag}</span>
              {opt.label}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Theme */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="game-card space-y-3">
        <label className="text-sm font-semibold text-foreground flex items-center gap-2">
          {isDark ? <Moon className="w-4 h-4 text-primary" /> : <Sun className="w-4 h-4 text-primary" />}
          {t("profile.theme")}
        </label>
        <div className="flex gap-2">
          {themeModes.map(mode => (
            <button
              key={mode.value}
              onClick={() => onSetThemeMode ? onSetThemeMode(mode.value) : onToggleDark()}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-3 rounded-lg text-sm font-semibold transition-all ${
                themeMode === mode.value
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              <mode.icon className="w-4 h-4" />
              {mode.label}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Help & Support */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="game-card space-y-4">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-primary" />
          {t("settings.help")}
        </h3>
        <p className="text-xs text-muted-foreground">{t("settings.helpSubtitle")}</p>

        {supportSent ? (
          <div className="text-center py-4">
            <p className="text-sm font-semibold text-accent">✓ {t("settings.sent")}</p>
            <button onClick={() => setSupportSent(false)} className="text-xs text-primary font-semibold mt-2 hover:underline">
              {t("settings.send")}
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <Input
                value={supportName}
                onChange={e => setSupportName(e.target.value)}
                placeholder={t("settings.yourName")}
                className="rounded-lg h-10 text-sm"
              />
              <Input
                value={supportEmail}
                onChange={e => setSupportEmail(e.target.value)}
                placeholder={t("settings.yourEmail")}
                className="rounded-lg h-10 text-sm"
                type="email"
              />
            </div>
            <Textarea
              value={supportMessage}
              onChange={e => setSupportMessage(e.target.value)}
              placeholder={t("settings.message")}
              className="rounded-lg text-sm min-h-[100px] resize-none"
              maxLength={1000}
            />
            <Button
              onClick={handleSendSupport}
              disabled={sendingSupport || !supportMessage.trim()}
              className="w-full rounded-lg h-10 font-semibold gap-2"
            >
              {sendingSupport ? (
                <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              {sendingSupport ? t("settings.sending") : t("settings.send")}
            </Button>
          </div>
        )}
      </motion.div>

      {/* Logout */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <Button
          variant="destructive"
          className="w-full rounded-lg h-12 font-semibold gap-2"
          onClick={signOut}
        >
          <LogOut className="w-4 h-4" />
          {t("auth.logout")}
        </Button>
      </motion.div>
    </div>
  );
}
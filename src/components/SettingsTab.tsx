import { useState } from "react";
import { motion } from "framer-motion";
import { Sun, Moon, Globe, LogOut, User, Check, Monitor } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useI18n, LANGUAGE_OPTIONS, Language } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

interface SettingsTabProps {
  isDark: boolean;
  onToggleDark: () => void;
  themeMode?: "system" | "light" | "dark";
  onSetThemeMode?: (mode: "system" | "light" | "dark") => void;
}

export function SettingsTab({ isDark, onToggleDark, themeMode = "system", onSetThemeMode }: SettingsTabProps) {
  const { lang, setLang, t } = useI18n();
  const { user, username, updateUsername, signOut } = useAuth();
  const { toast } = useToast();
  const [editingUsername, setEditingUsername] = useState(false);
  const [newUsername, setNewUsername] = useState(username);
  const [saving, setSaving] = useState(false);

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

  const themeModes: { value: "system" | "light" | "dark"; icon: typeof Sun; label: string }[] = [
    { value: "system", icon: Monitor, label: "System" },
    { value: "light", icon: Sun, label: t("profile.light") },
    { value: "dark", icon: Moon, label: t("profile.dark") },
  ];

  return (
    <div className="space-y-6">
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
                onClick={() => { setNewUsername(username); setEditingUsername(true); }}
                className="text-xs text-primary font-semibold hover:underline"
              >
                {t("settings.edit")}
              </button>
            </div>
          )}
        </div>
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

      {/* Logout */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
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

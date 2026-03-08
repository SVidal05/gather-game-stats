import { useState } from "react";
import { motion } from "framer-motion";
import { Sun, Moon, Globe, LogOut, User, Save, Check } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useI18n, LANGUAGE_OPTIONS, Language } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

interface SettingsTabProps {
  isDark: boolean;
  onToggleDark: () => void;
}

export function SettingsTab({ isDark, onToggleDark }: SettingsTabProps) {
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

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-extrabold text-foreground">{t("settings.title")}</h2>
        <p className="text-muted-foreground text-xs mt-0.5">{t("settings.subtitle")}</p>
      </div>

      {/* Account */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="game-card space-y-4">
        <h3 className="text-xs font-bold text-foreground flex items-center gap-1.5">
          <User className="w-3.5 h-3.5 text-primary" />
          {t("settings.account")}
        </h3>

        <div className="space-y-2">
          <label className="text-[10px] font-semibold text-muted-foreground">{t("auth.email")}</label>
          <p className="text-sm font-bold text-foreground truncate">{user?.email}</p>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-semibold text-muted-foreground">{t("auth.username")}</label>
          {editingUsername ? (
            <div className="flex gap-2">
              <Input
                value={newUsername}
                onChange={e => setNewUsername(e.target.value)}
                className="rounded-xl h-10 text-sm"
                placeholder={t("auth.username")}
              />
              <Button size="sm" onClick={handleSaveUsername} disabled={saving} className="rounded-xl px-3">
                {saving ? <div className="w-3 h-3 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" /> : <Check className="w-4 h-4" />}
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <p className="text-sm font-bold text-foreground">{username || "—"}</p>
              <button
                onClick={() => { setNewUsername(username); setEditingUsername(true); }}
                className="text-[10px] text-primary font-bold hover:underline"
              >
                {t("settings.edit")}
              </button>
            </div>
          )}
        </div>
      </motion.div>

      {/* Language */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="game-card space-y-3">
        <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
          <Globe className="w-3.5 h-3.5 text-primary" />
          {t("profile.language")}
        </label>
        <div className="flex gap-1.5">
          {LANGUAGE_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => setLang(opt.value)}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-all active:scale-95 ${
                lang === opt.value
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "bg-secondary text-muted-foreground"
              }`}
            >
              <span className="text-base">{opt.flag}</span>
              {opt.label}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Theme */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="game-card space-y-3">
        <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
          {isDark ? <Moon className="w-3.5 h-3.5 text-primary" /> : <Sun className="w-3.5 h-3.5 text-primary" />}
          {t("profile.theme")}
        </label>
        <div className="flex gap-1.5">
          <button
            onClick={() => isDark && onToggleDark()}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-all active:scale-95 ${
              !isDark ? "bg-primary text-primary-foreground shadow-md" : "bg-secondary text-muted-foreground"
            }`}
          >
            <Sun className="w-4 h-4" />
            {t("profile.light")}
          </button>
          <button
            onClick={() => !isDark && onToggleDark()}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-all active:scale-95 ${
              isDark ? "bg-primary text-primary-foreground shadow-md" : "bg-secondary text-muted-foreground"
            }`}
          >
            <Moon className="w-4 h-4" />
            {t("profile.dark")}
          </button>
        </div>
      </motion.div>

      {/* Logout */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
        <Button
          variant="destructive"
          className="w-full rounded-2xl h-12 font-bold gap-2"
          onClick={signOut}
        >
          <LogOut className="w-4 h-4" />
          {t("auth.logout")}
        </Button>
      </motion.div>
    </div>
  );
}

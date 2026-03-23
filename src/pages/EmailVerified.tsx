import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle, Gamepad2 } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import logo from "@/assets/logo.png";

export default function EmailVerified() {
  const { t } = useI18n();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="w-full max-w-sm text-center"
      >
        <img src={logo} alt="GameNight" className="w-16 h-16 mx-auto mb-4" />

        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="w-20 h-20 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center"
        >
          <CheckCircle className="w-10 h-10 text-primary" />
        </motion.div>

        <h1 className="text-2xl font-display font-bold text-foreground mb-2">
          {t("auth.verifiedTitle")}
        </h1>
        <p className="text-muted-foreground text-sm mb-8">
          {t("auth.verifiedMsg")}
        </p>

        <Button
          onClick={() => navigate("/")}
          className="w-full rounded-lg h-12 font-semibold gap-2 shadow-md hover:shadow-lg transition-shadow"
        >
          <Gamepad2 className="w-4 h-4" />
          {t("auth.letsPlay")}
        </Button>
      </motion.div>
    </div>
  );
}

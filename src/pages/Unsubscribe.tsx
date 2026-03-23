import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

export default function Unsubscribe() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"loading" | "valid" | "used" | "invalid" | "success" | "error">("loading");
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (!token) { setStatus("invalid"); return; }
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
    fetch(`${supabaseUrl}/functions/v1/handle-email-unsubscribe?token=${token}`, {
      headers: { apikey: anonKey },
    })
      .then(r => r.json())
      .then(data => {
        if (data.valid === false && data.reason === "already_unsubscribed") setStatus("used");
        else if (data.valid) setStatus("valid");
        else setStatus("invalid");
      })
      .catch(() => setStatus("invalid"));
  }, [token]);

  const handleConfirm = async () => {
    setConfirming(true);
    try {
      const { data } = await supabase.functions.invoke("handle-email-unsubscribe", { body: { token } });
      if (data?.success) setStatus("success");
      else if (data?.reason === "already_unsubscribed") setStatus("used");
      else setStatus("error");
    } catch { setStatus("error"); }
    setConfirming(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-md w-full text-center space-y-4">
        <h1 className="text-2xl font-bold text-foreground font-display">GameNight Stats</h1>
        {status === "loading" && <p className="text-muted-foreground">Verificando...</p>}
        {status === "valid" && (
          <>
            <p className="text-muted-foreground">¿Deseas cancelar la suscripción a los emails de GameNight Stats?</p>
            <button onClick={handleConfirm} disabled={confirming}
              className="px-6 py-3 bg-destructive text-destructive-foreground rounded-lg font-semibold">
              {confirming ? "Procesando..." : "Confirmar cancelación"}
            </button>
          </>
        )}
        {status === "success" && <p className="text-accent font-semibold">✓ Te has dado de baja correctamente.</p>}
        {status === "used" && <p className="text-muted-foreground">Ya estás dado de baja.</p>}
        {status === "invalid" && <p className="text-destructive">Enlace inválido o expirado.</p>}
        {status === "error" && <p className="text-destructive">Ocurrió un error. Inténtalo de nuevo.</p>}
      </div>
    </div>
  );
}

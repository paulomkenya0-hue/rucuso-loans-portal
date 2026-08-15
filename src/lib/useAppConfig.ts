import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import type { AppConfig } from "./types";

const FALLBACK_CONFIG: AppConfig = {
  deadline: "2026-08-17T09:00:00.000Z", // 12:00 PM Africa/Dar_es_Salaam (UTC+3)
  minister_name: "Paulo M. Gaitirya",
  minister_phone: "0624847729",
  deputy_minister_name: "Anthony Ogessa",
  deputy_minister_phone: "0622833881",
  secretary_name: "Debora Mgeni",
  secretary_phone: "0761622539",
  contact_email: "systemsoftware.dev.ai@gmail.com",
  announcement_text:
    "WANAFUNZI WOTE AMBAO MNAOMBA MKOPO AU MSHAOMBA MKOPO KWA MWAKA HUU WA MASOMO 2026/2027 MNATAKIWA KUJAZA TAARIFA ZENU KWENYE LINK HII. Hata kama bado hujaomba mkopo lakini una mpango wa kuomba mkopo mwaka huu, unatakiwa kujaza taarifa zako. NB: NI WALE TU AMBAO HAWANA MKOPO. Pia, kama uliwasilisha taarifa zako ofisini hapo awali, unatakiwa kujaza tena kupitia mfumo huu. Tafadhali hakikisha taarifa zote unazojaza ni sahihi kabla ya kuwasilisha.",
  organization_name: "RUCU STUDENTS ORGANIZATION (RUCUSO)",
  logo_url: null,
};

export function useAppConfig() {
  const [config, setConfig] = useState<AppConfig>(FALLBACK_CONFIG);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function load() {
      const { data, error } = await supabase.from("app_config").select("*").single();
      if (active) {
        if (!error && data) {
          setConfig({ ...FALLBACK_CONFIG, ...data });
        }
        setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, []);

  return { config, loading };
}

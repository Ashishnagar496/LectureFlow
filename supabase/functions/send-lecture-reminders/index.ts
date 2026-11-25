// Supabase Edge Function: send-lecture-reminders
// Dispatches WhatsApp (preferred), SMS (optional fallback), and Web Push reminders.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function sendWhatsAppMessage(
  toNumber: string,
  subject: string,
  minutes: number,
  room: string
): Promise<{ ok: boolean; error?: string }> {
  const token = Deno.env.get("WHATSAPP_ACCESS_TOKEN");
  const phoneId = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID");
  const templateName = Deno.env.get("WHATSAPP_TEMPLATE_NAME") || "lecture_reminder_v1";

  if (!token || !phoneId) {
    return { ok: false, error: "WhatsApp Cloud API credentials not configured." };
  }

  const cleanNumber = toNumber.replace(/[^0-9]/g, "");
  const res = await fetch(`https://graph.facebook.com/v19.0/${phoneId}/messages`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: cleanNumber,
      type: "template",
      template: {
        name: templateName,
        language: { code: "en" },
        components: [
          {
            type: "body",
            parameters: [
              { type: "text", text: subject },
              { type: "text", text: String(minutes) },
              { type: "text", text: room || "Assigned Room" },
            ],
          },
        ],
      },
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    return { ok: false, error: errText };
  }
  return { ok: true };
}

async function sendSmsMessage(
  toNumber: string,
  body: string
): Promise<{ ok: boolean; error?: string }> {
  const smsUrl = Deno.env.get("SMS_GATEWAY_API_URL");
  const smsKey = Deno.env.get("SMS_GATEWAY_API_KEY");

  if (!smsUrl || !smsKey) {
    return { ok: false, error: "SMS gateway not configured." };
  }

  const res = await fetch(smsUrl, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${smsKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ to: toNumber, message: body }),
  });

  if (!res.ok) {
    return { ok: false, error: await res.text() };
  }
  return { ok: true };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Current time in Asia/Kolkata (+05:30)
    const now = new Date();
    const utcTime = now.getTime() + now.getTimezoneOffset() * 60000;
    const kolkataDate = new Date(utcTime + 5.5 * 3600000);
    const dayOfWeek = kolkataDate.getDay() === 0 ? 7 : kolkataDate.getDay();
    const currentDateStr = kolkataDate.toISOString().split("T")[0];
    const currentTimeStr = kolkataDate.toTimeString().split(" ")[0];

    const { data: holidays } = await supabase
      .from("holidays")
      .select("id, description")
      .eq("date", currentDateStr);

    if (holidays && holidays.length > 0) {
      return new Response(JSON.stringify({ message: "Holiday today. Reminders skipped." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: users, error: userError } = await supabase
      .from("notification_preferences")
      .select(`
        user_id, enabled, browser_push_enabled, whatsapp_enabled, sms_enabled,
        whatsapp_number, sms_number, reminder_minutes, quiet_hours_start, quiet_hours_end,
        profiles ( id, full_name, section_id, phone_number )
      `)
      .eq("enabled", true);

    if (userError || !users) {
      throw new Error(`Failed to fetch preferences: ${userError?.message}`);
    }

    let sentCount = 0;

    for (const pref of users) {
      const profile = (pref as any).profiles;
      if (!profile || !profile.section_id) continue;

      if (pref.quiet_hours_start && pref.quiet_hours_end) {
        if (currentTimeStr >= pref.quiet_hours_start || currentTimeStr <= pref.quiet_hours_end) {
          continue;
        }
      }

      const { data: lectures } = await supabase
        .from("lectures")
        .select("id, subject_name, classroom, faculty_name, start_time")
        .eq("section_id", profile.section_id)
        .eq("day_of_week", dayOfWeek);

      if (!lectures) continue;

      for (const lecture of lectures) {
        const [lH, lM, lS] = lecture.start_time.split(":").map(Number);
        const lectureStart = new Date(kolkataDate);
        lectureStart.setHours(lH, lM, lS || 0, 0);
        const diffMinutes = Math.round((lectureStart.getTime() - kolkataDate.getTime()) / 60000);

        if (diffMinutes >= pref.reminder_minutes - 2 && diffMinutes <= pref.reminder_minutes + 2) {
          const messageBody = `[LectureFlow] ${lecture.subject_name} starts in ${diffMinutes} min at ${lecture.classroom || "Room"}.`;

          // 1. Prioritize WhatsApp over SMS
          if (pref.whatsapp_enabled && (pref.whatsapp_number || profile.phone_number)) {
            const key = `${profile.id}_${lecture.id}_${currentDateStr}_whatsapp`;
            const { data: existing } = await supabase.from("notification_logs").select("id").eq("idempotency_key", key).maybeSingle();
            if (!existing) {
              const waRes = await sendWhatsAppMessage(
                pref.whatsapp_number || profile.phone_number,
                lecture.subject_name,
                diffMinutes,
                lecture.classroom || "Assigned Room"
              );
              await supabase.from("notification_logs").insert({
                user_id: profile.id,
                lecture_id: lecture.id,
                channel: "whatsapp",
                scheduled_at: lectureStart.toISOString(),
                delivery_status: waRes.ok ? "sent" : "failed",
                error_message: waRes.error || null,
                idempotency_key: key,
              });
              if (waRes.ok) sentCount++;
            }
          } else if (pref.sms_enabled && (pref.sms_number || profile.phone_number)) {
            // 2. SMS fallback if WhatsApp is not enabled
            const key = `${profile.id}_${lecture.id}_${currentDateStr}_sms`;
            const { data: existing } = await supabase.from("notification_logs").select("id").eq("idempotency_key", key).maybeSingle();
            if (!existing) {
              const smsRes = await sendSmsMessage(pref.sms_number || profile.phone_number, messageBody);
              await supabase.from("notification_logs").insert({
                user_id: profile.id,
                lecture_id: lecture.id,
                channel: "sms",
                scheduled_at: lectureStart.toISOString(),
                delivery_status: smsRes.ok ? "sent" : "failed",
                error_message: smsRes.error || null,
                idempotency_key: key,
              });
              if (smsRes.ok) sentCount++;
            }
          }
        }
      }
    }

    return new Response(JSON.stringify({ success: true, sentCount }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

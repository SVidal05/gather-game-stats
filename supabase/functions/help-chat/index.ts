import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are a friendly help assistant for GameNight Tracker, a web app that helps friend groups track board game nights. Answer in the same language the user writes in.

Here's what users can do in the app:

**Groups**
- Create groups to play with friends
- Share an invite code so others can join
- Switch between groups using the group selector at the top
- Each user also has a "Personal" group for solo tracking

**Players**
- Add players to a group (they don't need an account)
- Customize player avatars and colors
- Link a player to a real user account

**Sessions (Game Nights)**
- Log a game session: pick a game, add players, record scores
- The app auto-detects winners based on scores
- Add notes to sessions
- View session history with filters

**Games**
- Search and add board games from a catalog
- Games have categories (competitive, cooperative, solo)
- Track custom stats per game (e.g. "Cities built", "Rounds played")

**Ranking & Stats**
- See win rates, total wins, and rankings per group
- Compare players head-to-head in the Compare tab
- View charts showing performance over time

**Tournaments**
- Create bracket-style tournaments within a group
- Track match results and advancement

**Profile & Settings**
- Change username and display title
- Pick a language (Spanish, English, French)
- View achievements and badges
- Export data

**Navigation**
- The app has tabs at the bottom: Home, Play (log sessions), Games, Profile
- The Home tab shows an overview dashboard with key stats

Keep answers concise and helpful. If you don't know something, say so. Don't make up features that don't exist.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();

    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: "Messages array is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            ...messages.slice(-20), // limit context window
          ],
          stream: true,
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Too many requests, please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI service temporarily unavailable." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(
        JSON.stringify({ error: "AI service error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("help-chat error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

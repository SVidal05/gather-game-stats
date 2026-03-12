const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name } = await req.json();

    if (!name || typeof name !== 'string') {
      return new Response(
        JSON.stringify({ success: false, error: 'Game name is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const apiKey = Deno.env.get('RAWG_API_KEY');
    if (!apiKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'RAWG API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const searchUrl = `https://api.rawg.io/api/games?key=${apiKey}&search=${encodeURIComponent(name)}&page_size=1`;
    console.log('Searching RAWG for:', name);

    const response = await fetch(searchUrl);
    const data = await response.json();

    if (!response.ok) {
      console.error('RAWG API error:', data);
      return new Response(
        JSON.stringify({ success: false, error: `RAWG API error: ${response.status}` }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (data.results && data.results.length > 0) {
      const game = data.results[0];
      return new Response(
        JSON.stringify({
          success: true,
          found: true,
          background_image: game.background_image || null,
          cover_image: game.background_image || null, // RAWG uses background_image as main image
          name: game.name,
          slug: game.slug,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, found: false }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error searching game:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"

console.log("Functions: process-document initialized")

const allowedOrigin = Deno.env.get('APP_ORIGIN') || '*'

const corsHeaders = {
  'Access-Control-Allow-Origin': allowedOrigin,
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { documentText, imageUrl } = await req.json()

    if (!documentText && !imageUrl) {
      throw new Error('No document content provided')
    }

    const GROQ_API_KEY = Deno.env.get('GROQ_API_KEY')
    if (!GROQ_API_KEY) {
      throw new Error('GROQ_API_KEY not configured')
    }

    const systemPrompt = `You are an expert data extractor for estate settlement. 
    Extract the following fields from the document text:
    - Institution Name
    - Account Number (last 4 digits ok)
    - Asset Value (number)
    - Asset Type (e.g. Checking, 401k, Life Insurance)
    
    Return ONLY valid JSON.`

    const messages = [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: documentText ?
          `Analyze this text: ${documentText.substring(0, 8000)}` :
          [
            { type: "text", text: "Analyze this image:" },
            { type: "image_url", image_url: { url: imageUrl } }
          ]
      }
    ]

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: imageUrl ? 'llama-3.2-11b-vision-preview' : 'llama-3.3-70b-versatile',
        messages: messages,
        temperature: 0,
        response_format: { type: "json_object" }
      }),
    })

    const data = await response.json()
    const extractedData = JSON.parse(data.choices[0].message.content)

    return new Response(
      JSON.stringify(extractedData),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    )

  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    )
  }
})

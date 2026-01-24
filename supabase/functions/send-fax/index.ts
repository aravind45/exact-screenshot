// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'jsr:@supabase/supabase-js@2'
import type { Database } from '../../src/integrations/supabase/types.ts'

console.log("Functions: send-fax initialized")

interface FaxPayload {
  assetId: string;
  faxNumber: string;
  pdfUrl?: string; // URL of the PDF in storage
  pdfBase64?: string; // OR Base64 content
  subject?: string;
}

Deno.serve(async (req) => {
  try {
    // 1. Setup Supabase Client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient<Database>(supabaseUrl, supabaseKey)

    const payload: FaxPayload = await req.json()
    const { assetId, faxNumber, pdfUrl, pdfBase64, subject = "Document Submission" } = payload

    if (!assetId || !faxNumber) {
      return new Response(JSON.stringify({ error: "Missing assetId or faxNumber" }), { status: 400, headers: { "Content-Type": "application/json" } })
    }

    if (!pdfUrl && !pdfBase64) {
      return new Response(JSON.stringify({ error: "Missing document (pdfUrl or pdfBase64)" }), { status: 400, headers: { "Content-Type": "application/json" } })
    }

    // 2. Fetch PamFax Credentials (Mock check)
    const pamFaxToken = Deno.env.get('PAMFAX_API_TOKEN')

    // 3. Send Fax (Simulation)
    console.log(`Sending Fax to ${faxNumber} for Asset ${assetId}`)

    // In a real implementation:
    // const pamFaxResponse = await fetch('https://api.pamfax.biz/v1/fax/send', {
    //   method: 'POST',
    //   headers: { 'Authorization': `Bearer ${pamFaxToken}` },
    //   body: JSON.stringify({ number: faxNumber, file: pdfUrl | pdfBase64 })
    // })

    // MOCK RESPONSE
    const mockSuccess = true
    const faxId = `fax_${Date.now()}`

    if (!mockSuccess) {
      throw new Error("PamFax API Error: Insufficient credits")
    }

    // 4. Log Communication
    const { error: logError } = await supabase
      .from('asset_communications')
      .insert({
        asset_id: assetId,
        user_id: (await supabase.auth.getUser()).data.user?.id || 'system', // Use logged in user ideally, but this is edge function
        communication_type: 'fax',
        method: 'fax',
        direction: 'outbound',
        subject: `Fax Sent: ${subject}`,
        content: `Fax ID: ${faxId}. Sent to ${faxNumber}`,
        communication_date: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        // created_at is default
      })

    if (logError) {
      console.error("Failed to log fax:", logError)
      // We don't fail the request if logging fails, but it's bad.
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Fax queued successfully",
        faxId
      }),
      { headers: { "Content-Type": "application/json" } },
    )

  } catch (err) {
    return new Response(
      JSON.stringify({ success: false, error: (err as Error).message }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    )
  }
})

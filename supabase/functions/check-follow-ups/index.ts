// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'jsr:@supabase/supabase-js@2'
import type { Database } from '../../src/integrations/supabase/types.ts'

console.log("Functions: check-follow-ups initialized")

Deno.serve(async (req) => {
  try {
    // 1. Setup Supabase Client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient<Database>(supabaseUrl, supabaseKey)

    // 2. Query Active Assets
    const { data: assets, error: fetchError } = await supabase
      .from('assets')
      .select('*')
      .not('status', 'in', '("CLOSED","DISTRIBUTED")') // Filter out closed assets

    if (fetchError) throw fetchError
    if (!assets || assets.length === 0) {
      return new Response(JSON.stringify({ message: "No active assets found" }), { headers: { "Content-Type": "application/json" } })
    }

    const updates = []
    const now = new Date()

    // 3. Evaluate each asset
    for (const asset of assets) {
      if (!asset.last_contact_date && !asset.created_at) continue

      // Use last_contact_date, fallback to created_at
      const lastDateStr = asset.last_contact_date || asset.created_at
      const lastDate = new Date(lastDateStr)
      const diffTime = Math.abs(now.getTime() - lastDate.getTime())
      const daysElapsed = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

      let newPriority = 'low'
      let shouldUpdate = false
      let newNextFollowUp = asset.next_follow_up_date

      // 7/14/21/30 Rule
      if (daysElapsed >= 30) newPriority = 'urgent'
      else if (daysElapsed >= 21) newPriority = 'high'
      else if (daysElapsed >= 14) newPriority = 'medium'
      else if (daysElapsed >= 7) newPriority = 'low'

      // Special Rules for Specific Types (e.g., 401k is stricter)
      if ((asset.asset_type === '401k' || asset.asset_type === 'life_insurance') && daysElapsed >= 21) {
        newPriority = 'urgent'
      }

      // Detect Change
      const currentPriority = asset.priority || 'low'
      if (newPriority !== currentPriority) {
        shouldUpdate = true
      }

      // If overdue, ensure next_follow_up_date is today (if it was in the past or null)
      if (daysElapsed >= 7) {
        if (!asset.next_follow_up_date || new Date(asset.next_follow_up_date) < now) {
          // Set to Today
          newNextFollowUp = now.toISOString()
          shouldUpdate = true
        }
      }

      if (shouldUpdate) {
        updates.push(
          supabase
            .from('assets')
            .update({
              priority: newPriority,
              next_follow_up_date: newNextFollowUp,
              updated_at: new Date().toISOString()
            })
            .eq('id', asset.id)
        )
      }
    }

    // 4. Execute Updates
    if (updates.length > 0) {
      await Promise.all(updates)
    }

    const result = {
      success: true,
      scanned_assets: assets.length,
      updated_assets: updates.length,
      message: `Updated ${updates.length} assets with new priorities`
    }

    return new Response(
      JSON.stringify(result),
      { headers: { "Content-Type": "application/json" } },
    )

  } catch (err) {
    return new Response(
      JSON.stringify({ success: false, error: (err as Error).message }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    )
  }
})

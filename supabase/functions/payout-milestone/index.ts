
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders } from "../_shared/cors.ts";

console.log("Hello from payout-milestone!");

Deno.serve(async (req) => {
    // 1. CORS
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        // 2. Auth & Input
        const authHeader = req.headers.get("Authorization");
        if (!authHeader) {
            throw new Error("Missing Authorization header");
        }

        const supabaseClient = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_ANON_KEY") ?? "",
            { global: { headers: { Authorization: authHeader } } }
        );

        const {
            data: { user },
            error: userError,
        } = await supabaseClient.auth.getUser();

        if (userError || !user) {
            throw new Error("Unauthorized");
        }

        // Role check: ADMIN only
        const { data: profile } = await supabaseClient
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .single();

        if (profile?.role !== "ADMIN") {
            throw new Error("Forbidden: Admin access required");
        }

        const { contractId, milestoneId } = await req.json();

        if (!contractId || !milestoneId) {
            throw new Error("Missing contractId or milestoneId");
        }

        const supabaseAdmin = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
        );

        // 3. Verify Contract & Milestone
        const { data: milestone, error: msError } = await supabaseAdmin
            .from("contract_milestones")
            .select("*")
            .eq("id", milestoneId)
            .single();

        if (msError || !milestone) {
            throw new Error("Milestone not found");
        }

        if (milestone.status !== "RELEASED") {
            throw new Error("Milestone must be RELEASED to payout");
        }

        if (milestone.contract_id !== contractId) {
            throw new Error("Milestone mismatch");
        }

        // 4. Calculate Payout Amount
        // Sum TUTOR_PAYABLE
        const { data: payableEntries } = await supabaseAdmin
            .from("ledger_entries")
            .select("amount")
            .eq("contract_id", contractId)
            .eq("milestone_id", milestoneId)
            .eq("type", "TUTOR_PAYABLE");

        const totalPayable = payableEntries?.reduce((sum, e) => sum + Number(e.amount), 0) ?? 0;

        // Sum already paid (TUTOR_PAYOUT)
        const { data: paidEntries } = await supabaseAdmin
            .from("ledger_entries")
            .select("amount")
            .eq("contract_id", contractId)
            .eq("milestone_id", milestoneId)
            .eq("type", "TUTOR_PAYOUT");

        const totalPaid = paidEntries?.reduce((sum, e) => sum + Number(e.amount), 0) ?? 0;

        const remaining = totalPayable - totalPaid;

        if (remaining <= 0) {
            throw new Error("No funds remaining to payout for this milestone");
        }

        // 5. Execute Payout
        const payoutKey = `MILESTONE:${milestoneId}:PAYOUT`;

        // Create Ledger Entry (TUTOR_PAYOUT)
        const { data: entry, error: payoutError } = await supabaseAdmin
            .from("ledger_entries")
            .insert({
                contract_id: contractId,
                milestone_id: milestoneId,
                type: "TUTOR_PAYOUT",
                amount: remaining,
                currency: milestone.currency ?? "ETB",
                idempotency_key: payoutKey,
            })
            .select()
            .single();

        if (payoutError) {
            if (payoutError.code === "23505") {
                throw new Error("Payout already recorded (idempotency check)");
            }
            throw payoutError;
        }

        return new Response(JSON.stringify(entry), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
        });

    } catch (error) {
        return new Response(JSON.stringify({ error: (error as Error).message }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400,
        });
    }
});

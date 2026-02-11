
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders } from "../_shared/cors.ts";

console.log("Hello from release-milestone!");

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

        const { contractId, milestoneId } = await req.json();

        if (!contractId || !milestoneId) {
            throw new Error("Missing contractId or milestoneId");
        }

        const supabaseAdmin = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
        );

        // 3. Verify Contract & Milestone
        const { data: contract, error: contractError } = await supabaseAdmin
            .from("contracts")
            .select("id, parent_id, status")
            .eq("id", contractId)
            .single();

        if (contractError || !contract) {
            throw new Error("Contract not found");
        }

        if (contract.parent_id !== user.id) {
            throw new Error("You are not the parent of this contract");
        }

        if (["CANCELLED", "COMPLETED"].includes(contract.status)) {
            throw new Error("Contract is not active");
        }

        const { data: milestone, error: msError } = await supabaseAdmin
            .from("contract_milestones")
            .select("*")
            .eq("id", milestoneId)
            .single();

        if (msError || !milestone) {
            throw new Error("Milestone not found");
        }

        if (milestone.contract_id !== contractId) {
            throw new Error("Milestone does not belong to this contract");
        }

        if (milestone.status !== "FUNDED") {
            throw new Error("Milestone must be FUNDED to release");
        }

        // 4. Check Escrow Balance
        // Sum ESCROW_DEPOSIT for this milestone
        const { data: deposits, error: ledgerError } = await supabaseAdmin
            .from("ledger_entries")
            .select("amount")
            .eq("contract_id", contractId)
            .eq("milestone_id", milestoneId)
            .eq("type", "ESCROW_DEPOSIT");

        if (ledgerError) throw ledgerError;

        const totalEscrow = deposits?.reduce((sum, entry) => sum + Number(entry.amount), 0) ?? 0;
        const requiredAmount = Number(milestone.amount);

        if (totalEscrow < requiredAmount) {
            throw new Error("Insufficient escrow balance for this milestone");
        }

        // 5. Release Funds
        const releaseKey = `MILESTONE:${milestoneId}:RELEASE`;

        // Create Ledger Entry (TUTOR_PAYABLE)
        const { error: releaseError } = await supabaseAdmin.from("ledger_entries").insert({
            contract_id: contractId,
            milestone_id: milestoneId,
            type: "TUTOR_PAYABLE",
            amount: requiredAmount,
            currency: milestone.currency ?? "ETB",
            idempotency_key: releaseKey,
        });

        if (releaseError) {
            if (releaseError.code === "23505") { // Unique violation
                throw new Error("Milestone already released (idempotency check)");
            }
            throw releaseError;
        }

        // Update Milestone Status
        const { data: updated, error: updateError } = await supabaseAdmin
            .from("contract_milestones")
            .update({
                status: "RELEASED",
                released_at: new Date().toISOString(),
            })
            .eq("id", milestoneId)
            .select()
            .single();

        if (updateError) throw updateError;

        return new Response(JSON.stringify(updated), {
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

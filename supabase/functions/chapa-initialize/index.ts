
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders } from "../_shared/cors.ts";
import { initializeChapaTransaction } from "../_shared/chapa.ts";

console.log("Hello from chapa-initialize!");

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

        if (!contractId) {
            throw new Error("Missing contractId");
        }

        // Use Service Role for DB admin tasks (like creating payment with specific data)
        // accessible via Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
        // BUT we should verify permissions using the user's context first.
        // The previous API verified:
        // 1. User is PARENT or STUDENT
        // 2. User is the contract's parentId

        const supabaseAdmin = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
        );

        // 3. Fetch Contract & Verify
        const { data: contract, error: contractError } = await supabaseAdmin
            .from("contracts")
            .select("*, job_posts(title, budget)")
            .eq("id", contractId)
            .single();

        if (contractError || !contract) {
            throw new Error("Contract not found");
        }

        if (contract.parent_id !== user.id) {
            throw new Error("You are not the parent of this contract");
        }

        if (["CANCELLED", "COMPLETED"].includes(contract.status)) {
            throw new Error("Contract is not payable");
        }

        // 4. Milestone Logic (if applicable)
        let amount = 0;
        let currency = "ETB";
        let title = "Contract Payment";
        let description = contract.job_posts?.title ?? "Contract Payment";

        if (milestoneId) {
            const { data: milestone, error: msError } = await supabaseAdmin
                .from("contract_milestones")
                .select("*")
                .eq("id", milestoneId)
                .eq("contract_id", contractId)
                .single();

            if (msError || !milestone) {
                throw new Error("Milestone not found");
            }

            if (["RELEASED", "FUNDED", "CANCELLED"].includes(milestone.status)) {
                throw new Error("Milestone is not payable (already funded or cancelled)");
            }

            amount = Number(milestone.amount);
            currency = milestone.currency ?? "ETB";
            title = "Milestone Funding";
            description = milestone.title;
        } else {
            // Contract Payment (Initial)
            if (contract.status === "ACTIVE") {
                throw new Error("Contract is already active");
            }
            amount = Number(contract.amount);
            currency = contract.currency ?? "ETB";
        }

        if (amount <= 0) {
            throw new Error("Invalid payment amount");
        }

        // 5. Idempotency Check
        const { data: existing } = await supabaseAdmin
            .from("payments")
            .select("id")
            .eq("contract_id", contractId)
            .eq("status", "PENDING")
            .is("milestone_id", milestoneId ? milestoneId : null)
            .maybeSingle();

        if (existing) {
            throw new Error(
                "A pending payment already exists. Please cancel or complete it."
            );
        }

        // 6. Initialize Chapa
        const txRef = `tx_${crypto.randomUUID()}`;
        const chapaSecret = Deno.env.get("CHAPA_SECRET_KEY");

        if (!chapaSecret) {
            throw new Error("CHAPA_SECRET_KEY not configured");
        }

        const { data: profile } = await supabaseAdmin
            .from("profiles")
            .select("name, email")
            .eq("id", user.id)
            .single();

        const baseUrl = Deno.env.get("API_PUBLIC_URL") ?? "http://localhost:54321";
        // In migrated app, we might use frontend URL for success return
        const frontendUrl = Deno.env.get("FRONTEND_URL") ?? "http://localhost:3000";

        const chapaResponse = await initializeChapaTransaction(chapaSecret, {
            amount: amount.toString(),
            currency,
            email: profile?.email ?? user.email ?? "no-email@example.com",
            first_name: profile?.name ?? "Client",
            tx_ref: txRef,
            callback_url: `${baseUrl}/functions/v1/chapa-callback`,
            return_url: `${frontendUrl}/payments/success?tx_ref=${txRef}`,
            customization: {
                title: `${Deno.env.get("NEXT_PUBLIC_APP_NAME") ?? "TutorStartup"} - ${title}`,
                description,
            },
        });

        if (!chapaResponse.data?.checkout_url) {
            console.error("Chapa Error:", chapaResponse);
            throw new Error("Failed to initialize payment with provider");
        }

        // 7. Create Payment Record
        const { data: payment, error: createError } = await supabaseAdmin
            .from("payments")
            .insert({
                provider: "CHAPA",
                status: "PENDING",
                contract_id: contractId,
                milestone_id: milestoneId || null,
                created_by_user_id: user.id,
                amount,
                currency,
                provider_reference: txRef,
                checkout_url: chapaResponse.data.checkout_url,
                metadata: chapaResponse,
            })
            .select()
            .single();

        if (createError) {
            throw createError;
        }

        // 8. Return
        return new Response(
            JSON.stringify({
                checkoutUrl: payment.checkout_url,
                paymentId: payment.id,
            }),
            {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 200,
            }
        );
    } catch (error) {
        return new Response(JSON.stringify({ error: (error as Error).message }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400,
        });
    }
});

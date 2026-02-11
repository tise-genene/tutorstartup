
export const CHAPA_BASE_URL = "https://api.chapa.co/v1";

export interface ChapaInitializePayload {
    amount: string;
    currency: string;
    email: string;
    first_name: string;
    last_name?: string;
    tx_ref: string;
    callback_url?: string;
    return_url?: string;
    customization?: {
        title?: string;
        description?: string;
        logo?: string;
    };
}

export interface ChapaInitializeResponse {
    status: string;
    message: string;
    data: {
        checkout_url: string;
    } | null;
}

export interface ChapaVerifyResponse {
    status: string;
    message: string;
    data: {
        first_name: string;
        last_name: string;
        email: string;
        currency: string;
        amount: number;
        charge: number;
        mode: string;
        method: string;
        type: string;
        status: string;
        reference: string;
        tx_ref: string;
        customization: {
            title: string;
            description: string;
            logo: string;
        };
        meta: any;
        created_at: string;
        updated_at: string;
    } | null;
}

export async function initializeChapaTransaction(
    secretKey: string,
    payload: ChapaInitializePayload
): Promise<ChapaInitializeResponse> {
    const response = await fetch(`${CHAPA_BASE_URL}/transaction/initialize`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${secretKey}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
    });

    return await response.json();
}

export async function verifyChapaTransaction(
    secretKey: string,
    txRef: string
): Promise<ChapaVerifyResponse> {
    const response = await fetch(
        `${CHAPA_BASE_URL}/transaction/verify/${txRef}`,
        {
            method: "GET",
            headers: {
                Authorization: `Bearer ${secretKey}`,
            },
        }
    );

    return await response.json();
}

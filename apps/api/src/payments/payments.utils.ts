import { createHmac } from 'node:crypto';
import { Prisma } from '@prisma/client';
import { PaymentStatus } from '../prisma/prisma.enums';

export const DEFAULT_CURRENCY = 'ETB';

export type UnknownRecord = Record<string, unknown>;

/**
 * Validates and converts a value to a Prisma-compatible JSON input.
 */
export function toInputJsonValue(value: unknown): Prisma.InputJsonValue | undefined {
    if (value === null || value === undefined) return undefined;
    try {
        return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
    } catch {
        return undefined;
    }
}

/**
 * Converts a value to a nullable JSON field for Prisma.
 */
export function toNullableJsonField(
    value: unknown,
): Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput {
    return toInputJsonValue(value) ?? Prisma.JsonNull;
}

/**
 * Ensures a currency code is normalized (trimmed, uppercase, fallback to default).
 */
export function normalizeCurrency(value?: string | null): string {
    const c = (value ?? '').trim().toUpperCase();
    return c.length ? c : DEFAULT_CURRENCY;
}

/**
 * Safely converts a value to a lowercase string.
 */
export function safeLower(value: unknown): string {
    if (typeof value === 'string') return value.toLowerCase();
    if (typeof value === 'number' || typeof value === 'boolean') {
        return String(value).toLowerCase();
    }
    return '';
}

/**
 * Type guard for record objects.
 */
export function isRecord(value: unknown): value is UnknownRecord {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Returns the value as a record if applicable, otherwise null.
 */
export function getRecord(value: unknown): UnknownRecord | null {
    return isRecord(value) ? value : null;
}

/**
 * Safely extracts a trimmed non-empty string field from an object.
 */
export function getStringField(obj: unknown, key: string): string | undefined {
    const rec = getRecord(obj);
    const value = rec ? rec[key] : undefined;
    return typeof value === 'string' && value.trim().length > 0
        ? value
        : undefined;
}

/**
 * Safely retrieves a nested value from an object using a path array.
 */
export function getNested(obj: unknown, path: string[]): unknown {
    let cur: unknown = obj;
    for (const p of path) {
        const rec = getRecord(cur);
        if (!rec) return undefined;
        cur = rec[p];
    }
    return cur;
}

/**
 * Extracts a Chapa transaction reference from various possible payload formats.
 */
export function extractTxRef(payload: unknown): string | undefined {
    const direct =
        getStringField(payload, 'tx_ref') ?? getStringField(payload, 'trx_ref');
    if (direct) return direct;

    const nested = getNested(payload, ['data', 'tx_ref']);
    return typeof nested === 'string' && nested.trim().length > 0
        ? nested.trim()
        : undefined;
}

/**
 * Extracts the Chapa signature header from various casing variants.
 */
export function getChapaSignature(headers: Record<string, unknown>): string | null {
    const candidates = [
        headers['x-chapa-signature'],
        headers['X-Chapa-Signature'],
        headers['chapa-signature'],
        headers['Chapa-Signature'],
    ];
    for (const c of candidates) {
        if (typeof c === 'string' && c.trim().length > 0) return c.trim();
        if (Array.isArray(c) && typeof c[0] === 'string' && c[0].trim().length > 0)
            return c[0].trim();
    }
    return null;
}

/**
 * Computes HMAC-SHA256 hex digest for a JSON payload.
 */
export function computeHmacSha256Hex(secret: string, payload: unknown): string {
    return createHmac('sha256', secret)
        .update(JSON.stringify(payload ?? {}))
        .digest('hex');
}

export type VerifyResult = {
    ok: boolean;
    status: PaymentStatus;
    providerResponse?: unknown;
};

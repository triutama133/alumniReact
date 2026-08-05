// lib/sanitize.ts
// Helper sanitasi input untuk mencegah XSS / HTML injection

import sanitizeHtml from 'sanitize-html';

const DEFAULT_ALLOWED_TAGS = [
    'b', 'i', 'em', 'strong', 'a', 'p', 'ul', 'li', 'br',
];

const DEFAULT_ALLOWED_ATTRIBUTES = {
    a: ['href', 'target', 'rel'],
};

/**
 * Membersihkan konten HTML dari tag/atribut berbahaya.
 * Default: hanya tag teks sederhana yang diizinkan.
 */
export function sanitizeContent(raw: string | null | undefined, maxLength = 5000): string {
    if (!raw) return '';

    const clean = sanitizeHtml(raw, {
        allowedTags: DEFAULT_ALLOWED_TAGS,
        allowedAttributes: DEFAULT_ALLOWED_ATTRIBUTES,
        allowedSchemes: ['http', 'https', 'mailto'],
    });

    return clean.trim().slice(0, maxLength);
}

/**
 * Menghapus SEMUA tag HTML — untuk field seperti nama, judul, pesan chat.
 */
export function stripHtml(raw: string | null | undefined, maxLength = 1000): string {
    if (!raw) return '';

    const clean = sanitizeHtml(raw, {
        allowedTags: [],
        allowedAttributes: {},
    });

    return clean.trim().slice(0, maxLength);
}
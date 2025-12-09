// Encryption helpers using Web Crypto API

export async function getCryptoKey(token: string): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    const keyMaterial = await window.crypto.subtle.importKey(
        'raw',
        encoder.encode(token.padEnd(32, '0').slice(0, 32)), // Ensure 256-bit key from token
        { name: 'PBKDF2' },
        false,
        ['deriveKey']
    );

    return window.crypto.subtle.deriveKey(
        {
            name: 'PBKDF2',
            salt: encoder.encode('employee-salt'),
            iterations: 100000,
            hash: 'SHA-256'
        },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt']
    );
}

export async function encryptData(data: string, token: string): Promise<string> {
    const key = await getCryptoKey(token);
    const encoder = new TextEncoder();
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const encrypted = await window.crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        key,
        encoder.encode(data)
    );

    // Combine IV and encrypted data into a single string
    const ivArray = Array.from(iv);
    const encryptedArray = Array.from(new Uint8Array(encrypted));
    return JSON.stringify({ iv: ivArray, data: encryptedArray });
}

export async function decryptData(encryptedString: string, token: string): Promise<string> {
    try {
        const { iv, data } = JSON.parse(encryptedString);
        const key = await getCryptoKey(token);
        const decrypted = await window.crypto.subtle.decrypt(
            { name: 'AES-GCM', iv: new Uint8Array(iv) },
            key,
            new Uint8Array(data)
        );
        return new TextDecoder().decode(decrypted);
    } catch (e) {
        console.error('Decryption failed', e);
        return '';
    }
}

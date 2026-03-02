import { SignJWT, importPKCS8 } from 'jose';
import type { BirCanonicalPayload } from '../bir-schema/validation';

/**
 * Signs the BIR Canonical JSON Payload using RS256 algorithm.
 * 
 * @param payload The canonical JSON payload mapped to BIR specifications
 * @returns The JWS signature string
 */
export async function signBirPayload(payload: BirCanonicalPayload): Promise<string> {
    const privateKeyEnv = process.env.BIR_PRIVATE_KEY_PKCS8;

    if (!privateKeyEnv) {
        throw new Error('BIR_PRIVATE_KEY_PKCS8 environment variable is not set. Cryptographic signing failed.');
    }

    try {
        // Import the PKCS8 formatted private key
        // The BIR requires the algorithm to be RS256
        const privateKey = await importPKCS8(privateKeyEnv, 'RS256');

        // Generate the JWS
        // According to standard BIR requirements, the payload must be the exact JSON
        const jws = await new SignJWT(payload as any)
            .setProtectedHeader({ alg: 'RS256', typ: 'JWT' })
            .setIssuedAt()
            .setIssuer(process.env.SELLER_TIN || 'UNKNOWN_ISSUER')
            .sign(privateKey);

        return jws;
    } catch (error) {
        console.error('Failed to sign BIR payload:', error);
        throw new Error('Cryptographic signature generation failed.');
    }
}

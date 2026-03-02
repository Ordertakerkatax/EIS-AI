import { BirCanonicalPayload } from '../bir-schema/validation';
import { signBirPayload } from '../crypto/signer';
import { fetchWithExponentialBackoff } from './backoff';

const BIR_API_URL = process.env.BIR_API_BASE_URL || 'https://eis.api.bir.gov.ph/v1/invoices';

export interface BirGatewayResponse {
    success: boolean;
    birTrackingId?: string;
    error?: string;
    rawResponse?: any;
}

/**
 * Submits the canonical payload to the BIR API, signing it first,
 * and retrying asynchronously upon failure. 
 * Note: In a true production environment with long potential downtime, 
 * this should be offloaded to a background queue like Inngest or Upstash QStash 
 * instead of running synchronously within the Server Action execution context.
 */
export async function submitToBirApi(payload: BirCanonicalPayload): Promise<BirGatewayResponse> {
    try {
        // 1. Generate the RS256 JWS signature based on the canonical JSON
        const signature = await signBirPayload(payload);

        // 2. Prepare the final request payload expected by the API endpoint
        const requestBody = {
            payload: payload,
            signature: signature
        };

        // 3. Dispatch the request using the fortified exponential backoff fetcher
        const response = await fetchWithExponentialBackoff(BIR_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.BIR_API_TOKEN}`, // Authentication mechanism for the BIR API gateway
            },
            body: JSON.stringify(requestBody)
        });

        const data = await response.json();

        if (!response.ok) {
            console.error("BIR API Submission Rejected:", data);
            return {
                success: false,
                error: data.message || "Failed to submit to BIR",
                rawResponse: data
            };
        }

        // Success path
        return {
            success: true,
            birTrackingId: data.trackingId,
            rawResponse: data
        };

    } catch (error: any) {
        console.error("Critical failure during BIR API submission:", error);
        return {
            success: false,
            error: error.message || "Unknown gateway error occurred"
        };
    }
}

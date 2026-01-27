
/**
 * Validates if the client ID matches the expected format
 * Supported formats:
 * - LMC-XXXXXX (Legacy?)
 * - LMC-END-XXXX (Current)
 */
export function isValidClientId(clientId: string): boolean {
    if (!clientId) return false
    // Simple validation: must start with LMC- and have some length
    return clientId.startsWith('LMC-') && clientId.length > 4
}

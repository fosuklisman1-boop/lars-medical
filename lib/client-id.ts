/**
 * Generates a unique client ID with format: LMC-XXXXXX
 * LMC = Lars Medical Centre
 * XXXXXX = 6 random alphanumeric characters
 * 
 * @returns A unique client ID string
 */
export function generateClientId(): string {
  // Generate 6 random alphanumeric characters
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let randomPart = ''
  
  for (let i = 0; i < 6; i++) {
    randomPart += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  
  return `LMC-${randomPart}`
}

/**
 * Validates if a string is a valid client ID format
 * Valid format: LMC-XXXXXX where X is alphanumeric
 * 
 * @param clientId - The client ID to validate
 * @returns true if valid, false otherwise
 */
export function isValidClientId(clientId: string): boolean {
  const clientIdRegex = /^LMC-[A-Z0-9]{6}$/
  return clientIdRegex.test(clientId)
}

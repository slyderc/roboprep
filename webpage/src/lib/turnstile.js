/**
 * Cloudflare Turnstile verification utilities
 */

/**
 * Verify a Turnstile token on the server side
 * @param {string} token - The Turnstile token from the client
 * @param {string} clientIP - The client's IP address (optional)
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function verifyTurnstileToken(token, clientIP = null) {
  const secretKey = process.env.TURNSTILE_SECRET_KEY;
  
  if (!secretKey) {
    console.error('TURNSTILE_SECRET_KEY not configured');
    return { success: false, error: 'Turnstile not configured' };
  }

  if (!token) {
    return { success: false, error: 'No Turnstile token provided' };
  }

  try {
    const formData = new FormData();
    formData.append('secret', secretKey);
    formData.append('response', token);
    
    if (clientIP) {
      formData.append('remoteip', clientIP);
    }

    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error('Turnstile verification request failed:', response.status, data);
      return { success: false, error: 'Verification request failed' };
    }

    if (data.success) {
      return { success: true };
    } else {
      console.warn('Turnstile verification failed:', data['error-codes']);
      return { 
        success: false, 
        error: 'Security verification failed', 
        errorCodes: data['error-codes'] 
      };
    }
  } catch (error) {
    console.error('Error verifying Turnstile token:', error);
    return { success: false, error: 'Verification error occurred' };
  }
}

/**
 * Extract client IP from Next.js request headers
 * @param {NextRequest} request - The Next.js request object
 * @returns {string|null} - The client IP address or null
 */
export function getClientIP(request) {
  // Try various headers that might contain the real IP
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  const realIP = request.headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }
  
  const cfConnectingIP = request.headers.get('cf-connecting-ip');
  if (cfConnectingIP) {
    return cfConnectingIP;
  }
  
  // Fallback to connection remote address (might not be available in all environments)
  return request.ip || null;
}
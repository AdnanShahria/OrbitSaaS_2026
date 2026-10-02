
export interface ChatMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

/**
 * Sends chat messages to the Orbit AI backend API endpoint (/api/ai?action=chat).
 * The backend uses Groq as the primary ultra-fast provider
 * with automated multi-model fallbacks to other Groq and NVIDIA NIM models.
 */
export const sendToAi = async (messages: ChatMessage[]) => {
    const API_BASE = import.meta.env.VITE_API_URL || '';

    try {
        const response = await fetch(`${API_BASE}/api/ai?action=chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ messages }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('Chat API Error:', errorData);
            throw new Error(`API request failed: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        return data.content || 'Sorry, I could not generate a response.';
    } catch (error) {
        console.error('Error calling Chat API:', error);
        throw error;
    }
};

// Backwards-compatible alias for existing consumers
export const sendToGroq = sendToAi;


export interface ChatMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

export const sendToGroq = async (messages: ChatMessage[]) => {
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

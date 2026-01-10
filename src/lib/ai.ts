import OpenAI from 'openai';
import { CohereClient } from 'cohere-ai';
import { GoogleGenerativeAI } from '@google/generative-ai';

interface GenerateOptions {
    prompt?: string;
    system?: string;
    messages?: { role: 'user' | 'system' | 'assistant'; content: string }[];
    temperature?: number;
    maxTokens?: number;
}

export async function generateText(options: GenerateOptions) {
    const apiKey = process.env.AI_KEY;
    const provider = process.env.AI_PROVIDER || 'openai';
    const model = process.env.AI_MODEL || 'gpt-3.5-turbo';

    if (!apiKey) {
        throw new Error('AI_KEY is not configured');
    }

    if (provider === 'openai' || provider === 'grok') {
        // Grok uses OpenAI valid signature usually, or we can configure baseURL
        const config: any = { apiKey };
        if (provider === 'grok') {
            config.baseURL = 'https://api.x.ai/v1';
        }

        const openai = new OpenAI(config);

        const messages: any[] = options.messages || [];
        if (options.system && messages.length === 0) {
            messages.push({ role: 'system', content: options.system });
        }
        if (options.prompt) {
            messages.push({ role: 'user', content: options.prompt });
        }

        const response = await openai.chat.completions.create({
            model: provider === 'grok' ? (model === 'gpt-3.5-turbo' ? 'grok-beta' : model) : model,
            messages,
            temperature: options.temperature || 0.7,
            max_tokens: options.maxTokens || 500,
        });

        return response.choices[0].message.content || '';
    }

    if (provider === 'cohere') {
        const cohere = new CohereClient({ token: apiKey });
        // Cohere Chat API
        const chat = await cohere.chat({
            message: options.prompt || '',
            preamble: options.system,
            model: model === 'gpt-3.5-turbo' ? 'command' : model,
            temperature: options.temperature || 0.7,
            // maxTokens: options.maxTokens // SDK might name it differently
        });
        return chat.text;
    }

    if (provider === 'gemini' || provider === 'google') {
        const genAI = new GoogleGenerativeAI(apiKey);
        const geminiModel = genAI.getGenerativeModel({ model: model === 'gpt-3.5-turbo' ? 'gemini-pro' : model });

        let promptText = options.prompt || '';
        if (options.system) {
            promptText = `${options.system}\n\n${promptText}`;
        }

        const result = await geminiModel.generateContent(promptText);
        const response = await result.response;
        return response.text();
    }

    if (provider === 'anthropic') {
        // Dynamic import to avoid crash if SDK missing (though we installed it)
        const Anthropic = (await import('@anthropic-ai/sdk')).default;
        const anthropic = new Anthropic({ apiKey });

        let system = options.system;
        let messages: any[] = [];

        if (options.messages) {
            // Convert messages if needed, but SDK usually takes similar format
            messages = options.messages.map(m => ({ role: m.role, content: m.content }));
        } else if (options.prompt) {
            messages.push({ role: 'user', content: options.prompt });
        }

        const msg = await anthropic.messages.create({
            model: model === 'gpt-3.5-turbo' ? 'claude-3-haiku-20240307' : model,
            max_tokens: options.maxTokens || 1024,
            system: system,
            messages: messages as any
        });

        // @ts-ignore - TS might complain about content block types
        return msg.content[0].text;
    }

    throw new Error(`Unsupported AI provider: ${provider}`);
}

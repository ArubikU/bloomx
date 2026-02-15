
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then(res => res.json());
export const DEFAULT_CONFIG = {
    name: process.env.NEXT_PUBLIC_BRAND_NAME || 'Bloom',
    displayName: process.env.NEXT_PUBLIC_BRAND_NAME || 'Bloom',
    logo: process.env.NEXT_PUBLIC_BRAND_LOGO || null,
    theme: {
        primaryColor: process.env.NEXT_PUBLIC_BRAND_COLOR || '#2563EB', // blue-600 default
    }
};
export function useDomainConfig() {
    const { data, error, isLoading } = useSWR('/api/config', fetcher, {
        revalidateOnFocus: true
    });

    if (isLoading) {
        return {
            config: DEFAULT_CONFIG,
            extensions: [],
            isLoading: true,
            isError: false
        }
    }

    const config = data.config;
    console.log(config)
    return {
        config,
        extensions: data?.extensions || [],
        isLoading,
        isError: error
    };
}

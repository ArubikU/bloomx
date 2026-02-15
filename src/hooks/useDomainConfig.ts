
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export function useDomainConfig() {
    const { data, error, isLoading } = useSWR('/api/config', fetcher);

    return {
        config: data?.config,
        extensions: data?.extensions || [],
        isLoading,
        isError: error
    };
}

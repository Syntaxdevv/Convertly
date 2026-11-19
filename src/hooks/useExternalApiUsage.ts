import { useCallback, useEffect, useState } from "react";
import { getDeviceId } from "../lib/deviceId";

interface UsageData {
    success: boolean;
    limit: number;
    used: number;
    remaining: number;
    resetTimezone: string;
}

export function useExternalApiUsage() {
    const [usage, setUsage] = useState<UsageData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [usageError, setUsageError] = useState("");

    const refreshUsage = useCallback(async () => {
        setIsLoading(true);
        setUsageError("");

        try {
            const response = await fetch("/api/usage", {
                method: "GET",
                cache: "no-store",
                headers: {
                    "x-convertly-device-id": getDeviceId(),
                },
            });

            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(
                    result.message || "Unable to load conversion usage."
                );
            }

            setUsage({
                success: result.success,
                limit: result.limit,
                used: result.used,
                remaining: result.remaining,
                resetTimezone: result.resetTimezone,
            });
        } catch (error) {
            setUsage(null);
            setUsageError(
                error instanceof Error
                    ? error.message
                    : "Unable to load conversion usage."
            );
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        void refreshUsage();
    }, [refreshUsage]);

    return {
        usage,
        isLoading,
        usageError,
        refreshUsage,
    };
}
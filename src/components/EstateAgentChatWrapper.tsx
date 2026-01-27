import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { EstateAgentChat } from "./EstateAgentChat";

export function EstateAgentChatWrapper() {
    const { user } = useAuth();

    const { data: estate } = useQuery({
        queryKey: ["estate"],
        queryFn: api.getMyEstate,
        enabled: !!user,
    });

    if (!user || !estate?.id) return null;

    return <EstateAgentChat estateId={estate.id} phase={estate.probateStatus} />;
}

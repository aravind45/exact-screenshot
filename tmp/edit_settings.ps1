$ErrorActionPreference = 'Stop'
$path = 'src/pages/advisor/Settings.tsx'
$content = Get-Content -Raw $path

$content = $content.Replace("import { useState } from 'react';", "import { useEffect, useState } from 'react';")

$pattern = '(?ms)\s*// ── Load existing profile settings ────────────────────────────────────────\s*useQuery\(\{.*?\}\s*as any\);'
$replacement = @"
    // ── Load existing profile settings ────────────────────────────────────────
    const { data: profileSettings } = useQuery({
        queryKey: ['advisor-profile-settings'],
        queryFn: () => api.marketplace.getMyProfile(),
    });

    useEffect(() => {
        if (!profileSettings || profileLoaded) return;

        setTimezone((profileSettings as any).timezone || 'America/Chicago');
        setCancellationHours(String((profileSettings as any).cancellationHours ?? 24));
        setMaxSessionsPerDay(String((profileSettings as any).maxSessionsPerDay ?? 5));
        setBufferMinutes(String((profileSettings as any).bufferMinutes ?? 15));
        setMeetingLink((profileSettings as any).meetingLink || '');
        setPublicNotes((profileSettings as any).publicNotes || '');
        setRequiresApproval((profileSettings as any).requiresApproval !== false);
        setProfileLoaded(true);
    }, [profileSettings, profileLoaded]);
"@
$content = [regex]::Replace($content, $pattern, $replacement)

Set-Content -Path $path -Value $content

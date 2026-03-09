$ErrorActionPreference = 'Stop'
$path = 'src/pages/advisor/Profile.tsx'
$content = Get-Content -Raw $path

$content = $content.Replace("import { api } from '@/lib/api';", "import { api } from '@/lib/api';`r`nimport { normalizeAdvisorStatus, toStringArray } from '@/lib/advisorData';")

$profilePattern = '(?ms)\s*const \{ isLoading: profileLoading \} = useQuery\(\{.*?\}\s*as any\);'
$profileReplacement = @"
    const { data: profileData, isLoading: profileLoading } = useQuery({
        queryKey: ['advisor-profile-me'],
        queryFn: () => api.marketplace.getMyProfile(),
    });

    useEffect(() => {
        if (!profileData || profileLoaded) return;

        const specialtyList = toStringArray((profileData as any)?.specialties ?? (profileData as any)?.expertise);
        const stateList = toStringArray((profileData as any)?.statesServed);
        const languageList = toStringArray((profileData as any)?.languages);

        setBio((profileData as any)?.bio || '');
        setAdvisorType((profileData as any)?.advisorType || '');
        setSpecialties(specialtyList);
        setStatesServed(stateList);
        setLanguages(languageList.length > 0 ? languageList : ['English']);
        setHourlyRate((profileData as any)?.hourlyRate ? String((profileData as any).hourlyRate) : '');
        setLicenseNumber((profileData as any)?.licenseNumber || '');
        setProfileStatus(normalizeAdvisorStatus((profileData as any)?.status || (profileData as any)?.verificationStatus));
        setProfileLoaded(true);
    }, [profileData, profileLoaded]);
"@
$content = [regex]::Replace($content, $profilePattern, $profileReplacement)

$rulesPattern = '(?ms)\s*const \{ isLoading: rulesLoading \} = useQuery\(\{.*?\}\s*as any\);'
$rulesReplacement = @"
    const { data: availabilityRules, isLoading: rulesLoading } = useQuery({
        queryKey: ['advisor-avail-rules'],
        queryFn: () => api.marketplace.getAvailabilityRules(),
    });

    useEffect(() => {
        if (!Array.isArray(availabilityRules) || availabilityRules.length === 0) return;

        setAvailRules(DAYS.map((_, i) => {
            const existing = availabilityRules.find((rule: any) => Number(rule?.dayOfWeek) === i);
            return existing
                ? {
                    dayOfWeek: i,
                    startTime: String(existing.startTime || '09:00'),
                    endTime: String(existing.endTime || '17:00'),
                    isActive: existing.isActive !== false,
                }
                : { dayOfWeek: i, startTime: '09:00', endTime: '17:00', isActive: i >= 1 && i <= 5 };
        }));
    }, [availabilityRules]);
"@
$content = [regex]::Replace($content, $rulesPattern, $rulesReplacement)

Set-Content -Path $path -Value $content

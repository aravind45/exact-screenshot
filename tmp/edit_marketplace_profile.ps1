$ErrorActionPreference = 'Stop'
$path = 'src/pages/marketplace/AdvisorProfile.tsx'
$content = Get-Content -Raw $path

$content = $content.Replace("import { api } from '@/lib/api';", "import { api } from '@/lib/api';`r`nimport { normalizeAdvisorStatus, toStringArray } from '@/lib/advisorData';")

$pattern = '(?ms)const \{ data: advisor, isLoading, isError \} = useQuery<AdvisorProfile>\(\{.*?enabled: !!advisorId,\s*\}\);'
$replacement = @"
const { data: advisor, isLoading, isError } = useQuery<AdvisorProfile>({
    queryKey: ['advisor-profile', advisorId],
    queryFn: async () => {
      const payload = await api.marketplace.getAdvisorProfile(advisorId!);
      const source = ((payload as any)?.data ?? payload ?? {}) as any;
      const user = source?.user ?? {};

      return {
        id: source?.id || '',
        bio: source?.bio || '',
        advisorType: source?.advisorType || 'ATTORNEY',
        specialties: toStringArray(source?.specialties ?? source?.expertise),
        statesServed: toStringArray(source?.statesServed),
        languages: toStringArray(source?.languages),
        hourlyRate: Number(source?.hourlyRate || 0),
        averageRating: Number(source?.averageRating ?? source?.avgRating ?? 0),
        totalReviews: Number(source?.totalReviews || 0),
        verificationStatus: normalizeAdvisorStatus(source?.verificationStatus || source?.status),
        user: {
          fullName: user?.fullName || 'Unknown Advisor',
          email: user?.email || '',
        },
        profileImage: source?.profileImage,
        ratePlans: Array.isArray(source?.ratePlans) ? source.ratePlans : [],
      } as AdvisorProfile;
    },
    enabled: !!advisorId,
  });
"@
$content = [regex]::Replace($content, $pattern, $replacement)

Set-Content -Path $path -Value $content

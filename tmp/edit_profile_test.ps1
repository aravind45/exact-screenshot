$ErrorActionPreference = 'Stop'
$path = 'src/pages/advisor/Profile.tsx'
$content = Get-Content -Raw $path
$content = $content.Replace("import { useState } from 'react';", "import { useEffect, useState } from 'react';")
Set-Content -Path $path -Value $content

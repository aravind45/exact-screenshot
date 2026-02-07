# n8n Web Scraping Agent - Complete Guide

## Overview

This guide shows you how to build a powerful web scraping agent using n8n that can:
- Scrape websites automatically
- Extract structured data
- Handle pagination
- Store results in databases
- Send notifications
- Run on schedules

---

## Why n8n for Web Scraping?

**Advantages:**
- ✅ Visual workflow builder (no coding required)
- ✅ Built-in HTTP Request node
- ✅ HTML parsing with Cheerio
- ✅ JavaScript code execution
- ✅ Database integrations
- ✅ Scheduling capabilities
- ✅ Error handling & retries
- ✅ Webhook triggers
- ✅ Free & self-hosted

**vs. Traditional Scraping:**
- Faster to build (visual interface)
- Easier to maintain
- Built-in integrations
- No infrastructure setup needed

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    n8n Web Scraping Agent                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  [Trigger] → [Fetch HTML] → [Parse Data] → [Transform]    │
│      ↓            ↓             ↓              ↓           │
│  Schedule    HTTP Request   Cheerio/Code   JavaScript      │
│  Webhook                                                    │
│  Manual                                                     │
│                                                             │
│  → [Store Data] → [Notify] → [Error Handler]              │
│        ↓            ↓             ↓                        │
│    Database     Email/Slack   Retry Logic                  │
│    Airtable     Discord                                     │
│    Google Sheets                                            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Use Cases for Estate Settlement

### 1. Court Website Monitoring
- Scrape county court websites for case updates
- Monitor probate filing deadlines
- Track case status changes
- Alert on new documents

### 2. Property Value Tracking
- Scrape Zillow/Redfin for property valuations
- Monitor real estate listings
- Track comparable sales
- Update asset values automatically

### 3. Creditor Claim Monitoring
- Monitor creditor websites for claims
- Track payment deadlines
- Scrape account balances
- Alert on new charges

### 4. Legal Research
- Scrape legal databases
- Monitor case law updates
- Track probate code changes
- Extract relevant statutes

---

## Basic Web Scraping Workflow

### Workflow 1: Simple Page Scraper

```
[Schedule Trigger]
    ↓
[HTTP Request] - Fetch HTML
    ↓
[HTML Extract] - Parse with Cheerio
    ↓
[Set] - Transform data
    ↓
[Database] - Store results
    ↓
[Slack] - Send notification
```

**Nodes Configuration:**

#### 1. Schedule Trigger
```json
{
  "rule": {
    "interval": [
      {
        "field": "hours",
        "hoursInterval": 6
      }
    ]
  }
}
```

#### 2. HTTP Request Node
```json
{
  "method": "GET",
  "url": "https://example.com/probate-cases",
  "options": {
    "timeout": 30000,
    "redirect": {
      "followRedirects": true,
      "maxRedirects": 5
    }
  },
  "authentication": "none"
}
```

#### 3. HTML Extract Node (Cheerio)
```javascript
// Extract data using CSS selectors
const $ = cheerio.load($input.item.json.body);

const cases = [];
$('.case-row').each((i, elem) => {
  cases.push({
    caseNumber: $(elem).find('.case-number').text().trim(),
    status: $(elem).find('.status').text().trim(),
    filingDate: $(elem).find('.date').text().trim(),
    nextHearing: $(elem).find('.hearing').text().trim()
  });
});

return cases.map(c => ({ json: c }));
```

#### 4. Set Node (Transform)
```javascript
// Clean and transform data
return {
  json: {
    caseNumber: $json.caseNumber,
    status: $json.status.toUpperCase(),
    filingDate: new Date($json.filingDate).toISOString(),
    nextHearing: new Date($json.nextHearing).toISOString(),
    scrapedAt: new Date().toISOString(),
    source: 'county-court-website'
  }
};
```

---

## Advanced Workflows

### Workflow 2: Multi-Page Scraper with Pagination

```
[Webhook Trigger]
    ↓
[Set Initial URL]
    ↓
[Loop] ─────────────────┐
    ↓                   │
[HTTP Request]          │
    ↓                   │
[HTML Extract]          │
    ↓                   │
[Check Next Page] ──────┘
    ↓
[Aggregate Results]
    ↓
[Store in Database]
```

**Code for Pagination:**

```javascript
// In HTML Extract node
const $ = cheerio.load($input.item.json.body);

// Extract data
const items = [];
$('.item').each((i, elem) => {
  items.push({
    title: $(elem).find('.title').text().trim(),
    value: $(elem).find('.value').text().trim()
  });
});

// Check for next page
const nextPageUrl = $('.pagination .next').attr('href');

return [{
  json: {
    items: items,
    nextPage: nextPageUrl ? `https://example.com${nextPageUrl}` : null,
    hasMore: !!nextPageUrl
  }
}];
```

---

### Workflow 3: Dynamic Content Scraper (JavaScript-rendered)

For sites that use JavaScript to load content, you need a headless browser:

```
[Schedule Trigger]
    ↓
[HTTP Request to Browserless]
    ↓
[Parse JSON Response]
    ↓
[Extract Data]
    ↓
[Store Results]
```

**Using Browserless.io:**

```javascript
// HTTP Request Node
{
  "method": "POST",
  "url": "https://chrome.browserless.io/content",
  "headers": {
    "Content-Type": "application/json"
  },
  "body": {
    "url": "https://example.com/dynamic-page",
    "waitFor": 2000,
    "gotoOptions": {
      "waitUntil": "networkidle2"
    }
  },
  "authentication": {
    "type": "headerAuth",
    "headerAuth": {
      "name": "Authorization",
      "value": "Bearer YOUR_API_KEY"
    }
  }
}
```

---

## Real-World Example: Property Value Scraper

### Use Case
Automatically scrape Zillow for property values to update estate asset valuations.

### Workflow

```
[Schedule: Daily at 9 AM]
    ↓
[Get Properties from Database]
    ↓
[Loop Through Properties]
    ↓
[HTTP Request to Zillow]
    ↓
[Extract Property Data]
    ↓
[Compare with Previous Value]
    ↓
[If Changed] → [Update Database] → [Send Alert]
    ↓
[Log Results]
```

### Implementation

#### Step 1: Get Properties
```javascript
// Database Query Node
SELECT 
  id, 
  address, 
  last_value, 
  last_checked 
FROM estate_properties 
WHERE status = 'active'
```

#### Step 2: Build Zillow URL
```javascript
// Code Node
const address = $json.address;
const encoded = encodeURIComponent(address);
return {
  json: {
    ...json,
    zillowUrl: `https://www.zillow.com/homes/${encoded}_rb/`
  }
};
```

#### Step 3: Scrape Zillow
```javascript
// HTML Extract Node
const $ = cheerio.load($input.item.json.html);

const price = $('.price').text().trim();
const zestimate = $('.zestimate-value').text().trim();
const bedrooms = $('[data-label="Bedrooms"]').text().trim();
const bathrooms = $('[data-label="Bathrooms"]').text().trim();
const sqft = $('[data-label="Square Feet"]').text().trim();

return [{
  json: {
    propertyId: $json.id,
    address: $json.address,
    currentValue: parseInt(price.replace(/[^0-9]/g, '')),
    zestimate: parseInt(zestimate.replace(/[^0-9]/g, '')),
    bedrooms: parseInt(bedrooms),
    bathrooms: parseFloat(bathrooms),
    sqft: parseInt(sqft.replace(/[^0-9]/g, '')),
    scrapedAt: new Date().toISOString()
  }
}];
```

#### Step 4: Detect Changes
```javascript
// IF Node
const oldValue = $json.last_value;
const newValue = $json.currentValue;
const changePercent = ((newValue - oldValue) / oldValue) * 100;

return {
  json: {
    ...$json,
    valueChanged: Math.abs(changePercent) > 5, // Alert if >5% change
    changePercent: changePercent.toFixed(2)
  }
};
```

#### Step 5: Send Alert
```javascript
// Slack Node
{
  "channel": "#estate-alerts",
  "text": `🏠 Property Value Update\n\nAddress: ${$json.address}\nOld Value: $${$json.last_value.toLocaleString()}\nNew Value: $${$json.currentValue.toLocaleString()}\nChange: ${$json.changePercent}%\n\nAction Required: Update asset valuation in estate records.`
}
```

---

## Best Practices

### 1. Respect Robots.txt
```javascript
// Check robots.txt before scraping
const robotsUrl = new URL('/robots.txt', targetUrl).href;
// Parse and respect rules
```

### 2. Add Delays Between Requests
```javascript
// Wait Node
{
  "unit": "seconds",
  "amount": 2
}
```

### 3. Use User-Agent Headers
```javascript
// HTTP Request Headers
{
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
}
```

### 4. Handle Errors Gracefully
```javascript
// Error Trigger Node
{
  "errorWorkflow": "error-handler-workflow",
  "continueOnFail": true
}
```

### 5. Cache Results
```javascript
// Check if data was scraped recently
const cacheKey = `scrape_${url}_${date}`;
// Store in Redis or database
```

---

## Data Storage Options

### Option 1: PostgreSQL
```javascript
// Postgres Node
INSERT INTO scraped_data (
  url, 
  title, 
  content, 
  scraped_at
) VALUES (
  '{{ $json.url }}',
  '{{ $json.title }}',
  '{{ $json.content }}',
  NOW()
)
ON CONFLICT (url) 
DO UPDATE SET 
  content = EXCLUDED.content,
  scraped_at = NOW()
```

### Option 2: Airtable
```javascript
// Airtable Node
{
  "operation": "append",
  "table": "Scraped Data",
  "fields": {
    "URL": "{{ $json.url }}",
    "Title": "{{ $json.title }}",
    "Content": "{{ $json.content }}",
    "Scraped At": "{{ $json.scrapedAt }}"
  }
}
```

### Option 3: Google Sheets
```javascript
// Google Sheets Node
{
  "operation": "append",
  "sheetId": "YOUR_SHEET_ID",
  "range": "Sheet1!A:D",
  "values": [
    [
      "{{ $json.url }}",
      "{{ $json.title }}",
      "{{ $json.content }}",
      "{{ $json.scrapedAt }}"
    ]
  ]
}
```

---

## Anti-Scraping Bypass Techniques

### 1. Rotate User Agents
```javascript
const userAgents = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64)...',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)...',
  'Mozilla/5.0 (X11; Linux x86_64)...'
];

const randomUA = userAgents[Math.floor(Math.random() * userAgents.length)];
```

### 2. Use Proxies
```javascript
// HTTP Request Node
{
  "proxy": "http://proxy-server:8080",
  "proxyAuthentication": {
    "username": "user",
    "password": "pass"
  }
}
```

### 3. Handle CAPTCHAs
```javascript
// Use 2Captcha or Anti-Captcha service
{
  "method": "POST",
  "url": "https://2captcha.com/in.php",
  "body": {
    "key": "YOUR_API_KEY",
    "method": "userrecaptcha",
    "googlekey": "SITE_KEY",
    "pageurl": "TARGET_URL"
  }
}
```

---

## Monitoring & Alerts

### Setup Monitoring Workflow

```
[Schedule: Every Hour]
    ↓
[Check Last Scrape Time]
    ↓
[IF: Last scrape > 24 hours ago]
    ↓
[Send Alert to Slack]
    ↓
[Log to Database]
```

### Alert Configuration
```javascript
// Slack Notification
{
  "channel": "#monitoring",
  "text": "⚠️ Web Scraper Alert\n\nWorkflow: Property Value Scraper\nStatus: Failed\nLast Success: 25 hours ago\nError: Connection timeout\n\nAction: Check workflow and restart if needed.",
  "attachments": [
    {
      "color": "danger",
      "fields": [
        {
          "title": "Workflow ID",
          "value": "{{ $workflow.id }}",
          "short": true
        },
        {
          "title": "Error Count",
          "value": "{{ $json.errorCount }}",
          "short": true
        }
      ]
    }
  ]
}
```

---

## Performance Optimization

### 1. Parallel Processing
```javascript
// Split In Batches Node
{
  "batchSize": 10,
  "options": {
    "reset": false
  }
}
```

### 2. Caching Strategy
```javascript
// Redis Node - Check Cache
{
  "operation": "get",
  "key": "scrape_{{ $json.url }}"
}

// If cache miss, scrape and store
{
  "operation": "set",
  "key": "scrape_{{ $json.url }}",
  "value": "{{ $json.content }}",
  "ttl": 86400 // 24 hours
}
```

### 3. Selective Scraping
```javascript
// Only scrape if data is stale
const lastUpdate = new Date($json.last_updated);
const now = new Date();
const hoursSinceUpdate = (now - lastUpdate) / (1000 * 60 * 60);

if (hoursSinceUpdate < 24) {
  return { json: { skip: true } };
}
```

---

## Legal & Ethical Considerations

### ✅ DO:
- Read and respect robots.txt
- Add delays between requests
- Use official APIs when available
- Cache results to minimize requests
- Identify your bot with User-Agent
- Respect rate limits
- Only scrape public data

### ❌ DON'T:
- Scrape personal/private data
- Ignore robots.txt
- Overwhelm servers with requests
- Bypass authentication
- Scrape copyrighted content
- Violate terms of service
- Use scraped data commercially without permission

---

## Deployment

### Self-Hosted n8n
```bash
# Docker Compose
version: '3.8'
services:
  n8n:
    image: n8nio/n8n
    ports:
      - "5678:5678"
    environment:
      - N8N_BASIC_AUTH_ACTIVE=true
      - N8N_BASIC_AUTH_USER=admin
      - N8N_BASIC_AUTH_PASSWORD=your_password
      - N8N_HOST=your-domain.com
      - N8N_PROTOCOL=https
      - NODE_ENV=production
    volumes:
      - n8n_data:/home/node/.n8n
    restart: unless-stopped

volumes:
  n8n_data:
```

### n8n Cloud
- Sign up at n8n.cloud
- Import workflow JSON
- Configure credentials
- Activate workflow

---

## Example Workflows (JSON)

### Simple Court Case Scraper
```json
{
  "name": "Court Case Scraper",
  "nodes": [
    {
      "parameters": {
        "rule": {
          "interval": [{"field": "hours", "hoursInterval": 6}]
        }
      },
      "name": "Schedule Trigger",
      "type": "n8n-nodes-base.scheduleTrigger",
      "position": [250, 300]
    },
    {
      "parameters": {
        "url": "https://court.example.com/cases",
        "options": {}
      },
      "name": "HTTP Request",
      "type": "n8n-nodes-base.httpRequest",
      "position": [450, 300]
    },
    {
      "parameters": {
        "jsCode": "// Parse HTML and extract data\\nconst $ = cheerio.load($input.item.json.body);\\nconst cases = [];\\n$('.case').each((i, el) => {\\n  cases.push({\\n    number: $(el).find('.number').text(),\\n    status: $(el).find('.status').text()\\n  });\\n});\\nreturn cases.map(c => ({json: c}));"
      },
      "name": "Code",
      "type": "n8n-nodes-base.code",
      "position": [650, 300]
    }
  ],
  "connections": {
    "Schedule Trigger": {
      "main": [[{"node": "HTTP Request", "type": "main", "index": 0}]]
    },
    "HTTP Request": {
      "main": [[{"node": "Code", "type": "main", "index": 0}]]
    }
  }
}
```

---

## Troubleshooting

### Common Issues

**1. "Request Timeout"**
- Increase timeout in HTTP Request node
- Check if website is accessible
- Try different proxy

**2. "Cannot Parse HTML"**
- Verify HTML structure hasn't changed
- Check if site uses JavaScript rendering
- Use browser developer tools to inspect

**3. "Rate Limited"**
- Add delays between requests
- Use rotating proxies
- Reduce scraping frequency

**4. "Empty Results"**
- Verify CSS selectors are correct
- Check if site structure changed
- Inspect raw HTML response

---

## Next Steps

1. **Start Simple** - Build a basic scraper first
2. **Test Thoroughly** - Verify data extraction
3. **Add Error Handling** - Handle failures gracefully
4. **Monitor Performance** - Track success rates
5. **Scale Gradually** - Add more sources slowly

---

## Resources

- n8n Documentation: https://docs.n8n.io
- Cheerio Docs: https://cheerio.js.org
- CSS Selectors: https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Selectors
- Regex Testing: https://regex101.com
- n8n Community: https://community.n8n.io

---

## Conclusion

n8n makes web scraping accessible without requiring extensive coding knowledge. The visual workflow builder, combined with powerful nodes like HTTP Request and Code, enables you to build sophisticated scraping agents that can:

- Monitor websites automatically
- Extract structured data
- Store results in databases
- Send alerts on changes
- Run on schedules

Start with simple workflows and gradually add complexity as needed. Always respect website terms of service and scraping best practices.

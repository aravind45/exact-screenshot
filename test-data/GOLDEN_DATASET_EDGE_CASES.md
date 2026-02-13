# Golden Dataset: 300+ Edge Cases for ExpectedEstate Testing

## Purpose
Comprehensive test scenarios covering every edge case in estate settlement to ensure robust handling of real-world complexity.

---

## Category 1: Registration & User Onboarding (50 cases)

### Email Validation
1. Valid email: user@example.com
2. Email with plus: user+test@example.com
3. Email with dots: first.last@example.com
4. Email with subdomain: user@mail.example.com
5. International domain: user@example.co.uk
6. New TLD: user@example.tech
7. Very long email: verylongemailaddressthatexceedscommonlimits@example.com
8. Email with numbers: user123@example.com
9. Email with hyphens: first-last@example.com
10. Missing @ symbol: userexample.com
11. Multiple @ symbols: user@@example.com
12. Missing domain: user@
13. Missing username: @example.com
14. Spaces in email: user @example.com
15. Special characters: user!#$%@example.com
16. Emoji in email: user😀@example.com
17. Trailing dot: user@example.com.
18. Leading dot: .user@example.com
19. Double dots: user..name@example.com
20. IP address domain: user@192.168.1.1

### Password Requirements
21. Minimum length (8 chars): Pass123!
22. Too short (7 chars): Pass12!
23. No uppercase: password123!
24. No lowercase: PASSWORD123!
25. No numbers: Password!!!
26. No special chars: Password123
27. All requirements met: SecurePass123!
28. Very long password (100+ chars): [100 char string]
29. Unicode characters: Pässwörd123!
30. Emoji password: Pass😀word123!
31. Spaces in password: Pass word 123!
32. Common password: Password123!
33. Sequential numbers: Pass12345678!
34. Keyboard pattern: Qwerty123!
35. Repeated characters: Passssss123!

### Name Fields
36. Single name: Madonna
37. Hyphenated name: Mary-Jane Smith
38. Multiple middle names: John Paul George Ringo Starr
39. Name with suffix: John Smith Jr.
40. Name with prefix: Dr. Jane Doe
41. Name with apostrophe: O'Brien
42. Name with accent: José García
43. Very long name (50+ chars): [50 char name]
44. Name with numbers: John Smith 3rd
45. Name with special chars: Mary-Anne O'Brien-Smith III
46. Single letter name: X
47. Name with periods: J.R.R. Tolkien
48. All caps name: JOHN SMITH
49. All lowercase name: john smith
50. Name with emoji: John 😀 Smith

---

## Category 2: Estate Discovery & Classification (50 cases)

### Estate Value Ranges
51. Micro estate: $5,000
52. Small estate threshold: $184,500 (CA)
53. Just above small estate: $184,501
54. Medium estate: $500,000
55. Large estate: $2,000,000
56. Very large estate: $10,000,000
57. Ultra-high net worth: $50,000,000
58. Negative value (debts exceed assets): -$50,000
59. Zero value: $0
60. Decimal values: $184,500.50
61. Very precise: $184,500.99
62. Rounded estimate: $500,000 (user unsure)
63. Range provided: $400,000-$600,000
64. Unknown value: null
65. Extremely large: $1,000,000,000

### State Jurisdictions
66. California (primary)
67. New York
68. Texas
69. Florida
70. Alaska (community property)
71. Louisiana (civil law)
72. Multi-state estate (CA + NY)
73. International assets (US + Mexico)
74. Tribal land jurisdiction
75. US territory (Puerto Rico)
76. Military base (federal jurisdiction)
77. Deceased lived abroad, assets in US
78. Deceased lived in US, assets abroad
79. Multiple properties in different states
80. Moved states shortly before death

### Trust Structures
81. No trust
82. Revocable living trust (fully funded)
83. Revocable living trust (partially funded)
84. Irrevocable trust
85. Testamentary trust (created by will)
86. Special needs trust
87. Charitable remainder trust
88. QTIP trust (marital)
89. Generation-skipping trust
90. Pet trust
91. Spendthrift trust
92. Blind trust
93. Multiple trusts
94. Trust with missing documents
95. Trust created in different state
96. Trust with deceased trustee
97. Trust with corporate trustee
98. Trust amendment conflicts
99. Trust with pour-over will
100. Trust with no-contest clause

---

## Category 3: Will & Testament (40 cases)

### Will Validity
101. Valid holographic will (handwritten)
102. Typed will with witnesses
103. Notarized will
104. Self-proving will (affidavit)
105. Will with codicil (amendment)
106. Multiple conflicting wills
107. Will with missing pages
108. Will with crossed-out sections
109. Will with margin notes
110. Unsigned will
111. Will signed under duress (alleged)
112. Will with only one witness (needs 2)
113. Will with interested witnesses
114. Will created in different state
115. Foreign will (different country)
116. Oral will (nuncupative)
117. Joint will (two people)
118. Mutual wills (reciprocal)
119. Will with no-contest clause
120. Will with in terrorem clause

### Will Contents
121. Specific bequests (jewelry, car, etc.)
122. Residuary clause (everything else)
123. Disinheritance clause
124. Conditional gifts (if X, then Y)
125. Life estate provisions
126. Trust provisions within will
127. Charitable bequests
128. Pet care provisions
129. Funeral instructions
130. Digital asset provisions
131. Business succession provisions
132. Intellectual property provisions
133. Forgiveness of debts
134. Appointment of guardian (minors)
135. Appointment of executor
136. Alternate executor named
137. Co-executors named
138. Corporate executor named
139. Executor compensation specified
140. Bond waiver for executor

---

## Category 4: Asset Ledger (60 cases)

### Real Property
141. Single-family home (primary residence)
142. Vacation home (second property)
143. Rental property (income-producing)
144. Commercial property
145. Undeveloped land
146. Timeshare
147. Mobile home
148. Houseboat
149. Property with mortgage
150. Property with reverse mortgage
151. Property with home equity line
152. Property with tax lien
153. Property in foreclosure
154. Property with title dispute
155. Property with easement
156. Property with life estate
157. Property held as joint tenants
158. Property held as tenants in common
159. Property held as community property
160. Property in trust
161. Property in LLC
162. Property in partnership
163. Property with co-owner (non-spouse)
164. Property in different state
165. Property in different country
166. Property with unpaid property taxes
167. Property with HOA liens
168. Property with mechanic's liens
169. Property with environmental issues
170. Property with zoning violations

### Financial Accounts
171. Checking account (sole owner)
172. Savings account
173. Money market account
174. Certificate of deposit (CD)
175. Joint checking account
176. Joint savings account
177. Payable-on-death (POD) account
178. Transfer-on-death (TOD) account
179. Account with beneficiary designation
180. Account with no beneficiary
181. Frozen account
182. Overdrawn account
183. Dormant account
184. Foreign bank account
185. Cryptocurrency exchange account
186. Online-only bank account
187. Credit union account
188. Account with automatic payments
189. Account with direct deposits
190. Account with safe deposit box

### Investment Accounts
191. Individual brokerage account
192. Joint brokerage account
193. IRA (traditional)
194. Roth IRA
195. 401(k)
196. 403(b)
197. Pension plan
198. Annuity (immediate)
199. Annuity (deferred)
200. Stocks (individual)
201. Bonds (individual)
202. Mutual funds
203. ETFs
204. Options
205. Futures
206. Cryptocurrency (Bitcoin, Ethereum, etc.)
207. NFTs
208. Private equity
209. Hedge fund
210. Real estate investment trust (REIT)
211. Account with margin loan
212. Account with outstanding trades
213. Account with beneficiary
214. Account without beneficiary
215. Inherited IRA
216. Stretch IRA
217. Required minimum distributions (RMDs) due
218. Account with tax withholding
219. Account with foreign holdings
220. Account with restricted stock

### Personal Property
221. Vehicle (car)
222. Vehicle (motorcycle)
223. Vehicle (RV)
224. Vehicle (boat)
225. Vehicle (airplane)
226. Vehicle with loan
227. Vehicle with lease
228. Jewelry (valuable)
229. Artwork
230. Antiques
231. Collectibles (coins, stamps, etc.)
232. Firearms
233. Furniture
234. Electronics
235. Clothing
236. Books
237. Musical instruments
238. Sports equipment
239. Tools
240. Pets

### Business Interests
241. Sole proprietorship
242. Partnership (general)
243. Partnership (limited)
244. LLC (single-member)
245. LLC (multi-member)
246. S-Corporation
247. C-Corporation
248. Professional corporation
249. Franchise
250. Stock in private company
251. Stock options (vested)
252. Stock options (unvested)
253. Business with buy-sell agreement
254. Business with key person insurance
255. Business with operating agreement
256. Business with partnership agreement
257. Business with shareholder agreement
258. Business with debt
259. Business with pending litigation
260. Business with employees

### Digital Assets
261. Email accounts
262. Social media accounts (Facebook, Twitter, etc.)
263. Cloud storage (Google Drive, Dropbox, etc.)
264. Domain names
265. Websites
266. Blogs
267. YouTube channels
268. Podcasts
269. Digital photos
270. Digital music
271. Digital books
272. Digital movies
273. Gaming accounts
274. Cryptocurrency wallets
275. NFT collections
276. Intellectual property (copyrights)
277. Intellectual property (trademarks)
278. Intellectual property (patents)
279. Royalty streams
280. Affiliate marketing accounts

---

## Category 5: Liabilities & Debts (40 cases)

### Secured Debts
281. Mortgage (primary residence)
282. Mortgage (second home)
283. Home equity loan
284. Home equity line of credit (HELOC)
285. Auto loan
286. Boat loan
287. RV loan
288. Business loan (secured)
289. Margin loan (investment account)
290. Pawn shop loan

### Unsecured Debts
291. Credit card debt
292. Personal loan
293. Medical bills
294. Student loans (federal)
295. Student loans (private)
296. Payday loans
297. Tax debt (federal)
298. Tax debt (state)
299. Tax debt (property)
300. Utility bills
301. Phone bills
302. Internet bills
303. Subscription services
304. Gym memberships
305. Country club dues
306. HOA fees
307. Legal fees
308. Accounting fees
309. Funeral expenses (prepaid)
310. Funeral expenses (unpaid)

### Special Debt Situations
311. Debt in collection
312. Debt with co-signer
313. Debt with guarantor
314. Debt in bankruptcy
315. Debt discharged in bankruptcy
316. Debt with judgment
317. Debt with wage garnishment
318. Debt with lien
319. Debt statute of limitations expired
320. Fraudulent debt claims

---

## Category 6: Beneficiaries & Heirs (40 cases)

### Beneficiary Types
321. Spouse (surviving)
322. Ex-spouse (divorced)
323. Children (adult)
324. Children (minor)
325. Stepchildren
326. Adopted children
327. Foster children
328. Grandchildren
329. Great-grandchildren
330. Parents
331. Siblings
332. Half-siblings
333. Step-siblings
334. Nieces/nephews
335. Cousins
336. Friends
337. Charities
338. Trusts
339. Estates
340. Businesses
341. Pets (via pet trust)

### Beneficiary Complications
342. Beneficiary predeceased
343. Beneficiary disclaims inheritance
344. Beneficiary is incapacitated
345. Beneficiary is minor
346. Beneficiary is in prison
347. Beneficiary is missing
348. Beneficiary is foreign national
349. Beneficiary is undocumented
350. Beneficiary has special needs
351. Beneficiary is estranged
352. Beneficiary contests will
353. Beneficiary files lawsuit
354. Multiple beneficiaries (equal shares)
355. Multiple beneficiaries (unequal shares)
356. Contingent beneficiaries
357. Per stirpes distribution
358. Per capita distribution
359. Right of representation
360. Anti-lapse statute applies

---

## Category 7: Probate Process & Timeline (30 cases)

### Filing Scenarios
361. File within 30 days of death
362. File 6 months after death
363. File 1 year after death
364. File 3 years after death (statute of limitations)
365. Emergency petition (urgent)
366. Petition with will
367. Petition without will (intestate)
368. Petition with lost will
369. Petition with destroyed will
370. Petition with foreign will
371. Petition with holographic will
372. Petition with multiple wills
373. Petition with codicil
374. Petition with trust
375. Petition for small estate
376. Petition for spousal property
377. Petition for summary administration
378. Petition for ancillary probate (out-of-state property)
379. Petition with will contest
380. Petition with creditor claims

### Timeline Complications
381. Court hearing delayed
382. Court hearing continued
383. Notice requirements not met
384. Publication requirements not met
385. Creditor claim period extended
386. Inventory deadline missed
387. Accounting deadline missed
388. Distribution delayed (pending litigation)
389. Distribution delayed (tax issues)
390. Final distribution delayed (missing beneficiary)

---

## Category 8: Special Situations (30 cases)

### Family Dynamics
391. Blended family (second marriage)
392. Estranged family members
393. Family dispute over assets
394. Family dispute over executor
395. Family dispute over will validity
396. Undue influence alleged
397. Lack of capacity alleged
398. Elder abuse alleged
399. Fraud alleged
400. Forgery alleged

### Complex Estates
401. Estate with business interests
402. Estate with international assets
403. Estate with pending lawsuit
404. Estate with environmental liabilities
405. Estate with tax audit
406. Estate with bankruptcy
407. Estate with Medicaid recovery
408. Estate with veterans benefits
409. Estate with Social Security benefits
410. Estate with life insurance
411. Estate with annuities
412. Estate with retirement accounts
413. Estate with digital assets
414. Estate with intellectual property
415. Estate with firearms
416. Estate with hazardous materials
417. Estate with livestock
418. Estate with agricultural property
419. Estate with mineral rights
420. Estate with water rights

---

## Usage Instructions

### For Testing:
1. **Unit Tests**: Use individual cases to test specific functions
2. **Integration Tests**: Combine cases to test workflows
3. **E2E Tests**: Use complete scenarios from registration through distribution
4. **Load Tests**: Use all 420 cases to test system performance

### For Development:
1. **Validation**: Ensure all edge cases are handled gracefully
2. **Error Messages**: Provide helpful messages for each scenario
3. **User Experience**: Design UI to accommodate complex situations
4. **Documentation**: Reference cases in help documentation

### For QA:
1. **Manual Testing**: Walk through each scenario
2. **Automated Testing**: Create test scripts for each case
3. **Regression Testing**: Verify fixes don't break edge cases
4. **User Acceptance Testing**: Have real users test complex scenarios

---

## Test Data Generation

### Realistic Names:
- John Smith, Mary Johnson, Robert Williams, Patricia Brown
- José García, María Rodríguez, Wei Chen, Priya Patel
- O'Brien, McDonald, Van Der Berg, De La Cruz

### Realistic Addresses:
- 123 Main St, Anytown, CA 90210
- 456 Oak Ave, Los Angeles, CA 90001
- 789 Pine Rd, San Francisco, CA 94102

### Realistic Dates:
- Date of death: 2024-01-15
- Date of birth: 1950-06-20
- Date of will: 2020-03-10

### Realistic Values:
- Estate value: $500,000
- Home value: $750,000
- Checking account: $25,000
- Credit card debt: $5,000

---

## Priority Testing Order

### Phase 1 (Critical - Test First):
- Registration (cases 1-50)
- Estate classification (cases 51-100)
- Asset ledger basics (cases 141-200)

### Phase 2 (Important - Test Second):
- Will validation (cases 101-140)
- Liabilities (cases 281-320)
- Beneficiaries (cases 321-360)

### Phase 3 (Complex - Test Third):
- Special situations (cases 391-420)
- Timeline complications (cases 381-390)
- Digital assets (cases 261-280)

---

## Expected Behavior for Each Case

Document expected system behavior:
- ✅ **Accept**: System handles gracefully
- ⚠️ **Warn**: System accepts but shows warning
- ❌ **Reject**: System rejects with clear error message
- 🔄 **Redirect**: System redirects to appropriate flow
- 📞 **Escalate**: System suggests professional help

---

## Continuous Improvement

As you encounter real user scenarios:
1. Add new edge cases to this dataset
2. Update expected behaviors
3. Create regression tests
4. Document lessons learned
5. Share with team

---

**Total Cases: 420 edge cases across 8 categories**

This golden dataset ensures ExpectedEstate handles the full complexity of real-world estate settlement.

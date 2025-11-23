# Architecture Documentation

## System Overview

The Poll System is a fully serverless application built on AWS and deployed on Vercel. It enables administrators to create polls with recurring schedules, generate secure access keys for voters, and collect suggestions for future poll options.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT (Browser)                         │
└────────────┬────────────────────────────────────┬────────────────┘
             │                                    │
             │ Public Routes                      │ Admin Routes
             │                                    │ (Authenticated)
             ▼                                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                    VERCEL (Next.js)                              │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                BFF Layer (API Routes)                     │   │
│  │  • NextAuth.js (Cognito Provider)                        │   │
│  │  • Public: /api/vote, /api/poll/[id], /api/suggestions  │   │
│  │  • Admin: /api/admin/polls, /api/admin/access-keys      │   │
│  └──────────────────────────────────────────────────────────┘   │
└────────────┬────────────────────────────────────┬────────────────┘
             │ API Key                            │ Bearer Token
             │                                    │ (Cognito JWT)
             ▼                                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                  AWS API GATEWAY (HTTP API)                      │
│  ┌──────────────────┐              ┌──────────────────┐         │
│  │  Public Routes   │              │   Admin Routes   │         │
│  │  (API Key Auth)  │              │ (Cognito Author.)│         │
│  └──────────────────┘              └──────────────────┘         │
└────────────┬────────────────────────────────────┬────────────────┘
             │                                    │
             ▼                                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                      AWS LAMBDA FUNCTIONS                        │
│  ┌──────────────┬──────────────┬──────────────┬──────────────┐  │
│  │    Polls     │  Access Keys │    Voting    │ Suggestions  │  │
│  │   - Create   │  - Generate  │    - Vote    │  - Submit    │  │
│  │   - List     │              │  - Results   │  - Manage    │  │
│  │   - Get      │              │              │              │  │
│  └──────────────┴──────────────┴──────────────┴──────────────┘  │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                  Recurrence Lambda                        │   │
│  │   • Triggered weekly by EventBridge                      │   │
│  │   • Closes active instances                              │   │
│  │   • Creates new instances with approved suggestions      │   │
│  └──────────────────────────────────────────────────────────┘   │
└────────────┬──────────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────────┐
│                         DYNAMODB                                 │
│  ┌──────────────┬──────────────┬──────────────┬──────────────┐  │
│  │    Polls     │PollInstances │ AccessKeys   │    Votes     │  │
│  │   PK: PollID │PK: PollID    │ PK: KeyID    │PK: InstID    │  │
│  │              │SK: InstID    │GSI: PollID   │SK: KeyID     │  │
│  └──────────────┴──────────────┴──────────────┴──────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    Suggestions                            │   │
│  │               PK: PollID, SK: SuggestionID                │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                      AWS COGNITO                                 │
│                      User Pool: Admin Authentication             │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    AWS EVENTBRIDGE                               │
│         Rule: Weekly (Monday 00:00 UTC) → Recurrence Lambda      │
└─────────────────────────────────────────────────────────────────┘
```

## Data Model

### Polls Table
Primary partition key: `PK` (PollID)

```json
{
  "PK": "poll-uuid",
  "Title": "Weekly Lunch Poll",
  "Description": "Where should we eat?",
  "IsRecurring": true,
  "Frequency": "WEEKLY",
  "AllowSuggestions": true,
  "CreatedAt": "2024-01-01T00:00:00Z",
  "UpdatedAt": "2024-01-01T00:00:00Z"
}
```

### PollInstances Table
Composite key: `PK` (PollID), `SK` (InstanceID)

```json
{
  "PK": "poll-uuid",
  "SK": "2024-W48",
  "Status": "Active",
  "OptionsSnapshot": [
    { "id": "opt-1", "text": "Pizza", "votes": 0 },
    { "id": "opt-2", "text": "Sushi", "votes": 0 }
  ],
  "CreatedAt": "2024-01-01T00:00:00Z",
  "ClosedAt": null
}
```

GSI: `StatusIndex` (Status, SK)

### AccessKeys Table
Primary partition key: `PK` (KeyID)

```json
{
  "PK": "key-uuid",
  "PollID": "poll-uuid",
  "MaxUses": 1,
  "CurrentUses": 0,
  "ExpiryDate": 1735689600,
  "CreatedAt": "2024-01-01T00:00:00Z"
}
```

GSI: `PollIDIndex` (PollID)
TTL: `ExpiryDate` (Unix timestamp)

### Votes Table
Composite key: `PK` (PollInstanceID), `SK` (KeyID)

```json
{
  "PK": "2024-W48",
  "SK": "key-uuid",
  "OptionID": "opt-1",
  "VoterName": "John Doe",
  "Timestamp": "2024-01-01T12:00:00Z"
}
```

### Suggestions Table
Composite key: `PK` (PollID), `SK` (SuggestionID)

```json
{
  "PK": "poll-uuid",
  "SK": "suggestion-uuid",
  "Text": "Mexican Food",
  "Status": "Pending",
  "TargetWeek": "next",
  "CreatedAt": "2024-01-01T00:00:00Z",
  "UsedAt": null
}
```

GSI: `StatusIndex` (Status, PK)

## Security Model

### Frontend Layer (Vercel)
- **Public Pages**: `/`, `/vote` - No authentication required
- **Admin Pages**: `/admin/*` - Protected by NextAuth.js middleware
- **API Routes**: Act as BFF, hiding AWS endpoints from client

### API Layer (AWS API Gateway)
- **Public Routes**: Protected by API Key (only Vercel knows the key)
- **Admin Routes**: Protected by Cognito JWT Authorizer
- **CORS**: Configured to allow requests from Vercel domain

### Lambda Layer
- **IAM Roles**: Each Lambda has minimum required permissions
- **VPC**: Not required (DynamoDB is accessed via AWS PrivateLink)
- **Environment Variables**: Table names, no secrets

### Data Layer (DynamoDB)
- **Encryption**: At-rest encryption enabled by default
- **Backups**: Point-in-time recovery enabled
- **TTL**: Automatic deletion of expired access keys

## Voting Flow

1. Admin creates a poll → `CreatePollLambda`
2. Admin generates access keys → `GenerateKeysLambda`
3. Admin distributes keys (manually via CSV/email)
4. User receives voting link: `https://poll.vercel.app/vote?pollId=X&key=Y`
5. User loads poll → `GetPollDetailsLambda` fetches active instance
6. User selects option and submits → `VoteLambda`:
   - Validates access key exists and is not expired
   - Checks if key has remaining uses
   - Checks if user already voted in this instance (prevent double voting)
   - Creates vote record
   - Increments key usage count
7. User can optionally submit suggestion → `SubmitSuggestionLambda`

## Recurrence Flow

1. EventBridge triggers `RecurrenceLambda` every Monday at 00:00 UTC
2. Lambda queries all polls with `IsRecurring = true`
3. For each recurring poll:
   - Closes current active instance (Status → "Closed")
   - Queries approved suggestions
   - Merges base options + approved suggestions
   - Creates new active instance with merged options
   - Marks suggestions as "Used"
4. Access keys remain valid (linked to PollID, not instance)
5. Next time a user votes, they get the new instance automatically

## Key Design Decisions

### Why BFF Pattern?
- Hides AWS API endpoints from client (security)
- Allows server-side token validation
- Simplifies client-side code
- Enables rate limiting and caching in the future

### Why UUID-based Access Keys?
- Stateless (no session management)
- Secure (128-bit entropy)
- Shareable via simple URL
- Can be revoked by TTL or uses

### Why Composite Keys in Votes Table?
- `PK = PollInstanceID, SK = KeyID` prevents double voting
- Even if a key has multiple uses, can only vote once per week
- Efficient query pattern for results aggregation

### Why Separate Polls and PollInstances?
- Polls = configuration (recurring, suggestions, etc.)
- PollInstances = actual voting rounds
- Enables historical tracking
- Supports weekly rotation with different options

## Scalability

### Current Limits
- **DynamoDB**: Unlimited throughput (On-Demand mode)
- **Lambda**: 1,000 concurrent executions per region (soft limit)
- **API Gateway**: 10,000 requests/second (soft limit)

### Bottlenecks
- **Single Access Key Usage**: High contention on UpdateItem if many users share a key
  - Mitigation: Use conditional updates with CurrentUses check
- **Votes Query**: Linear scan for results aggregation
  - Mitigation: Implement caching or pre-aggregation

### Optimization Opportunities
1. **Caching**: Add CloudFront in front of API Gateway for GET requests
2. **Batch Voting**: Allow multiple votes in a single request (for admin testing)
3. **Real-time Results**: Add WebSockets via API Gateway WebSocket API
4. **Analytics**: Stream DynamoDB changes to S3 for analysis

## Cost Breakdown

### Monthly Costs (Estimate for 10,000 votes)

**AWS Free Tier (First 12 months):**
- DynamoDB: 25GB storage, 200M requests
- Lambda: 1M requests, 400K GB-seconds
- API Gateway: 1M requests
- Cognito: 50K MAUs

**Beyond Free Tier:**
- DynamoDB: ~$0.50/month (10K votes × 3 operations × $0.25 per 1M reads)
- Lambda: ~$0.20/month (10K invocations + compute)
- API Gateway: ~$0.01/month (10K requests)
- Data Transfer: ~$0.00 (< 1GB)

**Total: $0.00 - $0.75/month**

**Vercel:**
- Hobby: Free (personal projects)
- Pro: $20/month (commercial use)


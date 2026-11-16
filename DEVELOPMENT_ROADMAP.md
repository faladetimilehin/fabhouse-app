# Fabhouse App - Complete Development Roadmap

**Status**: In Development  
**Timeline**: 12 Weeks (All-In Approach)  
**Last Updated**: 2026-08-14

---

## 📊 Overview

This roadmap covers implementation of all major features across 6 phases, organized by user impact and technical dependencies.

**Team**: 1 developer (aggressive timeline, prioritize MVP quality)

---

## 🎯 Phase 1: MVP Search & Discovery (Week 1-2)

### Goals
- Enable users to find properties efficiently
- Improve agent communication
- Prepare foundation for advanced features

### Features

#### 1.1 Advanced Search Filters ⭐ CRITICAL
**Files to create/modify:**
- `app/api/properties/search/route.ts` - Advanced search endpoint
- `components/SearchFilters.tsx` - Filter UI component
- `app/listings/page.tsx` - Integrate filters

**Implementation:**
```
Filter by:
- Price range (min/max)
- Bedrooms/Bathrooms
- Property type (house, flat, land, commercial)
- Purpose (sale/rent)
- Availability
- Featured only
- Location/State/LGA
```

**Database indexing needed**:
```
Property: { price: 1, bedrooms: 1, type: 1, location: 1 }
```

---

#### 1.2 Recently Viewed Listings
**Files:**
- `lib/recentlyViewed.ts` - Storage logic
- `components/RecentlyViewedSection.tsx` - UI
- `app/listings/[id]/page.tsx` - Track views

**Implementation:**
- Store in localStorage (buyer) + DB (for recommendations)
- Show 6 most recent on homepage
- Clear option for users

---

#### 1.3 Email Notifications
**Files:**
- `models/NotificationPreference.ts` - New model
- `app/api/notifications/preferences/route.ts` - Endpoint
- `lib/email.ts` - Update with new templates
- `app/account/notifications/page.tsx` - Settings UI

**Trigger on:**
- New inquiry received
- Price drop on saved listings
- Search alert matches

---

#### 1.4 WhatsApp Integration Polish
**Files:**
- `lib/whatsapp.ts` - Update existing
- `app/api/inquiries/[id]/send-whatsapp/route.ts` - Send message

**Functionality:**
- Send inquiry to agent via WhatsApp
- Auto-format property details
- Clickable property links

---

### Phase 1 Status
- [ ] Search filters implemented
- [ ] Recently viewed tracking
- [ ] Notification preferences
- [ ] WhatsApp messages tested
- [ ] E2E tests for search flow

---

## 🏢 Phase 2: Agent Tools & Analytics (Week 3-4)

### Goals
- Enable agents to manage listings at scale
- Provide performance insights
- Increase agent retention

### Features

#### 2.1 Batch Upload for Agents
**Files:**
- `app/dashboard/bulk-upload/page.tsx` - Bulk upload UI
- `app/api/properties/bulk-create/route.ts` - Bulk create endpoint
- `lib/csvParser.ts` - CSV parsing logic

**Implementation:**
- Upload CSV with property details
- Validate before upload
- Show import progress/errors
- Rollback on error

**CSV Format:**
```
address,price,bedrooms,bathrooms,type,purpose,description,images
```

---

#### 2.2 Listing Templates
**Files:**
- `models/ListingTemplate.ts` - New model
- `app/dashboard/templates/page.tsx` - Template management
- `app/api/templates/route.ts` - CRUD operations

**Implementation:**
- Save listing as template
- Create new listing from template
- Edit/delete templates
- Share templates with team (future)

---

#### 2.3 Agent Analytics Dashboard
**Files:**
- `app/dashboard/analytics/page.tsx` - Analytics UI
- `app/api/admin/analytics/agent/route.ts` - Data endpoint
- `models/PropertyView.ts` - Track views
- `components/AnalyticsChart.tsx` - Charts

**Metrics:**
- Total views per listing
- Inquiries per listing
- Conversion rate (inquiries → scheduled viewings)
- Performance vs. other agents
- Revenue (if billing enabled)

---

#### 2.4 Listing Expiry & Reminders
**Files:**
- Add `expiresAt` field to Property model
- Cron job: `scripts/expiry-checker.js`
- `app/api/properties/[id]/renew/route.ts` - Renewal endpoint

**Implementation:**
- Auto-expire listings after 30 days (configurable)
- Email reminder at day 25
- One-click renewal
- Show expiry status in dashboard

---

### Phase 2 Status
- [ ] Batch upload tested
- [ ] Templates fully functional
- [ ] Analytics dashboard live
- [ ] Expiry system active

---

## 👥 Phase 3: Social & Community (Week 5-6)

### Goals
- Build trust through reviews
- Increase engagement
- Provide market insights

### Features

#### 3.1 Agent Reviews & Ratings ⭐
**Files:**
- `models/AgentReview.ts` - New model
- `app/api/agents/[id]/reviews/route.ts` - CRUD
- `components/AgentRating.tsx` - Display ratings
- `app/agents/[id]/page.tsx` - Agent profile

**Implementation:**
- 5-star rating + comment
- Only verified buyers can review
- Cannot review own agent
- Show aggregate on agent profile
- Incentivize reviews (badges)

---

#### 3.2 Save Searches with Alerts ✅ PARTIAL
**Files:**
- `models/SearchAlert.ts` - Already exists (verify)
- `app/api/search-alerts/route.ts` - Already exists (verify)
- `app/saved-searches/page.tsx` - UI
- Cron job: `scripts/search-alert-checker.js`

**Implementation:**
- Save search query
- Get daily/weekly email with new matches
- Edit/delete saved searches
- Customize alert frequency

---

#### 3.3 Map-Based Search
**Files:**
- `components/ListingsMap.tsx` - Already exists (enhance)
- `app/api/properties/by-location/route.ts` - Geo endpoint
- `app/map/page.tsx` - Full map interface

**Implementation:**
- Show all listings on map
- Click property for details
- Filter by price range on map
- Show heatmap (density by location)
- Cluster markers for performance

---

#### 3.4 Neighborhood Insights
**Files:**
- `app/api/properties/neighborhood-stats/route.ts` - Stats endpoint
- `components/NeighborhoodInsights.tsx` - Display
- `models/AreaStatistic.ts` - Store metrics

**Data:**
- Average price by area
- Property count
- Popular areas
- Rental yield data
- School/hospital/transport proximity

---

### Phase 3 Status
- [ ] Agent ratings live
- [ ] Search alerts fully tested
- [ ] Map interface interactive
- [ ] Neighborhood data updated monthly

---

## 📸 Phase 4: Advanced Listings (Week 7-8)

### Goals
- Differentiate with rich media
- Increase inquiry conversion
- Enable premium features

### Features

#### 4.1 Virtual Tours / 360° Photos
**Files:**
- `components/VirtualTourViewer.tsx` - New component
- `app/api/properties/[id]/tours/route.ts` - Upload endpoint
- `models/Property.ts` - Add tourUrl field
- Integration: Cloudinary (already used)

**Implementation:**
- Upload 360° images via Cloudinary
- Panoramic viewer (pannellum.js)
- Link multiple 360° images (room to room)
- Featured premium feature (paid)

---

#### 4.2 Video Listings Enhancement
**Files:**
- `components/VideoUploader.tsx` - Already exists (enhance)
- `components/VideoPlayer.tsx` - New player component
- Auto-generate thumbnail from video
- Show video count badge

**Implementation:**
- Upload to Cloudinary Video
- Autoplay preview (muted)
- Full video modal
- Delete video option
- Video limits by tier (free: 1, starter: 3, pro: 10)

---

#### 4.3 In-App Chat System ⭐
**Files:**
- `models/Message.ts` - New model
- `models/Conversation.ts` - New model
- `app/api/messages/route.ts` - CRUD
- `components/ChatBox.tsx` - Chat UI
- `app/messages/page.tsx` - Messages inbox

**Implementation:**
- Real-time chat (Socket.io or polling)
- Chat initiated from inquiry
- Mark read/unread
- Search messages
- Archive conversations
- Typing indicator

---

#### 4.4 Admin Fraud Detection
**Files:**
- `app/api/admin/fraud-alerts/route.ts` - Suspicious activity
- `models/SuspiciousActivity.ts` - Log model
- `app/admin/fraud-alerts/page.tsx` - Dashboard

**Detect:**
- Multiple accounts from same IP
- Suspicious listing uploads (too similar)
- Fake reviews flagged by AI
- Rapid inquiry patterns
- Price outliers

---

### Phase 4 Status
- [ ] 360° tours implemented
- [ ] Video player optimized
- [ ] Chat system live
- [ ] Fraud detection alerts active

---

## 🔐 Phase 5: Security & 2FA (Week 9)

### Goals
- Protect agent accounts
- Meet compliance requirements
- Build user trust

### Features

#### 5.1 Two-Factor Authentication (2FA)
**Files:**
- `models/User.ts` - Add 2FA fields
- `app/api/auth/2fa/setup/route.ts` - Enable 2FA
- `app/api/auth/2fa/verify/route.ts` - Verify OTP
- `app/auth/2fa-setup/page.tsx` - Setup UI
- `app/auth/2fa-verify/page.tsx` - Login OTP

**Implementation:**
- TOTP (Google Authenticator, Authy)
- Backup codes
- Mandatory for agents (optional for buyers)
- Recovery options

---

#### 5.2 Security Headers & CSRF
**Files:**
- `next.config.mjs` - Add security headers
- Create middleware for CSRF tokens
- `lib/csrf.ts` - CSRF utility

**Headers:**
```
X-Frame-Options: SAMEORIGIN
X-Content-Type-Options: nosniff
Strict-Transport-Security: max-age=31536000
Content-Security-Policy: appropriate directives
```

---

#### 5.3 Session Management
**Files:**
- `lib/auth.ts` - Update session logic
- `app/api/auth/logout-all/route.ts` - Invalidate all sessions

**Implementation:**
- Invalidate sessions on password change
- Logout all devices option
- Session activity log
- Suspicious login notifications

---

### Phase 5 Status
- [ ] 2FA mandatory for agents
- [ ] Security headers deployed
- [ ] Session invalidation working

---

## 🚀 Phase 6: Performance & Testing (Week 10-12)

### Goals
- Ensure reliability
- Optimize speed
- Document everything

### Features

#### 6.1 Database Indexing Strategy
**Files:**
- Create migration: `migrations/add-indexes.js`
- Update models with index hints

**Indexes:**
```
User: { email: 1 (unique), role: 1, createdAt: 1 }
Property: { owner: 1, type: 1, price: 1, location: 1, createdAt: -1 }
Inquiry: { property: 1, buyer: 1, agent: 1, createdAt: -1 }
Message: { conversation: 1, createdAt: -1 }
SearchAlert: { user: 1, createdAt: -1 }
```

---

#### 6.2 API Response Caching
**Files:**
- `lib/cache.ts` - Caching logic
- Update routes to use cache
- Invalidate on updates

**Caching strategy:**
- Listings (5 min cache)
- Search results (2 min)
- User profile (1 hour)
- Agent reviews (15 min)

---

#### 6.3 Unit & E2E Tests
**Files:**
- `tests/auth.spec.ts` - Auth tests (Playwright)
- `tests/search.spec.ts` - Search tests
- `tests/inquiry.spec.ts` - Inquiry flow
- Add Jest config for unit tests
- `__tests__/utilities.test.ts` - Utility tests

**Coverage targets:**
- Auth: 100%
- API routes: 80%
- Utilities: 90%

---

#### 6.4 Error Logging & Monitoring
**Files:**
- Setup Sentry (or alternative)
- `lib/errorHandler.ts` - Global error handling
- `middleware.ts` - Error middleware

**Implementation:**
- Catch and log all errors
- Performance monitoring
- User session tracking
- Error alerts

---

#### 6.5 Image Optimization
**Files:**
- `components/OptimizedImage.tsx` - New component
- Update all <img> tags to use Next.js Image
- Configure Cloudinary transformations

**Optimizations:**
- WebP format
- Responsive sizes
- Lazy loading
- Cloudinary automatic quality

---

#### 6.6 API Documentation
**Files:**
- `docs/API.md` - API endpoints
- Setup Swagger UI (optional)
- Document all endpoints with examples

---

### Phase 6 Status
- [ ] All indexes created
- [ ] Caching strategy deployed
- [ ] 90%+ test coverage
- [ ] Zero critical errors
- [ ] API docs complete

---

## 📈 Post-Launch (Week 13+)

- Monthly performance reviews
- Feature requests from users
- Expansion to other African countries
- Mobile app development
- Advanced analytics & BI

---

## 🔑 Key Technical Decisions

### Database Indexing
- MongoDB indexes on frequently queried fields
- TTL indexes for temporary data (reset tokens, sessions)

### Caching Strategy
- Redis for short-lived cache
- Fallback to in-memory cache (small scale)
- Invalidate on data changes

### Real-time Updates
- Polling for chat (simple, no infrastructure)
- Socket.io if scale requires (future)

### Image Hosting
- Cloudinary for all images (already integrated)
- Automatic optimization & CDN

### Email Service
- Resend (already integrated)
- Queue emails (Bull or similar)

### Authentication
- NextAuth + JWT (current)
- Add TOTP for 2FA (Phase 5)

---

## 🎯 Success Metrics

**After Phase 1:**
- 2x faster search queries
- 50% increase in saved searches

**After Phase 2:**
- 10x increase in agent listings
- 3x agent session duration

**After Phase 3:**
- 30% increase in inquiries
- Agent ratings avg 4.5/5

**After Phase 4:**
- 50% higher inquiry conversion (with video)
- 10 fraud alerts/month prevented

**After Phase 5:**
- 0 account takeovers
- 100% agent 2FA adoption

**After Phase 6:**
- <2s page load times
- 99.9% uptime
- Zero P1 bugs

---

## 🚦 Critical Path

```
Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5 → Phase 6

Week 1-2    3-4       5-6       7-8       9       10-12
```

**Blockers:**
- None identified
- Can work in parallel where applicable

---

## 💰 Resource Requirements

- 1 Full-stack developer
- Infrastructure (Vercel, MongoDB, Cloudinary, Resend) ✅
- Testing tools (Playwright) ✅
- Optional: Error tracking (Sentry)

---

## 📝 Next Steps

1. ✅ Phase 1 implementation starts today
2. Daily 15-min standups to track progress
3. Weekly feature review
4. Monthly roadmap adjustment

---

**Last Updated:** 2026-08-14  
**Next Review:** 2026-08-21

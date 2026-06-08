# Task: events-feature - Add Event Management (活動管理) Feature

## Agent: Z.ai Code (Main Agent)

## Summary
Successfully added a complete "活動管理" (Event Management) feature to the MCLUB CRM application.

## Changes Made

### 1. Prisma Schema (`prisma/schema.prisma`)
- Added `EventStatus` enum (DRAFT, PUBLISHED, CANCELLED, COMPLETED)
- Added `RSVPStatus` enum (PENDING, CONFIRMED, DECLINED, CHECKED_IN)
- Added `ClubEvent` model with full event fields
- Added `RSVP` model with unique constraint on [eventId, userId]
- Added `organizedEvents` and `eventRSVPs` relations to User model

### 2. API Routes
- `src/app/api/events/route.ts` - GET (list) and POST (create) events
- `src/app/api/events/[id]/route.ts` - PATCH (update) and DELETE events
- `src/app/api/events/[id]/rsvp/route.ts` - POST RSVP with upsert

### 3. Frontend (`src/app/page.tsx`)
- Added type definitions for EventStatus, RSVPStatus, ClubEvent, RSVP
- Added event status label/class maps and RSVP status labels
- Added 'events' to all 4 role sidebar menus
- Added EventList component with list view, detail view, create form, RSVP, admin actions
- Added case 'events' to renderContent switch

### 4. Seed Script (`src/app/api/seed/route.ts`)
- Added 3 sample ClubEvents
- Added 4 sample RSVPs

## API Verification
All endpoints tested and working:
- GET /api/events (role-filtered)
- POST /api/events (MCLUB_STAFF only)
- PATCH /api/events/[id] (MCLUB_STAFF only)
- DELETE /api/events/[id] (MCLUB_STAFF only)
- POST /api/events/[id]/rsvp (all authenticated users)

## Status: COMPLETED

# Enhanced Appointment System - Features Implementation

## Summary
This document outlines all the new features and improvements made to the eGuidance appointment system.

## Features Implemented

### 1. Hour-Based Time Slot System
- **Changed from**: 30-minute intervals (8:00 AM - 5:30 PM)
- **Changed to**: Hour-based slots (8:00 AM, 9:00 AM, 10:00 AM, 11:00 AM, 12:00 PM, 1:00 PM, 2:00 PM, 3:00 PM, 4:00 PM)
- **Location**: Frontend time picker now uses dropdown select instead of time input
- **Backend Validation**: Ensures only full hours (with :00 minutes) are accepted

### 2. Time Slot Blocking
- **Feature**: When a counselor is selected for a specific date, booked time slots are automatically blocked
- **Implementation**: 
  - New API endpoint: `GET /api/appointments/available-times?counselor_id=X&date=YYYY-MM-DD`
  - Frontend dynamically updates available time slots when date or counselor changes
  - Real-time validation prevents double-booking

### 3. Search Functionality for Counselors
- **Feature**: Counselors can search appointments by student name or email
- **Implementation**: 
  - Backend: Updated `GET /api/appointments` accepts `search` query parameter
  - Frontend: Search bar in appointments list (visible only to counselors)
  - Search works with debouncing (500ms delay) for better performance

### 4. Enhanced Appointment Status Workflow
- **Old Flow**: pending → approved → completed
- **New Flow**: 
  - **Initial State (pending)**: Shows buttons: Approve, Edit, Delete
  - **After Approval (approved)**: Shows buttons: Successful, Not Successful, Edit, Delete
  - **Final States (successful/not_successful)**: Shows buttons: Edit, Delete (read-only status)
- **Database Changes**: Updated status ENUM to include: `pending`, `approved`, `successful`, `not_successful`, `cancelled`

### 5. Reports Feature for Counselors
- **Weekly Reports**: View student usage statistics for a selected week
- **Monthly Reports**: View student usage statistics for a selected month
- **Statistics Included**:
  - Total appointments per student
  - Approved appointments count
  - Successful appointments count
  - First and last appointment dates (monthly view)
- **Access**: Only counselors can access reports via `/reports` route
- **UI**: Toggle between weekly and monthly views with date/month selectors

### 6. User Activity Tracking
- **New Table**: `user_activity` - tracks student usage for reporting
- **Automatic Logging**: Activity is logged when appointments are approved or marked successful
- **Purpose**: Provides data for weekly/monthly reports

## Database Changes Required

Run the SQL script `backend/database_updates.sql` to apply all database changes:

1. **Update appointments table**:
   - Modify status column to include new values: `successful`, `not_successful`
   - Add indexes for better query performance

2. **Create user_activity table**:
   - Tracks student activities for reporting purposes
   - Stores activity type, date, time, and details

## API Endpoints Added/Modified

### Modified Endpoints
- `GET /api/appointments` - Now supports `?search=query` parameter for counselors
- `PUT /api/appointments/:id/status` - Now accepts `successful` and `not_successful` statuses

### New Endpoints
- `GET /api/appointments/available-times?counselor_id=X&date=YYYY-MM-DD` - Get available time slots
- `GET /api/reports/weekly?startDate=YYYY-MM-DD` - Get weekly statistics
- `GET /api/reports/monthly?year=YYYY&month=M` - Get monthly statistics

## Frontend Changes

### New Files
- `frontend/src/views/Reports.vue` - Reports page for counselors

### Modified Files
- `frontend/src/views/Appointments.vue`:
  - Changed time picker to hour-based dropdown
  - Added real-time time slot blocking
  - Updated status workflow buttons
  - Enhanced search functionality for counselors
  - Added status badges with colors
  
- `frontend/src/components/NavBar.vue`:
  - Added Reports link (counselors only)
  
- `frontend/src/views/Dashboard.vue`:
  - Added Reports card (counselors only)

- `frontend/src/router/index.js`:
  - Added `/reports` route

## Backend Changes

### New Files
- `backend/controllers/reportsController.js` - Reports logic
- `backend/routes/reports.js` - Reports routes
- `backend/database_updates.sql` - Database migration script

### Modified Files
- `backend/controllers/appointmentController.js`:
  - Added search functionality
  - Updated status workflow logic
  - Added hour-based time validation
  - Added available times endpoint
  - Added activity logging
  
- `backend/routes/appointments.js`:
  - Added available-times endpoint
  
- `backend/server.js`:
  - Added reports routes

## Testing Checklist

- [ ] Run database migration script
- [ ] Test hour-based time slot booking
- [ ] Verify time slots are blocked when already booked
- [ ] Test search functionality (counselor role)
- [ ] Test appointment status workflow (pending → approved → successful/not_successful)
- [ ] Test reports page (weekly view)
- [ ] Test reports page (monthly view)
- [ ] Verify only counselors can access reports
- [ ] Test appointment editing with new time format
- [ ] Verify all buttons show/hide correctly based on status

## Notes

1. **Time Format**: All times are stored in `HH:MM:SS` format in the database, but displayed as `HH:MM` in the UI
2. **Time Validation**: Backend strictly validates hour-based slots (8-16 with :00 minutes only)
3. **Activity Tracking**: Automatic logging only happens on status changes (approved/successful)
4. **Search**: Frontend search for students uses simple filtering, backend search for counselors uses SQL LIKE queries



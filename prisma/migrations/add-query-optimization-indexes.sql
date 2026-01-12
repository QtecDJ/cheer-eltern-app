-- Database Index Optimization für Neon Postgres
-- Basierend auf tatsächlichen Query-Patterns

-- ============================================
-- ANNOUNCEMENT INDEXES
-- ============================================

-- Fehlender Index für category-Filtering (Events-Seite)
CREATE INDEX IF NOT EXISTS "idx_announcement_category" ON "Announcement"("category");

-- Composite Index für häufigste Query: category + expiresAt + isPinned
CREATE INDEX IF NOT EXISTS "idx_announcement_category_expires_pinned" 
ON "Announcement"("category", "expiresAt", "isPinned");

-- Index für expiresAt (für WHERE expiresAt >= NOW() queries)
CREATE INDEX IF NOT EXISTS "idx_announcement_expires" ON "Announcement"("expiresAt");

-- Index für createdAt DESC ordering
CREATE INDEX IF NOT EXISTS "idx_announcement_created_desc" ON "Announcement"("createdAt" DESC);

-- Composite für teamId filtering mit category
CREATE INDEX IF NOT EXISTS "idx_announcement_team_category" 
ON "Announcement"("teamId", "category");

-- ============================================
-- ATTENDANCE INDEXES
-- ============================================

-- Critical: memberId + status für groupBy aggregation
CREATE INDEX IF NOT EXISTS "idx_attendance_member_status" 
ON "Attendance"("memberId", "status");

-- Index für trainingId lookups (Attendance Map)
CREATE INDEX IF NOT EXISTS "idx_attendance_training_member" 
ON "Attendance"("trainingId", "memberId");

-- Index für type filtering
CREATE INDEX IF NOT EXISTS "idx_attendance_type" ON "Attendance"("type");

-- Composite für Training-Seite: memberId + type + date DESC
CREATE INDEX IF NOT EXISTS "idx_attendance_member_type_date" 
ON "Attendance"("memberId", "type", "date" DESC);

-- ============================================
-- POLL & POLL VOTE INDEXES
-- ============================================

-- Index für announcementId lookups (häufig mit Announcements geladen)
CREATE INDEX IF NOT EXISTS "idx_poll_announcement" ON "Poll"("announcementId");

-- Index für endsAt filtering (aktive Polls)
CREATE INDEX IF NOT EXISTS "idx_poll_ends" ON "Poll"("endsAt");

-- PollVote: memberId für "has voted" checks
CREATE INDEX IF NOT EXISTS "idx_poll_vote_member" ON "PollVote"("memberId");

-- PollVote: optionId für counting
CREATE INDEX IF NOT EXISTS "idx_poll_vote_option" ON "PollVote"("optionId");

-- Composite: pollId + memberId für User-Vote-Check
CREATE INDEX IF NOT EXISTS "idx_poll_vote_poll_member" 
ON "PollVote"("pollId", "memberId");

-- ============================================
-- TRAINING ASSESSMENT INDEXES
-- ============================================

-- Index für memberId + date DESC (latest assessment queries)
CREATE INDEX IF NOT EXISTS "idx_training_assessment_member_date" 
ON "TrainingAssessment"("memberId", "date" DESC);

-- ============================================
-- NOTIFICATION INDEXES
-- ============================================

-- Composite: memberId + isRead für ungelesene Notifications
CREATE INDEX IF NOT EXISTS "idx_notification_member_read" 
ON "Notification"("memberId", "isRead");

-- Index für createdAt DESC ordering
CREATE INDEX IF NOT EXISTS "idx_notification_created_desc" 
ON "Notification"("createdAt" DESC);

-- ============================================
-- ANNOUNCEMENT TEAM INDEXES
-- ============================================

-- Composite für Team-Announcement filtering
CREATE INDEX IF NOT EXISTS "idx_announcement_team_both" 
ON "AnnouncementTeam"("announcementId", "teamId");

-- Reverse index für Team → Announcements
CREATE INDEX IF NOT EXISTS "idx_announcement_team_reverse" 
ON "AnnouncementTeam"("teamId", "announcementId");

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Prüfe alle Indexes
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- Prüfe Index-Nutzung (nach einiger Laufzeit)
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan as index_scans,
    idx_tup_read as tuples_read,
    idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;

-- Finde ungenutzte Indexes (nach Produktion)
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
    AND idx_scan = 0
    AND indexname NOT LIKE '%pkey%'
ORDER BY tablename, indexname;

-- Create Message table
CREATE TABLE IF NOT EXISTS "Message" (
  id SERIAL PRIMARY KEY,
  subject VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  "senderId" INTEGER NOT NULL,
  "assignedTo" INTEGER NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'open',
  "resolvedAt" TIMESTAMP WITH TIME ZONE NULL,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT fk_message_sender FOREIGN KEY ("senderId") REFERENCES "Member"(id) ON DELETE CASCADE,
  CONSTRAINT fk_message_assignee FOREIGN KEY ("assignedTo") REFERENCES "Member"(id) ON DELETE SET NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_message_status ON "Message"(status);
CREATE INDEX IF NOT EXISTS idx_message_createdAt ON "Message"("createdAt");
CREATE INDEX IF NOT EXISTS idx_message_senderId ON "Message"("senderId");

-- Create MessageReply table
CREATE TABLE IF NOT EXISTS "MessageReply" (
  id SERIAL PRIMARY KEY,
  "messageId" INTEGER NOT NULL,
  "authorId" INTEGER NOT NULL,
  body TEXT NOT NULL,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT fk_messagereply_message FOREIGN KEY ("messageId") REFERENCES "Message"(id) ON DELETE CASCADE,
  CONSTRAINT fk_messagereply_author FOREIGN KEY ("authorId") REFERENCES "Member"(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_messagereply_messageId ON "MessageReply"("messageId");
CREATE INDEX IF NOT EXISTS idx_messagereply_authorId ON "MessageReply"("authorId");

-- Helper: update updatedAt trigger (optional: keep simple)
-- Note: existing DB may already have triggers for updatedAt; skipping adding triggers to avoid interference.

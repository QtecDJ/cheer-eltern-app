const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { PrismaClient } = require('@prisma/client');

function loadEnv(file) {
  try {
    const txt = fs.readFileSync(file, 'utf8');
    const lines = txt.split(/\r?\n/);
    const out = {};
    for (const l of lines) {
      const m = l.match(/^\s*([A-Z0-9_]+)=(?:"([^"]*)"|(.*))$/i);
      if (m) out[m[1]] = m[2] !== undefined ? m[2] : (m[3] || '');
    }
    return out;
  } catch (e) {
    return {};
  }
}

const env = loadEnv(path.join(__dirname, '..', '.env.local'));
if (env.DATABASE_URL) process.env.DATABASE_URL = env.DATABASE_URL;
const MESSAGE_SECRET = env.MESSAGE_SECRET || process.env.MESSAGE_SECRET || null;

function getKey() {
  if (!MESSAGE_SECRET || MESSAGE_SECRET.length < 32) return null;
  return Buffer.from(MESSAGE_SECRET.slice(0, 32));
}

function encryptText(plain) {
  const key = getKey();
  if (!key) return plain;
  const ALGO = 'aes-256-gcm';
  const IV_LENGTH = 12;
  const TAG_LENGTH = 16;
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGO, key, iv, { authTagLength: TAG_LENGTH });
  const encrypted = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString('base64');
}

async function main() {
  const prisma = new PrismaClient();
  try {
    // choose a sender: prefer admin/org member
    const admin = await prisma.member.findFirst({ where: { OR: [{ role: 'admin' }, { role: 'orga' }] } });
    const anyMember = await prisma.member.findFirst();
    const senderId = admin?.id || anyMember?.id;
    if (!senderId) {
      console.error('No members found in DB to use as sender.');
      return process.exit(1);
    }
    const assigneeId = 1;
    const subject = 'Testnachricht (Automatisch)';
    const body = 'Dies ist eine Testnachricht, bitte ignorieren.';
    const enc = encryptText(body);

    const created = await prisma.message.create({
      data: {
        subject,
        body: enc,
        senderId: senderId,
        assignedTo: assigneeId,
        audience: 'direct',
        status: 'assigned',
      },
    });
    console.log('Created message id=', created.id, 'sender=', senderId, 'assignee=', assigneeId);
  } catch (e) {
    console.error('Error:', e);
    process.exitCode = 1;
  } finally {
    try { await prisma.$disconnect(); } catch (e) {}
  }
}

main();

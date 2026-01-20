-- SQL-Skript zur Überprüfung der RSVP-Datenbankstruktur

-- 1. Zeige alle Tables mit _Event und _Competition Relationen
SELECT 
    table_name 
FROM 
    information_schema.tables 
WHERE 
    table_schema = 'public' 
    AND (
        table_name LIKE '%Event%' 
        OR table_name LIKE '%Competition%'
        OR table_name LIKE '%Member%'
    )
ORDER BY 
    table_name;

-- 2. Zeige Struktur der Event-Tabelle
\d "Event"

-- 3. Zeige Struktur der Competition-Tabelle
\d "Competition"

-- 4. Zeige Struktur der Member-Tabelle (Relations)
\d "Member"

-- 5. Zeige alle Many-to-Many Tabellen
SELECT 
    table_name,
    column_name,
    data_type
FROM 
    information_schema.columns 
WHERE 
    table_schema = 'public'
    AND table_name IN ('_EventParticipations', '_CompetitionParticipants')
ORDER BY 
    table_name, ordinal_position;

-- 6. Zähle aktuelle Teilnehmer pro Event
SELECT 
    e.id,
    e.title,
    e.date,
    COUNT(ep."B") as participant_count
FROM 
    "Event" e
LEFT JOIN 
    "_EventParticipations" ep ON e.id = ep."A"
GROUP BY 
    e.id, e.title, e.date
ORDER BY 
    e.date DESC
LIMIT 5;

-- 7. Zähle aktuelle Teilnehmer pro Competition
SELECT 
    c.id,
    c.title,
    c.date,
    COUNT(cp."B") as participant_count
FROM 
    "Competition" c
LEFT JOIN 
    "_CompetitionParticipants" cp ON c.id = cp."A"
GROUP BY 
    c.id, c.title, c.date
ORDER BY 
    c.date DESC
LIMIT 5;

-- 8. Zeige Beispiel-Daten für Event-Teilnahmen
SELECT 
    e.title as event,
    m."firstName",
    m."lastName"
FROM 
    "_EventParticipations" ep
JOIN 
    "Event" e ON ep."A" = e.id
JOIN 
    "Member" m ON ep."B" = m.id
LIMIT 10;

-- Supabase Row Level Security (RLS) applied directly to Prisma-managed tables
-- Ensures 10-year retention by rejecting UPDATE and DELETE on ComplianceArchive

-- Step 1: Enable RLS on the crucial table
ALTER TABLE "ComplianceArchive" ENABLE ROW LEVEL SECURITY;

-- Step 2: Allow inserts (Appended by service role or authenticated accounts)
CREATE POLICY "Allow INSERT on ComplianceArchive"
    ON "ComplianceArchive"
    FOR INSERT
    WITH CHECK (true);

-- Step 3: Allow reads 
CREATE POLICY "Allow SELECT on ComplianceArchive"
    ON "ComplianceArchive"
    FOR SELECT
    USING (true);

-- Step 4: EXPLICT BLOCK ON UPDATES OR DELETES
-- While RLS naturally denies actions without policies, creating explicit
-- blocking rules provides double-layered defense and clarity.
CREATE POLICY "Deny UPDATE on ComplianceArchive"
    ON "ComplianceArchive"
    FOR UPDATE
    WITH CHECK (false);

CREATE POLICY "Deny DELETE on ComplianceArchive"
    ON "ComplianceArchive"
    FOR DELETE
    USING (false);

-- Added measure: A trigger that will unconditionally raise an exception if an UPDATE or DELETE occurs.
-- RLS can sometimes be bypassed if the user is a postgres superuser (or service role config). 
-- This trigger adds an absolute database-engine lock.
CREATE OR REPLACE FUNCTION prevent_modification()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'ComplianceArchive data is immutable (10-year BIR retention rule). Modifications are absolutely prohibited.';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_append_only_archive
BEFORE UPDATE OR DELETE ON "ComplianceArchive"
FOR EACH ROW EXECUTE PROCEDURE prevent_modification();

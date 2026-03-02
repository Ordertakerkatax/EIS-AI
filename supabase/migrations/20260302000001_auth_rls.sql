-- Step 1: Enable RLS on multi-tenant tables
ALTER TABLE "Customer" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Invoice" ENABLE ROW LEVEL SECURITY;

-- Step 2: Create RLS Policies
-- Users can only SELECT Customers in their Organization
CREATE POLICY "Users can view customers in their Org"
  ON "Customer"
  FOR SELECT
  USING (
    "organizationId" IN (
      SELECT "organizationId" FROM "User" WHERE id::text = auth.uid()::text
    )
  );

-- Users can only INSERT Customers in their Organization
CREATE POLICY "Users can insert customers in their Org"
  ON "Customer"
  FOR INSERT
  WITH CHECK (
    "organizationId" IN (
      SELECT "organizationId" FROM "User" WHERE id::text = auth.uid()::text
    )
  );

-- Users can only UPDATE Customers in their Organization
CREATE POLICY "Users can update customers in their Org"
  ON "Customer"
  FOR UPDATE
  USING (
    "organizationId" IN (
      SELECT "organizationId" FROM "User" WHERE id::text = auth.uid()::text
    )
  );

-- Users can only DELETE Customers in their Organization
CREATE POLICY "Users can delete customers in their Org"
  ON "Customer"
  FOR DELETE
  USING (
    "organizationId" IN (
      SELECT "organizationId" FROM "User" WHERE id::text = auth.uid()::text
    )
  );

-- Invoice Policies
CREATE POLICY "Users can view invoices in their Org"
  ON "Invoice"
  FOR SELECT
  USING (
    "organizationId" IN (
      SELECT "organizationId" FROM "User" WHERE id::text = auth.uid()::text
    )
  );

CREATE POLICY "Users can insert invoices in their Org"
  ON "Invoice"
  FOR INSERT
  WITH CHECK (
    "organizationId" IN (
      SELECT "organizationId" FROM "User" WHERE id::text = auth.uid()::text
    )
  );

CREATE POLICY "Users can update invoices in their Org"
  ON "Invoice"
  FOR UPDATE
  USING (
    "organizationId" IN (
      SELECT "organizationId" FROM "User" WHERE id::text = auth.uid()::text
    )
  );

CREATE POLICY "Users can delete invoices in their Org"
  ON "Invoice"
  FOR DELETE
  USING (
    "organizationId" IN (
      SELECT "organizationId" FROM "User" WHERE id::text = auth.uid()::text
    )
  );

-- Trigger for new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  new_org_id uuid;
BEGIN
  -- Create Organization
  INSERT INTO public."Organization" (id, name, "updatedAt")
  VALUES (gen_random_uuid(), COALESCE(NEW.raw_user_meta_data->>'organization_name', 'My Organization'), CURRENT_TIMESTAMP)
  RETURNING id INTO new_org_id;

  -- Create User profile linked to Organization
  INSERT INTO public."User" (id, email, name, "organizationId", "updatedAt")
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'name', new_org_id, CURRENT_TIMESTAMP);

  RETURN NEW;
END;
$$;

-- Attach trigger to auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

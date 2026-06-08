-- Seed properties, floors, tenants, occupancies, utilities, and rent rules from JSON.
-- Run once via scripts/seed/run-seed.ps1 (loads tenants-data.json) or call manually:
--   SELECT seed_tenants_from_json('<json>'::jsonb);

CREATE OR REPLACE FUNCTION seed_tenants_from_json(p_data jsonb)
RETURNS TABLE (
  properties_inserted int,
  floors_inserted int,
  tenants_inserted int,
  occupancies_inserted int,
  utilities_inserted int,
  rent_rules_inserted int
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_properties_inserted int := 0;
  v_floors_inserted int := 0;
  v_tenants_inserted int := 0;
  v_occupancies_inserted int := 0;
  v_utilities_inserted int := 0;
  v_rent_rules_inserted int := 0;
  v_property jsonb;
  v_floor jsonb;
  v_utility jsonb;
  v_property_id bigint;
  v_floor_id bigint;
  v_tenant_id bigint;
  v_occupancy_id bigint;
  v_tenant_name text;
  v_house_numbers text[];
BEGIN
  SELECT coalesce(array_agg(p->>'houseNumber'), ARRAY[]::text[])
  INTO v_house_numbers
  FROM jsonb_array_elements(p_data->'properties') AS p;

  DELETE FROM properties
  WHERE house_number = ANY (v_house_numbers);

  FOR v_property IN
    SELECT value FROM jsonb_array_elements(p_data->'properties')
  LOOP
    INSERT INTO properties (house_number, address, size)
    VALUES (
      v_property->>'houseNumber',
      coalesce(v_property->>'address', ''),
      coalesce((v_property->>'size')::numeric, 0)
    )
    RETURNING id INTO v_property_id;

    v_properties_inserted := v_properties_inserted + 1;

    FOR v_utility IN
      SELECT value FROM jsonb_array_elements(coalesce(v_property->'sharedUtilities', '[]'::jsonb))
    LOOP
      INSERT INTO utility_connections (
        property_id,
        floor_id,
        type,
        reference_number,
        consumer_number,
        provider_name
      )
      VALUES (
        v_property_id,
        NULL,
        (v_utility->>'type')::utility_type,
        nullif(trim(v_utility->>'referenceNumber'), ''),
        nullif(trim(v_utility->>'consumerNumber'), ''),
        nullif(trim(v_utility->>'providerName'), '')
      );

      v_utilities_inserted := v_utilities_inserted + 1;
    END LOOP;

    FOR v_floor IN
      SELECT value FROM jsonb_array_elements(v_property->'floors')
    LOOP
      INSERT INTO floors (property_id, floor_number, label)
      VALUES (
        v_property_id,
        (v_floor->>'floorNumber')::int,
        coalesce(v_floor->>'label', '')
      )
      RETURNING id INTO v_floor_id;

      v_floors_inserted := v_floors_inserted + 1;

      IF v_floor ? 'occupancy' THEN
        v_tenant_name := trim(v_floor->'occupancy'->>'tenantName');

        SELECT t.id
        INTO v_tenant_id
        FROM tenants t
        WHERE t.name = v_tenant_name
        LIMIT 1;

        IF v_tenant_id IS NULL THEN
          INSERT INTO tenants (name, phone_number)
          VALUES (v_tenant_name, coalesce(v_floor->'occupancy'->>'phoneNumber', ''))
          RETURNING id INTO v_tenant_id;

          v_tenants_inserted := v_tenants_inserted + 1;
        END IF;

        INSERT INTO tenant_occupancies (
          tenant_id,
          property_id,
          floor_id,
          rent,
          security_deposit,
          start_date
        )
        VALUES (
          v_tenant_id,
          v_property_id,
          v_floor_id,
          coalesce((v_floor->'occupancy'->>'rent')::numeric, 0),
          coalesce((v_floor->'occupancy'->>'securityDeposit')::numeric, 0),
          (v_floor->'occupancy'->>'startDate')::date
        )
        RETURNING id INTO v_occupancy_id;

        v_occupancies_inserted := v_occupancies_inserted + 1;

        INSERT INTO rent_increase_rules (
          tenant_occupancy_id,
          increase_percent,
          next_increase_date
        )
        VALUES (
          v_occupancy_id,
          coalesce((v_floor->'occupancy'->>'increasePercent')::numeric, 10),
          ((v_floor->'occupancy'->>'startDate')::date + interval '1 year')::timestamptz
        );

        v_rent_rules_inserted := v_rent_rules_inserted + 1;
      END IF;

      FOR v_utility IN
        SELECT value FROM jsonb_array_elements(coalesce(v_floor->'utilities', '[]'::jsonb))
      LOOP
        INSERT INTO utility_connections (
          property_id,
          floor_id,
          type,
          reference_number,
          consumer_number,
          provider_name
        )
        VALUES (
          v_property_id,
          v_floor_id,
          (v_utility->>'type')::utility_type,
          nullif(trim(v_utility->>'referenceNumber'), ''),
          nullif(trim(v_utility->>'consumerNumber'), ''),
          nullif(trim(v_utility->>'providerName'), '')
        );

        v_utilities_inserted := v_utilities_inserted + 1;
      END LOOP;
    END LOOP;
  END LOOP;

  RETURN QUERY
  SELECT
    v_properties_inserted,
    v_floors_inserted,
    v_tenants_inserted,
    v_occupancies_inserted,
    v_utilities_inserted,
    v_rent_rules_inserted;
END;
$$;

COMMENT ON FUNCTION seed_tenants_from_json(jsonb) IS
  'Loads properties/floors/tenants/utilities from scripts/seed/tenants-data.json shape. Replaces existing rows for seeded house numbers.';

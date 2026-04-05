require('dotenv').config();
const db = require('../db');

async function run() {
  const client = await db.connect();
  try {
    await client.query('begin');

    const municipality = await client.query(`
      insert into municipalities (name, code, country_code)
      values ('Amman Municipality Demo', 'AMMAN-DEMO', 'JO')
      on conflict (code) do update set name = excluded.name
      returning *
    `);
    const municipalityId = municipality.rows[0].id;

    await client.query(`
      insert into users (municipality_id, full_name, email, role)
      values ($1, 'Registry Admin', 'admin@registry.local', 'municipality_admin')
      on conflict (email) do nothing
    `, [municipalityId]);

    const owner1 = await client.query(`
      insert into owners (municipality_id, full_name, phone, email)
      values ($1, 'Demo Owner One', '0790000001', 'owner1@example.com')
      returning *
    `, [municipalityId]);

    const owner2 = await client.query(`
      insert into owners (municipality_id, full_name, phone, email)
      values ($1, 'Demo Owner Two', '0790000002', 'owner2@example.com')
      returning *
    `, [municipalityId]);

    const tenant1 = await client.query(`
      insert into tenants (municipality_id, full_name, phone, email)
      values ($1, 'Demo Tenant One', '0791000001', 'tenant1@example.com')
      returning *
    `, [municipalityId]);

    await client.query(`
      insert into tenants (municipality_id, full_name, phone, email)
      values ($1, 'Demo Tenant Two', '0791000002', 'tenant2@example.com')
    `, [municipalityId]);

    const property1 = await client.query(`
      insert into properties (municipality_id, owner_id, property_code, title, property_type, city, registry_status)
      values ($1,$2,'P-1001','Commercial Building A','commercial','Amman','active')
      returning *
    `, [municipalityId, owner1.rows[0].id]);

    await client.query(`
      insert into properties (municipality_id, owner_id, property_code, title, property_type, city, registry_status)
      values ($1,$2,'P-1002','Residential Villa B','residential','Amman','active')
    `, [municipalityId, owner2.rows[0].id]);

    const property3 = await client.query(`
      insert into properties (municipality_id, owner_id, property_code, title, property_type, city, registry_status)
      values ($1,$2,'P-1003','Apartment C','residential','Amman','active')
      returning *
    `, [municipalityId, owner1.rows[0].id]);

    const unit = await client.query(`
      insert into property_units (property_id, unit_code, unit_label, unit_type, floor_label, occupancy_status)
      values ($1,'U-1','Apartment C - Unit 1','apartment','1','vacant')
      returning *
    `, [property3.rows[0].id]);

    const agreement = await client.query(`
      insert into agreements (
        municipality_id, property_id, unit_id, owner_id, tenant_id,
        agreement_type, agreement_status, start_date, end_date,
        currency_code, payment_frequency, rent_amount, deposit_due,
        recurring_until, auto_generate_obligations
      ) values (
        $1,$2,$3,$4,$5,
        'rental','active',current_date,current_date + interval '90 day',
        'JOD','monthly',500,300,
        current_date + interval '60 day',true
      ) returning *
    `, [municipalityId, property3.rows[0].id, unit.rows[0].id, owner1.rows[0].id, tenant1.rows[0].id]);

    await client.query(`
      insert into obligations (
        municipality_id, property_id, unit_id, agreement_id, obligation_type, title,
        amount_due, amount_paid, amount_remaining, currency_code, due_date, issued_date, status,
        responsible_party_type, responsible_tenant_id
      ) values
      ($1,$2,$3,$4,'rent','Monthly Rent - Demo',500,200,300,'JOD',current_date,current_date,'partial','tenant',$5),
      ($1,$2,$3,$4,'electricity','Electricity Bill - Demo',45,0,45,'JOD',current_date + interval '7 day',current_date,'pending','tenant',$5),
      ($1,$2,$3,$4,'property_tax','Property Tax - Demo',120,0,120,'JOD',current_date + interval '14 day',current_date,'pending','owner',null)
      
    `, [municipalityId, property3.rows[0].id, unit.rows[0].id, agreement.rows[0].id, tenant1.rows[0].id]);

    const obligation = await client.query(`select * from obligations where agreement_id = $1 and obligation_type = 'rent' order by created_at asc limit 1`, [agreement.rows[0].id]);
    await client.query(`
      insert into payments (municipality_id, obligation_id, property_id, agreement_id, amount_paid, currency_code, payment_method, notes)
      values ($1,$2,$3,$4,200,'JOD','cash','Seed partial payment')
    `, [municipalityId, obligation.rows[0].id, property3.rows[0].id, agreement.rows[0].id]);

    const contractor = await client.query(`
      insert into contractors (municipality_id, company_name, contact_name, phone, email, trade_type)
      values ($1,'Demo Contractor Co','Ahmad','0792000001','contractor@example.com','Renovation')
      returning *
    `, [municipalityId]);

    const improvement = await client.query(`
      insert into improvements (municipality_id, property_id, title, description, contractor_id, estimated_cost, actual_cost, status)
      values ($1,$2,'Villa Renovation','Interior and exterior refresh',$3,5000,4800,'completed')
      returning *
    `, [municipalityId, property1.rows[0].id, contractor.rows[0].id]);

    await client.query(`
      insert into improvement_materials (municipality_id, improvement_id, material_name, quantity, unit, total_cost)
      values ($1,$2,'Paint',12,'buckets',800), ($1,$2,'Flooring',150,'sqm',2400)
    `, [municipalityId, improvement.rows[0].id]);

    await client.query('commit');
    console.log('Seed demo data inserted successfully');
  } catch (error) {
    await client.query('rollback');
    console.error('Seed failed:', error);
    process.exit(1);
  } finally {
    client.release();
    await db.end();
  }
}

run();

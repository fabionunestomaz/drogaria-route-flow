import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('🌱 Starting seed process...');

    // 1. Create test users
    console.log('👤 Creating users...');
    
    const adminEmail = 'admin@drogaria.com';
    const driverEmail = 'motorista@drogaria.com';
    const customerEmail = 'cliente@drogaria.com';
    const password = 'Test@123456';

    // Create admin
    const { data: adminUser, error: adminError } = await supabase.auth.admin.createUser({
      email: adminEmail,
      password,
      email_confirm: true,
      user_metadata: { name: 'Admin Sistema' }
    });

    if (adminError && !adminError.message.includes('already exists')) {
      throw adminError;
    }

    // Create driver
    const { data: driverUser, error: driverError } = await supabase.auth.admin.createUser({
      email: driverEmail,
      password,
      email_confirm: true,
      user_metadata: { name: 'João Motorista', phone: '61999887766' }
    });

    if (driverError && !driverError.message.includes('already exists')) {
      throw driverError;
    }

    // Create customer
    const { data: customerUser, error: customerError } = await supabase.auth.admin.createUser({
      email: customerEmail,
      password,
      email_confirm: true,
      user_metadata: { name: 'Maria Cliente', phone: '61988776655' }
    });

    if (customerError && !customerError.message.includes('already exists')) {
      throw customerError;
    }

    console.log('✅ Users created');

    // 2. Assign roles
    console.log('🔐 Assigning roles...');

    if (adminUser?.user) {
      await supabase.from('user_roles').upsert({
        user_id: adminUser.user.id,
        role: 'admin'
      }, { onConflict: 'user_id,role' });
    }

    if (driverUser?.user) {
      await supabase.from('user_roles').upsert({
        user_id: driverUser.user.id,
        role: 'driver'
      }, { onConflict: 'user_id,role' });

      // Create driver record
      await supabase.from('drivers').upsert({
        user_id: driverUser.user.id,
        cnh_number: '12345678900',
        cnh_front_url: 'https://placeholder.com/cnh-front.jpg',
        cnh_back_url: 'https://placeholder.com/cnh-back.jpg',
        selfie_url: 'https://placeholder.com/selfie.jpg',
        vehicle_type: 'moto',
        plate: 'ABC-1234',
        approved: true,
        shift_status: 'online'
      }, { onConflict: 'user_id' });
    }

    if (customerUser?.user) {
      await supabase.from('user_roles').upsert({
        user_id: customerUser.user.id,
        role: 'customer'
      }, { onConflict: 'user_id,role' });
    }

    console.log('✅ Roles assigned');

    // 3. Create sample pharmacy settings (if admin exists)
    if (adminUser?.user) {
      console.log('🏪 Creating pharmacy settings...');
      await supabase.from('pharmacy_settings').upsert({
        user_id: adminUser.user.id,
        pharmacy_name: 'Drogaria Fast Deliver',
        address: 'Av. W3 Norte, Asa Norte, Brasília - DF',
        lat: -15.7942,
        lng: -47.8822,
        phone: '6133334444',
        base_price: 5.00,
        price_per_km: 2.00
      }, { onConflict: 'user_id' });
    }

    // 4. Create sample customers (linked to pharmacy)
    if (adminUser?.user) {
      console.log('👥 Creating sample customers...');
      const customers = [
        {
          pharmacy_id: adminUser.user.id,
          name: 'Pedro Silva',
          phone: '61987654321',
          address: 'Quadra 102 Norte, Bloco A, Apt 305, Asa Norte, Brasília - DF',
          lat: -15.7642,
          lng: -47.8822
        },
        {
          pharmacy_id: adminUser.user.id,
          name: 'Ana Costa',
          phone: '61987654322',
          address: 'Quadra 304 Sul, Bloco B, Casa 12, Asa Sul, Brasília - DF',
          lat: -15.8142,
          lng: -47.8922
        },
        {
          pharmacy_id: adminUser.user.id,
          name: 'Carlos Souza',
          phone: '61987654323',
          address: 'Setor Comercial Sul, Quadra 6, Loja 45, Brasília - DF',
          lat: -15.8042,
          lng: -47.8922
        }
      ];

      for (const customer of customers) {
        await supabase.from('customers').upsert(customer, { 
          onConflict: 'pharmacy_id,name' 
        });
      }
    }

    // 5. Create sample delivery batches and deliveries
    if (adminUser?.user && driverUser?.user) {
      console.log('📦 Creating sample delivery batches...');

      // Batch 1: In progress
      const { data: batch1 } = await supabase.from('delivery_batches').insert({
        pharmacy_id: adminUser.user.id,
        driver_id: driverUser.user.id,
        status: 'in_progress',
        total_distance: 8500,
        total_price: 45.00
      }).select().single();

      if (batch1) {
        const deliveries1 = [
          {
            batch_id: batch1.id,
            order_number: 'PED-001',
            address: 'Quadra 102 Norte, Bloco A, Apt 305, Asa Norte, Brasília - DF',
            lat: -15.7642,
            lng: -47.8822,
            status: 'delivered',
            sequence: 1,
            delivered_at: new Date(Date.now() - 30 * 60 * 1000).toISOString()
          },
          {
            batch_id: batch1.id,
            order_number: 'PED-002',
            address: 'Quadra 304 Sul, Bloco B, Casa 12, Asa Sul, Brasília - DF',
            lat: -15.8142,
            lng: -47.8922,
            status: 'pending',
            sequence: 2
          }
        ];

        for (const delivery of deliveries1) {
          await supabase.from('deliveries').insert(delivery);
        }
      }

      // Batch 2: Pending assignment
      const { data: batch2 } = await supabase.from('delivery_batches').insert({
        pharmacy_id: adminUser.user.id,
        status: 'pending',
        total_distance: 12000,
        total_price: 60.00
      }).select().single();

      if (batch2) {
        const deliveries2 = [
          {
            batch_id: batch2.id,
            order_number: 'PED-003',
            address: 'Setor Comercial Sul, Quadra 6, Loja 45, Brasília - DF',
            lat: -15.8042,
            lng: -47.8922,
            status: 'pending',
            sequence: 1
          },
          {
            batch_id: batch2.id,
            order_number: 'PED-004',
            address: 'Quadra 108 Norte, Bloco D, Apt 201, Asa Norte, Brasília - DF',
            lat: -15.7542,
            lng: -47.8722,
            status: 'pending',
            sequence: 2
          },
          {
            batch_id: batch2.id,
            order_number: 'PED-005',
            address: 'Quadra 202 Sul, Bloco C, Casa 7, Asa Sul, Brasília - DF',
            lat: -15.8242,
            lng: -47.9022,
            status: 'pending',
            sequence: 3
          }
        ];

        for (const delivery of deliveries2) {
          await supabase.from('deliveries').insert(delivery);
        }
      }
    }

    // 6. Create sample delivery requests
    if (customerUser?.user) {
      console.log('📋 Creating delivery requests...');
      
      await supabase.from('delivery_requests').insert([
        {
          customer_id: customerUser.user.id,
          origin_address: 'Av. W3 Norte, Asa Norte, Brasília - DF',
          origin_lat: -15.7942,
          origin_lng: -47.8822,
          dest_address: 'Quadra 110 Norte, Bloco E, Apt 402, Brasília - DF',
          dest_lat: -15.7442,
          dest_lng: -47.8722,
          distance: 5.2,
          estimated_time: 15,
          estimated_price: 18.40,
          status: 'pending',
          notes: 'Entregar até 18h'
        },
        {
          customer_id: customerUser.user.id,
          origin_address: 'Av. W3 Sul, Asa Sul, Brasília - DF',
          origin_lat: -15.8242,
          origin_lng: -47.8922,
          dest_address: 'Quadra 306 Sul, Bloco A, Casa 15, Brasília - DF',
          dest_lat: -15.8342,
          dest_lng: -47.9022,
          distance: 3.8,
          estimated_time: 12,
          estimated_price: 15.60,
          status: 'pending'
        }
      ]);
    }

    // 7. Create sample coupons
    console.log('🎟️ Creating coupons...');
    await supabase.from('coupons').upsert([
      {
        code: 'PRIMEIRA10',
        type: 'percent',
        value: 10,
        active: true,
        valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        code: 'FRETE5',
        type: 'fixed',
        value: 5.00,
        active: true,
        valid_until: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString()
      }
    ], { onConflict: 'code' });

    console.log('✅ Seed completed successfully!');

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Dados de teste criados com sucesso!',
        credentials: {
          admin: { email: adminEmail, password },
          driver: { email: driverEmail, password },
          customer: { email: customerEmail, password }
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('❌ Seed error:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error.toString()
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
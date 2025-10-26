const { supabaseAdmin } = require('./src/config/database');

(async () => {
  const product = 'AirTag';
  const days = 90;

  const daysAgo = new Date();
  daysAgo.setDate(daysAgo.getDate() - parseInt(days));
  const startDate = daysAgo.toISOString().split('T')[0];

  console.log('Data inicial:', startDate);
  console.log('Procurando:', product);

  const { data, error } = await supabaseAdmin
    .from('products_catalog')
    .select('product_name, price, extracted_at')
    .ilike('product_name', `%${product}%`)
    .gte('extracted_at', `${startDate}T00:00:00`)
    .order('extracted_at', { ascending: true });

  console.log('Erro:', error);
  console.log('Total encontrado:', data?.length || 0);
  if (data && data.length > 0) {
    console.log('Primeiros 3:', data.slice(0, 3));
  }

  // Sem filtro de data
  const { data: data2, error: error2 } = await supabaseAdmin
    .from('products_catalog')
    .select('product_name, price, extracted_at')
    .ilike('product_name', `%${product}%`)
    .order('extracted_at', { ascending: true });

  console.log('\nSem filtro de data:');
  console.log('Total encontrado:', data2?.length || 0);
  if (data2 && data2.length > 0) {
    console.log('Primeiros 3:', data2.slice(0, 3));
  }

  process.exit(0);
})();

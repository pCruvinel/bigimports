require('dotenv').config();
const { supabaseAdmin } = require('../src/config/database');

async function updateProductDates() {
  try {
    console.log('Atualizando datas dos produtos existentes...\n');

    // Buscar todos os produtos
    const { data: products, error: fetchError } = await supabaseAdmin
      .from('products_catalog')
      .select('id')
      .order('created_at', { ascending: true });

    if (fetchError) {
      console.error('Erro ao buscar produtos:', fetchError);
      return;
    }

    console.log(`Total de produtos encontrados: ${products.length}\n`);

    if (products.length === 0) {
      console.log('Nenhum produto encontrado para atualizar.');
      return;
    }

    // Distribuir produtos pelos últimos 30 dias
    const days = 30;
    const productsPerDay = Math.ceil(products.length / days);

    console.log(`Distribuindo ${products.length} produtos em ${days} dias (≈${productsPerDay} por dia)\n`);

    let updatedCount = 0;
    const today = new Date();

    for (let i = 0; i < days; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);

      // Pegar os produtos para este dia
      const startIndex = i * productsPerDay;
      const endIndex = Math.min(startIndex + productsPerDay, products.length);
      const productsForDay = products.slice(startIndex, endIndex);

      if (productsForDay.length === 0) break;

      // Atualizar em lote
      const productIds = productsForDay.map(p => p.id);

      // Distribuir ao longo do dia (adicionar horas aleatórias)
      for (const productId of productIds) {
        const randomHour = Math.floor(Math.random() * 24);
        const randomMinute = Math.floor(Math.random() * 60);
        const dateWithTime = new Date(date);
        dateWithTime.setHours(randomHour, randomMinute, 0, 0);

        const { error: updateError } = await supabaseAdmin
          .from('products_catalog')
          .update({ extracted_at: dateWithTime.toISOString() })
          .eq('id', productId);

        if (updateError) {
          console.error(`Erro ao atualizar produto ${productId}:`, updateError);
        } else {
          updatedCount++;
        }
      }

      console.log(`Dia ${i + 1}: ${date.toISOString().split('T')[0]} - ${productsForDay.length} produtos atualizados`);
    }

    console.log(`\n✅ Atualização concluída! ${updatedCount} produtos atualizados.`);

  } catch (error) {
    console.error('Erro ao atualizar produtos:', error);
  } finally {
    process.exit(0);
  }
}

updateProductDates();

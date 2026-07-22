import { supabase } from './supabase.js';

export const seedMasterData = async () => {
  try {
    console.log('Seeding master branches and categories...');

    const branchesToSeed = [
      { name: 'Civil Engineering', code: 'CE' },
      { name: 'Mechanical Engineering', code: 'ME' },
      { name: 'Electrical Engineering', code: 'EE' },
      { name: 'Computer Technology', code: 'CM' },
      { name: 'Information Technology', code: 'IF' },
      { name: 'Electronics and Telecommunication', code: 'ENTC' },
      { name: 'Mechatronics', code: 'MK' },
      { name: 'Polymer Technology', code: 'PO' },
      { name: 'Interior Design', code: 'ID' },
      { name: 'Automobile Engineering', code: 'AE' },
      { name: 'Dress Designing and Garment Manufacturing', code: 'DDGM' }
    ];

    const categoriesToSeed = [
      { name: 'OPEN', percentage: 50.00 },
      { name: 'OBC', percentage: 19.00 },
      { name: 'SBC', percentage: 2.00 },
      { name: 'SEBC', percentage: 10.00 },
      { name: 'SC', percentage: 13.00 },
      { name: 'ST', percentage: 7.00 },
      { name: 'NT-A', percentage: 3.00 },
      { name: 'NT-B', percentage: 2.50 },
      { name: 'NT-C', percentage: 3.50 },
      { name: 'NT-D', percentage: 2.00 },
      { name: 'EWS', percentage: 10.00 }
    ];

    // Seed Branches
    for (const b of branchesToSeed) {
      const { data: existing } = await supabase
        .from('branches')
        .select('id')
        .eq('branch_code', b.code)
        .maybeSingle();

      if (existing) {
        await supabase
          .from('branches')
          .update({ branch_name: b.name })
          .eq('id', existing.id);
      } else {
        await supabase
          .from('branches')
          .insert([{ branch_name: b.name, branch_code: b.code }]);
      }
    }

    // Clean up old branches
    const validBranchCodes = branchesToSeed.map(b => b.code);
    const { data: allBranches } = await supabase.from('branches').select('id, branch_code');
    if (allBranches) {
      for (const b of allBranches) {
        if (!validBranchCodes.includes(b.branch_code)) {
          console.log(`Removing old branch: ${b.branch_code}`);
          await supabase.from('branches').delete().eq('id', b.id);
        }
      }
    }

    // Seed Categories
    for (const c of categoriesToSeed) {
      const { data: existing } = await supabase
        .from('categories')
        .select('id')
        .eq('category_name', c.name)
        .maybeSingle();

      if (existing) {
        await supabase
          .from('categories')
          .update({ reservation_percentage: c.percentage })
          .eq('id', existing.id);
      } else {
        await supabase
          .from('categories')
          .insert([{ category_name: c.name, reservation_percentage: c.percentage }]);
      }
    }

    // Clean up old categories
    const validCategoryNames = categoriesToSeed.map(c => c.name);
    const { data: allCategories } = await supabase.from('categories').select('id, category_name');
    if (allCategories) {
      for (const c of allCategories) {
        if (!validCategoryNames.includes(c.category_name)) {
          console.log(`Removing old category: ${c.category_name}`);
          await supabase.from('categories').delete().eq('id', c.id);
        }
      }
    }

    console.log('Master data seeding completed successfully!');
  } catch (err) {
    console.error('Error seeding master data:', err.message);
  }
};

(async function(){
  try{
    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceRole = process.env.SUPABASE_SERVICE_ROLE;
    if(!supabaseUrl || !serviceRole){
      console.error('Supabase config missing in env. Aborting.');
      process.exit(1);
    }

    const tables = ['user_categories','tutors','app_users','users'];
    // Try to delete rows from each table. PostgREST may block unfiltered DELETE; we'll fetch rows then delete by primary key.
    for (const table of tables) {
      const url = `${supabaseUrl.replace(/\/$/, '')}/rest/v1/${table}`;
      console.log(`Processing table ${table}...`);
      try {
        const listResp = await fetch(`${url}?select=*`, {
          method: 'GET',
          headers: { apikey: serviceRole, Authorization: `Bearer ${serviceRole}` },
        });
        if (!listResp.ok) {
          const txt = await listResp.text().catch(() => '');
          console.warn(`Failed to list ${table}:`, listResp.status, txt);
          continue;
        }
        const rows = await listResp.json();
        if (!Array.isArray(rows) || rows.length === 0) {
          console.log(`No rows to clear in ${table}`);
          continue;
        }

        for (const row of rows) {
          // determine delete filter
          const urlDelBase = url;
          let filter = null;
          if (row.id !== undefined) {
            filter = `id=eq.${encodeURIComponent(row.id)}`;
          } else if (row.user_id !== undefined && row.category_code !== undefined) {
            filter = `user_id=eq.${encodeURIComponent(row.user_id)}&category_code=eq.${encodeURIComponent(row.category_code)}`;
          } else if (row.user_id !== undefined) {
            filter = `user_id=eq.${encodeURIComponent(row.user_id)}`;
          } else if (row.cin !== undefined) {
            filter = `cin=eq.${encodeURIComponent(row.cin)}`;
          }

          if (!filter) {
            console.warn(`Skipping row in ${table}, couldn't determine primary key:`, row);
            continue;
          }

          const delUrl = `${urlDelBase}?${filter}`;
          try {
            const delResp = await fetch(delUrl, {
              method: 'DELETE',
              headers: {
                apikey: serviceRole,
                Authorization: `Bearer ${serviceRole}`,
                Prefer: 'return=minimal',
              },
            });
            if (!delResp.ok) {
              const txt = await delResp.text().catch(() => '');
              console.warn(`Failed to delete row from ${table}:`, delResp.status, txt);
            }
          } catch (err) {
            console.warn(`Error deleting row from ${table}:`, err?.message || err);
          }
        }

        console.log(`Finished clearing ${table}`);
      } catch (err) {
        console.warn(`Error processing ${table}:`, err?.message || err);
      }
    }

    console.log('Done.');
    process.exit(0);
  }catch(err){
    console.error('Unexpected error', err);
    process.exit(2);
  }
})();

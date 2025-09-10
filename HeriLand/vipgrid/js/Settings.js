const $=(s,e=document)=>e.querySelector(s); const $$=(s,e=document)=>Array.from(e.querySelectorAll(s));
    const store={ read(k,f){ try{return JSON.parse(localStorage.getItem(k)) ?? f }catch{return f } }, write(k,v){ localStorage.setItem(k, JSON.stringify(v)) } };

    const PrefKey='hl_prefs';
    const prefs = store.read(PrefKey, { lang:'zh-Hant', theme:'auto', trip:true, deal:false, notice:true });

    // ===== 初始化 UI =====
    // 語言
    const langSel = $('#lang'); langSel.value = prefs.lang; $('#langDesc').textContent = langSel.options[langSel.selectedIndex].text;
    langSel.addEventListener('change', ()=>{ prefs.lang = langSel.value; $('#langDesc').textContent = langSel.options[langSel.selectedIndex].text; savePrefs(); });

    // 外觀
    const segBtns = $$('.segbtn');
    segBtns.forEach(b=> b.setAttribute('aria-pressed', b.dataset.theme === prefs.theme ? 'true':'false'));
    $('#themeDesc').textContent = prefs.theme==='light'?'淺色': prefs.theme==='dark'?'深色': '自動';
    segBtns.forEach(b=> b.addEventListener('click', ()=>{
      prefs.theme = b.dataset.theme; savePrefs();
      segBtns.forEach(x=> x.setAttribute('aria-pressed', x===b ? 'true':'false'));
      $('#themeDesc').textContent = prefs.theme==='light'?'淺色': prefs.theme==='dark'?'深色': '自動';
      applyTheme();
    }));

    // Switches
    function bindSwitch(id, key){
      const el=$(id); el.setAttribute('aria-checked', prefs[key]?'true':'false');
      el.addEventListener('click', ()=>{ prefs[key]=!prefs[key]; el.setAttribute('aria-checked', prefs[key]?'true':'false'); savePrefs(); });
    }
    bindSwitch('#swTrip', 'trip');
    bindSwitch('#swDeal', 'deal');
    bindSwitch('#swNotice', 'notice');

    // 導航（占位提示）
    $$('.clickable[data-nav]').forEach(row=> row.addEventListener('click', ()=> alert('下版：跳轉到『'+row.dataset.nav+'』頁面')));
    $$('.clickable[data-external]').forEach(row=> row.addEventListener('click', ()=> alert('下版：前往 '+row.dataset.external)));

    // 清除快取 / 瀏覽紀錄
    $('#btnClear').addEventListener('click', ()=>{
      confirmModal({
        title:'清除快取 / 瀏覽紀錄',
        body:'這會清除收藏、足跡、旅程與徽章推薦設定（localStorage）。確定要清除嗎？',
        onOk: ()=>{
          ['hl_favorites','hl_history','hl_trips','hl_badges','hl_badges_recent'].forEach(k=> localStorage.removeItem(k));
          alert('已清除。');
        }
      });
    });

    // 登出
    $$('.clickable[data-action="logout"]').forEach(row=> row.addEventListener('click', ()=>{
      confirmModal({ title:'登出', body:'確定要登出嗎？', onOk: ()=> alert('LOGOUT: 這裡呼叫後端登出 API') });
    }));

    // 刪除帳號
    $$('.clickable[data-action="delete-account"]').forEach(row=> row.addEventListener('click', ()=>{
      confirmModal({ title:'刪除帳號', body:'此動作無法復原。輸入 DELETE 以確認。', require:'DELETE', danger:true, onOk: ()=> alert('DELETE ACCOUNT: 這裡呼叫後端刪除 API') });
    }));

    // 備份 / 還原設定
    $('#btnExport').addEventListener('click', ()=>{
      const data={ prefs, favorites:store.read('hl_favorites',[]), history:store.read('hl_history',[]), trips:store.read('hl_trips',[]), badges:store.read('hl_badges',[]) };
      const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
      const url=URL.createObjectURL(blob);
      const a=document.createElement('a'); a.href=url; a.download='heriland_backup.json'; a.click(); URL.revokeObjectURL(url);
    });
    $('#btnImport').addEventListener('click', ()=> $('#importFile').click());
    $('#importFile').addEventListener('change', (e)=>{
      const f=e.target.files[0]; if(!f) return; const r=new FileReader(); r.onload=()=>{
        try{
          const data=JSON.parse(r.result);
          if(data.prefs) Object.assign(prefs, data.prefs);
          if(data.favorites) store.write('hl_favorites', data.favorites);
          if(data.history) store.write('hl_history', data.history);
          if(data.trips) store.write('hl_trips', data.trips);
          if(data.badges) store.write('hl_badges', data.badges);
          savePrefs(); alert('已還原設定'); location.reload();
        }catch(err){ alert('還原失敗：檔案格式錯誤'); }
      }; r.readAsText(f);
    });

    // 工具：Modal
    const backdrop=$('#backdrop'), sheet=$('#sheet');
    function confirmModal({title, body, require, danger, onOk}){
      $('#modalTitle').textContent = title; $('#modalBody').textContent = body; const ok=$('#btnOk');
      ok.classList.toggle('danger', !!danger);
      backdrop.classList.add('show'); sheet.classList.add('show');
      const handler=()=>{ if(require){ const val=prompt('請輸入確認字串（'+require+'）：'); if(val!==require){ closeModal(); return; } } onOk&&onOk(); closeModal(); };
      ok.onclick=handler; $('#btnCancel').onclick=closeModal; backdrop.onclick=closeModal;
    }
    function closeModal(){ backdrop.classList.remove('show'); sheet.classList.remove('show'); }

    function savePrefs(){ store.write(PrefKey, prefs); }

    function applyTheme(){
      if(prefs.theme==='dark'){ document.documentElement.style.colorScheme='dark'; }
      else if(prefs.theme==='light'){ document.documentElement.style.colorScheme='light'; }
      else{ document.documentElement.style.colorScheme='normal'; }
    }
    applyTheme();
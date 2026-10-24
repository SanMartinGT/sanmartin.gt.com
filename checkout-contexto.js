/* Modalidad y destino compartidos por todos los carritos de la tienda. */
(() => {
  'use strict';
  const copy=value=>JSON.parse(JSON.stringify(value));
  function crear({client}={}){
    let modo='SUCURSAL',ubicacionId=null,revision=0,status='idle',branches=[],branchStatus='idle',error='',message='';
    let sequence=0,lastKey='',branchRequest=0;
    const listeners=new Set();
    const state=()=>({modo,ubicacionId,revision,status,branches:copy(branches),branchStatus,error,message});
    const emit=reason=>{for(const listener of listeners)listener(state(),reason)};
    const capture=()=>({revision,modo,ubicacionId});
    const isCurrent=token=>token?.revision===revision&&token.modo===modo&&token.ubicacionId===ubicacionId;
    function options(){
      const selected=window.SanMartinCheckout.normalizarOpciones({modo,ubicacionId});
      if(modo==='OMNICANAL'&&(branchStatus!=='ready'||!branches.some(branch=>branch.id===selected.ubicacionId)))throw new Error('Selecciona una sucursal de destino habilitada.');
      return selected;
    }
    function touch(){revision++;sequence++;lastKey='';status='idle';error='';message='Consulta la disponibilidad de esta selección.';emit('selection');}
    function select(next){
      if(!next||!['SUCURSAL','OMNICANAL'].includes(next.modo))throw new Error('Modalidad de compra inválida.');
      const destination=next.modo==='SUCURSAL'?null:next.ubicacionId||null;
      if(destination!==null&&!branches.some(branch=>branch.id===destination))throw new Error('La sucursal elegida no está habilitada.');
      if(next.modo===modo&&destination===ubicacionId)return;
      modo=next.modo;ubicacionId=destination;touch();
    }
    function reset(){modo='SUCURSAL';ubicacionId=null;touch();}
    async function loadBranches(){
      const started=++branchRequest;branchStatus='loading';touch();emit('catalog');
      try{
        const result=await client.rpc('ecommerce_stock_omnicanal',{p_producto_ids:[],p_ubicacion_destino_id:null});
        if(started!==branchRequest)return;
        if(result.error||!Array.isArray(result.data?.sucursales))throw new Error();
        const ids=new Set();
        branches=result.data.sucursales.map(branch=>{
          if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(branch.id))||ids.has(branch.id)||typeof branch.nombre!=='string'||!branch.nombre.trim()||typeof branch.permite_recepcion!=='boolean'||typeof branch.permite_transferencia!=='boolean')throw new Error();
          ids.add(branch.id);return{id:branch.id.toLowerCase(),nombre:branch.nombre,direccion:typeof branch.direccion==='string'?branch.direccion:'',permite_recepcion:branch.permite_recepcion,permite_transferencia:branch.permite_transferencia};
        });
        branchStatus='ready';lastKey='';
        if(ubicacionId&&!branches.some(branch=>branch.id===ubicacionId)){ubicacionId=null;touch();}
        emit('catalog');
      }catch{
        if(started!==branchRequest)return;
        branches=[];branchStatus='error';sequence++;lastKey='';
        if(modo==='OMNICANAL'){status='error';error='No pudimos cargar las sucursales. Reintenta o usa la sucursal asignada de la tienda.';}
        emit('catalog');
      }
    }
    async function refresh(items){
      const key=JSON.stringify([capture(),items.map(item=>[item.producto_id,item.presentacion_id,item.cantidad,item.factor_presentacion,item.verificado])]);
      if(key===lastKey)return;
      lastKey=key;const request=++sequence,context=capture();
      if(!items.length){status='idle';error='';message='Agrega productos para consultar su disponibilidad.';emit('availability');return;}
      if(items.some(item=>!item.verificado)){status='idle';error='';message='Verificando productos y presentaciones…';emit('availability');return;}
      try{
        const selected=options();status='loading';error='';message='Consultando disponibilidad para tu selección…';emit('availability');
        const states=await window.SanMartinPresentaciones.availability(client,items,selected);
        if(request!==sequence||!isCurrent(context))return;
        const transfer=[...states.values()].some(row=>row.requiere_traslado);
        status='ready';message=transfer?'Hay disponibilidad mediante abastecimiento entre sucursales. Te avisaremos cuando esté listo.':modo==='SUCURSAL'?'Hay disponibilidad en la sucursal asignada de la tienda; se confirma al finalizar.':'Hay disponibilidad en la sucursal elegida; se confirma al finalizar.';
        emit('availability');
      }catch(problem){if(request===sequence&&isCurrent(context)){status='error';error=problem.message||'No pudimos verificar disponibilidad.';message='';emit('availability');}}
    }
    return{state,options,capture,isCurrent,select,touch,reset,loadBranches,refresh,subscribe(listener){listeners.add(listener);listener(state(),'initial');return()=>listeners.delete(listener)}};
  }
  window.SanMartinCrearContextoCompra=crear;
  window.SanMartinCompra=crear({client:window.supabaseClient});
  window.SanMartinMontarCompra=host=>{
    if(!host||host.querySelector('[data-inventory-context]'))return;
    const controller=window.SanMartinCompra,section=document.createElement('fieldset');section.dataset.inventoryContext='';section.className='inventory-context';
    section.innerHTML='<legend>Disponibilidad y sucursal</legend><label class="inventory-label">Abastecimiento<select id="inventoryMode"><option value="SUCURSAL">Stock de la sucursal asignada de la tienda</option><option value="OMNICANAL">Stock de la red de sucursales</option></select></label><label class="inventory-label" id="destinationLabel" hidden>Sucursal de destino<select id="destinationBranch"><option value="">Selecciona una sucursal</option></select></label><p id="destinationDescription" class="inventory-note"></p><p id="inventoryAvailability" class="inventory-note" role="status" aria-live="polite"></p><button id="retryBranches" type="button" hidden>Reintentar sucursales</button><button id="retryAvailability" type="button" hidden>Consultar disponibilidad otra vez</button>';
    host.prepend(section);
    const mode=section.querySelector('#inventoryMode'),destination=section.querySelector('#destinationBranch');
    mode.addEventListener('change',()=>controller.select({modo:mode.value,ubicacionId:null}));
    destination.addEventListener('change',()=>controller.select({modo:mode.value,ubicacionId:destination.value||null}));
    section.querySelector('#retryBranches').addEventListener('click',()=>{void controller.loadBranches()});
    section.querySelector('#retryAvailability').addEventListener('click',()=>controller.touch());
    controller.subscribe(current=>{
      mode.value=current.modo;section.querySelector('#destinationLabel').hidden=current.modo!=='OMNICANAL';
      const selected=current.branches.find(branch=>branch.id===current.ubicacionId);
      const choices=document.createDocumentFragment(),placeholder=document.createElement('option');placeholder.value='';placeholder.textContent=current.branchStatus==='loading'?'Cargando sucursales…':'Selecciona una sucursal';choices.append(placeholder);
      for(const branch of current.branches){const option=document.createElement('option');option.value=branch.id;option.textContent=branch.nombre;choices.append(option)}
      destination.replaceChildren(choices);destination.value=current.ubicacionId||'';destination.disabled=current.branchStatus!=='ready';
      section.querySelector('#destinationDescription').textContent=current.modo==='SUCURSAL'?'El pedido usa la sucursal asignada por la tienda. Para elegir otra sucursal, usa el stock de la red.':selected?`${selected.direccion||'Dirección por confirmar con la tienda.'} ${selected.permite_recepcion&&selected.permite_transferencia?'Puede requerir abastecimiento desde otras sucursales; espera el aviso antes de recoger o recibir tu pedido.':'Esta sucursal utiliza únicamente su stock local.'}`:'Elige dónde recoger o desde qué sucursal se preparará tu envío. El abastecimiento puede requerir traslados.';
      const feedback=section.querySelector('#inventoryAvailability');feedback.textContent=current.error||current.message;feedback.classList.toggle('inventory-error',current.status==='error');
      section.querySelector('#retryBranches').hidden=current.branchStatus!=='error';section.querySelector('#retryAvailability').hidden=current.status!=='error';
    });
    void controller.loadBranches();
  };
})();

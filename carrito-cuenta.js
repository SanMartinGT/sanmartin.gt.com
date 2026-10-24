/* Presentación compartida del carrito: catálogo, ficha y cuenta usan el mismo estado. */
(() => {
  const store = window.SanMartinCarrito;
  if (!store || window.SanMartinCartUI) return;
  window.SanMartinCartUI = true;
  const panel = document.createElement('section');
  panel.className = 'cart-account-notice'; panel.hidden = true;
  panel.setAttribute('aria-live', 'polite'); panel.setAttribute('aria-label', 'Selección del carrito');
  document.body.append(panel);
  const labels = {
    guest: ['Tienes un carrito de invitado', 'Combinar suma las cantidades de productos y presentaciones iguales. Usar el invitado sustituye el carrito de tu cuenta. También puedes conservarlos separados.', [['merge', 'Combinar ambos'], ['replace', 'Usar solo el invitado'], ['separate', 'Conservar separados']]],
    legacy: ['Encontramos un carrito anterior', 'No sabemos a qué persona pertenecía. Agrégalo a tu carrito solo si reconoces su contenido; también puedes descartarlo o dejarlo para después.', [['import', 'Agregar a este carrito'], ['discard', 'Descartar anterior'], ['later', 'Dejar para después']]],
    conflict: ['Tu carrito cambió en otro lugar', 'Hay cambios guardados en línea y cambios de esta cuenta en el navegador. Elige cuál conservar antes de continuar.', [['remote', 'Usar el guardado en línea'], ['local', 'Guardar el de este navegador']]],
    tabs: ['Otra pestaña cambió este carrito', 'Elige qué cambios conservar. Revisaremos también la versión guardada en tu cuenta.', [['remote', 'Usar el de la otra pestaña'], ['local', 'Conservar mis cambios']]]
  };
  function draw(state) {
    panel.replaceChildren();
    panel.hidden = !['error', 'decision', 'loading'].includes(state.status) && !state.reviewable;
    if (panel.hidden) return;
    if (state.status === 'ready' && state.reviewable) {
      const button = document.createElement('button'); button.type = 'button'; button.textContent = 'Revisar carritos que dejé separados';
      button.addEventListener('click', () => store.reviewPending()); panel.append(button); return;
    }
    const title = document.createElement('strong'), message = document.createElement('p'), actions = document.createElement('div');
    const config = state.status === 'decision' ? labels[state.decision?.kind] : null;
    title.textContent = config?.[0] || (state.status === 'error' ? 'No pudimos abrir el carrito' : 'Cargando tu carrito…');
    message.textContent = state.error || config?.[1] || 'Verificando la cuenta y los productos.';
    panel.append(title, message);
    if (config) {
      const details = document.createElement('p');
      details.textContent = `Carrito actual: ${state.items.length} líneas. Carrito por revisar: ${state.decision.count} líneas.`;
      panel.append(details);
      const preview = document.createElement('ul');
      for (const item of state.decision.items) {
        const row = document.createElement('li'); row.textContent = `${item.nombre} · ${item.cantidad}${item.presentacion_id ? ' presentaciones' : ''}`; preview.append(row);
      }
      panel.append(preview);
      for (const [action, label] of config[2]) {
        const button = document.createElement('button'); button.type = 'button'; button.textContent = label;
        button.addEventListener('click', async () => {
          if (store.state().generation !== state.generation || store.state().revision !== state.revision) return;
          actions.querySelectorAll('button').forEach(control => { control.disabled = true; });
          await store.choose(action);
        }); actions.append(button);
      }
    } else if (state.status === 'error') {
      const button = document.createElement('button'); button.type = 'button'; button.textContent = 'Reintentar';
      button.addEventListener('click', () => { void store.retry(); }); actions.append(button);
    }
    panel.append(actions);
  }
  store.subscribe((state, reason) => {
    draw(state);
    if (typeof renderCart !== 'function') return;
    cart = state.items;
    // Los controles del catálogo ya dibujan sus cambios. Evitar otro innerHTML
    // durante change/blur; un acuse de guardado tampoco modifica sus líneas.
    if (reason === 'edit' || reason === 'saved') return;
    if (reason === 'identity') {
      selectedDelivery = ''; selectedPayment = '';
      window.SanMartinCompra.reset();
      document.querySelectorAll('input[name="deliveryMethod"], input[name="paymentMethod"]').forEach(input => { input.checked = false; });
      toggleCart(false);
    }
    renderCart();
    if ((reason === 'load' || reason === 'initial') && state.status === 'ready') void hidratarCarrito();
  });
})();

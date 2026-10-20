// Vista previa local de invitados (solo en la compu o la red de casa, nunca publicada):
//   ?invite=demo   → 4 invitados   |   ?invite=demo1 → 1 invitado
// Simula la respuesta de Supabase para que invitation-personalization.js corra igual que con un token real.
(function () {
  // También al abrir index.html con doble clic (file://)
  var localHost = window.location.protocol === 'file:' ||
    /^(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+)$/.test(window.location.hostname);
  var params = new URLSearchParams(window.location.search);
  // Abierto con doble clic no hay ?invite=: se muestra el ejemplo de 4 invitados
  if (window.location.protocol === 'file:' && !params.has('invite')) {
    params.set('invite', 'demo');
    history.replaceState(null, '', '?' + params.toString());
  }
  var token = params.get('invite');
  if (!localHost || !token || token.indexOf('demo') !== 0) return;

  var invites = {
    demo: { first_name: 'Lucía', companions: [{ first_name: 'Martín' }, { first_name: 'Sofía' }, { first_name: 'Tomás' }] },
    demo1: { first_name: 'Valentina', companions: [] }
  };
  var invite = invites[token] || invites.demo;
  var realFetch = window.fetch.bind(window);

  window.fetch = function (url, options) {
    if (String(url).indexOf('/rpc/get_invite_by_token') === -1) return realFetch(url, options);
    var row = Object.assign({ event_slug: 'pilar-15' }, invite);
    return Promise.resolve(new Response(JSON.stringify([row]), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    }));
  };
})();

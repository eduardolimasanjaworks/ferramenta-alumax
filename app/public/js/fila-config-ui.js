/**
 * UI de configuração das filas de atendimento (departamentos + membros).
 * Abrido a partir do card Fila — modal estilo TechFala, sem popup Bubble.
 */
(function () {
  'use strict';

  var filasCache = [];
  var agentsCache = [];
  var filaSelecionadaId = null;
  var rascunhoMembros = [];

  function el(id) {
    return document.getElementById(id);
  }

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/"/g, '&quot;');
  }

  function setStatus(msg) {
    var s = el('filas-status');
    if (s) s.textContent = msg || '';
  }

  window.abrirModalFilas = function () {
    var m = el('modal-filas');
    if (m) m.classList.add('open');
    carregarFilas();
  };

  window.fecharModalFilas = function () {
    var m = el('modal-filas');
    if (m) m.classList.remove('open');
  };

  async function carregarFilas() {
    setStatus('Carregando filas…');
    try {
      var res = await fetch('/api/ia/fila-atendimento/filas', { credentials: 'same-origin' });
      var data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.erro || 'Falha ao listar filas');
      filasCache = data.filas || [];
      agentsCache = data.agents || [];
      renderListaFilas();
      if (filaSelecionadaId) {
        var still = filasCache.find(function (f) { return f.id === filaSelecionadaId; });
        if (still) selecionarFila(still.id);
        else if (filasCache[0]) selecionarFila(filasCache[0].id);
        else limparEditor();
      } else if (filasCache[0]) {
        selecionarFila(filasCache[0].id);
      } else {
        limparEditor();
      }
      setStatus(filasCache.length + ' fila(s)');
    } catch (err) {
      setStatus('Erro: ' + err.message);
    }
  }

  function limparEditor() {
    filaSelecionadaId = null;
    rascunhoMembros = [];
    var nome = el('fila-nome-atual');
    var prox = el('fila-proximo');
    var wrap = el('fila-membros-lista');
    var regra = el('fila-quando-transferir');
    var btnApagar = el('fila-btn-apagar');
    if (nome) nome.textContent = 'Selecione uma fila';
    if (prox) prox.textContent = '—';
    if (wrap) wrap.innerHTML = '<p class="senha-account">Nenhuma fila selecionada</p>';
    if (regra) regra.value = '';
    if (btnApagar) btnApagar.style.display = 'none';
  }

  function renderListaFilas() {
    var ul = el('filas-lista-side');
    if (!ul) return;
    if (!filasCache.length) {
      ul.innerHTML = '<li class="filas-empty">Nenhuma fila. Crie a primeira.</li>';
      return;
    }
    ul.innerHTML = filasCache.map(function (f) {
      var on = f.id === filaSelecionadaId ? ' active' : '';
      return '<li><button type="button" class="filas-side-btn' + on + '" onclick="selecionarFila(' + f.id + ')">'
        + esc(f.name) + '<small>' + (f.membros || []).length + ' atendente(s)</small></button></li>';
    }).join('');
  }

  window.selecionarFila = function (id) {
    filaSelecionadaId = Number(id);
    var f = filasCache.find(function (x) { return x.id === filaSelecionadaId; });
    if (!f) return limparEditor();
    rascunhoMembros = (f.membros || []).map(function (m) {
      return { id: m.id, name: m.name, email: m.email };
    });
    var nome = el('fila-nome-atual');
    var prox = el('fila-proximo');
    var regra = el('fila-quando-transferir');
    var btnApagar = el('fila-btn-apagar');
    if (nome) nome.textContent = f.name;
    if (prox) {
      prox.textContent = f.proximo
        ? (f.proximo.name || f.proximo.email)
        : 'Nenhum atendente na fila';
    }
    if (regra) regra.value = f.quando_transferir || '';
    if (btnApagar) btnApagar.style.display = 'inline-flex';
    renderListaFilas();
    renderMembros();
  };

  function optionsAgents(selectedId) {
    var opts = '<option value="">Selecionar e-mail</option>';
    agentsCache.forEach(function (a) {
      var label = (a.name ? a.name + ' — ' : '') + a.email;
      var sel = Number(a.id) === Number(selectedId) ? ' selected' : '';
      opts += '<option value="' + a.id + '"' + sel + '>' + esc(label) + '</option>';
    });
    return opts;
  }

  function renderMembros() {
    var wrap = el('fila-membros-lista');
    if (!wrap) return;
    if (!rascunhoMembros.length) {
      wrap.innerHTML = '<p class="senha-account">Nenhum atendente nesta fila.</p>';
      return;
    }
    wrap.innerHTML = rascunhoMembros.map(function (m, idx) {
      return '<div class="fila-membro-row" data-idx="' + idx + '">'
        + '<select class="fila-membro-agent" onchange="onFilaMembroChange(' + idx + ')">'
        + optionsAgents(m.id) + '</select>'
        + '<button type="button" class="secondary btn-icon" onclick="removerMembroFila(' + idx + ')" title="Remover">×</button>'
        + '</div>';
    }).join('');
  }

  window.onFilaMembroChange = function (idx) {
    var row = document.querySelector('.fila-membro-row[data-idx="' + idx + '"] select');
    if (!row || !rascunhoMembros[idx]) return;
    var id = Number(row.value);
    var agent = agentsCache.find(function (a) { return a.id === id; });
    rascunhoMembros[idx].id = id;
    rascunhoMembros[idx].email = agent ? agent.email : '';
    rascunhoMembros[idx].name = agent ? (agent.name || '') : '';
  };

  window.adicionarMembroFila = function () {
    if (!filaSelecionadaId) {
      alert('Selecione ou crie uma fila primeiro');
      return;
    }
    rascunhoMembros.push({ id: 0, name: '', email: '' });
    renderMembros();
  };

  window.removerMembroFila = function (idx) {
    rascunhoMembros.splice(idx, 1);
    renderMembros();
  };

  window.salvarMembrosFila = async function () {
    if (!filaSelecionadaId) return;
    var membros = rascunhoMembros
      .filter(function (m) { return Number(m.id) > 0; })
      .map(function (m) { return { id: Number(m.id) }; });
    var quando = (el('fila-quando-transferir') && el('fila-quando-transferir').value) || '';
    setStatus('Salvando…');
    try {
      var resM = await fetch('/api/ia/fila-atendimento/filas/' + filaSelecionadaId + '/membros', {
        method: 'PUT',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ membros: membros }),
      });
      var dataM = await resM.json();
      if (!resM.ok || !dataM.ok) throw new Error(dataM.erro || 'Falha ao salvar membros');

      var resR = await fetch('/api/ia/fila-atendimento/filas/' + filaSelecionadaId, {
        method: 'PATCH',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quando_transferir: quando }),
      });
      var dataR = await resR.json();
      if (!resR.ok || !dataR.ok) throw new Error(dataR.erro || 'Falha ao salvar regra');

      await carregarFilas();
      setStatus('Fila salva');
    } catch (err) {
      setStatus('Erro: ' + err.message);
      alert(err.message);
    }
  };

  window.apagarFilaAtendimento = async function () {
    if (!filaSelecionadaId) return;
    var f = filasCache.find(function (x) { return x.id === filaSelecionadaId; });
    var nome = f ? f.name : ('#' + filaSelecionadaId);
    if (!confirm('Apagar a fila "' + nome + '"?\n\nOs atendentes deixam de estar neste departamento. Esta ação não apaga usuários do painel.')) {
      return;
    }
    setStatus('Apagando…');
    try {
      var res = await fetch('/api/ia/fila-atendimento/filas/' + filaSelecionadaId, {
        method: 'DELETE',
        credentials: 'same-origin',
      });
      var data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.erro || 'Falha ao apagar');
      filaSelecionadaId = null;
      await carregarFilas();
      setStatus('Fila apagada');
    } catch (err) {
      setStatus('Erro: ' + err.message);
      alert(err.message);
    }
  };

  window.criarFilaAtendimento = async function () {
    var input = el('fila-nova-nome');
    var nome = (input && input.value || '').trim();
    if (!nome) {
      alert('Informe o nome da fila');
      return;
    }
    setStatus('Criando fila…');
    try {
      var res = await fetch('/api/ia/fila-atendimento/filas', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome: nome }),
      });
      var data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.erro || 'Falha ao criar');
      if (input) input.value = '';
      filaSelecionadaId = data.fila && data.fila.id;
      await carregarFilas();
    } catch (err) {
      setStatus('Erro: ' + err.message);
      alert(err.message);
    }
  };
})();

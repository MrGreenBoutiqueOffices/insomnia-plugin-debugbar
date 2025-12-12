module.exports.requestActions = [{
  label: '👾 Debugbar meta',
  icon: 'bug',
  action: async (context, data) => {
    const { request } = data;

    try {
      await context.network.sendRequest(request);

    } catch (err) {
      
      context.app.alert('Preview Fout', `Het verzoek kon niet worden verzonden. Fout: ${err.message}`);
    }
  },
}];

module.exports.responseHooks = [
  async (context) => {
    const decoder = new TextDecoder();
    const body = decoder.decode(await context.response.getBody());

    const jsonBody = JSON.parse(body);

    if (jsonBody?.meta?.debugbar) {
      DisplayModal(context, jsonBody.meta.debugbar);
    }
  },
]

function DisplayModal(context, meta) {
    console.log('meta', meta);

    document.getElementById('debugbar-pane')?.remove();

    const tabPane = document.querySelector('#pane-two [aria-label="Request pane tabs"]')
    const tabButton = document.createElement('div');
    tabButton.id = 'debugbar-pane'
    tabButton.className = "flex h-full flex-shrink-0 cursor-pointer select-none items-center justify-between gap-2 px-3 py-1 text-[--hl] outline-none transition-colors duration-300 hover:bg-[--hl-sm] hover:text-[--color-font] focus:bg-[--hl-sm] aria-selected:bg-[--hl-xs] aria-selected:text-[--color-font] aria-selected:hover:bg-[--hl-sm] aria-selected:focus:bg-[--hl-sm]";
    tabButton.innerHTML = 'Debugbar <span class="shadow-small flex aspect-square items-center justify-between overflow-hidden rounded-lg border border-solid border-[--hl-md] p-2 text-xs">'+meta.queries.count+'</span>';
    tabPane.prepend(tabButton);


    const container = document.createElement('div');
    document.head.innerHTML += '<link rel="stylesheet" href="styles.css" type="text/css"/>';



    container.innerHTML = `
      <div class="debugbar__container">
        <style type="text/css">
          .modal__debugbar h3 { font-size: 2rem !important; }
          .modal__debugbar table { width: 100%; border-collapse: collapse; }
          .modal__debugbar th { width: 50%; }
          .modal__debugbar th, .modal__debugbar td { padding: 1rem; text-align: left; }

          .debugbar__panel { display: none; }
          .debugbar__panel[aria-selected="true"] { display: block !important; }
        </style>

        <div class="modal__debugbar flex h-full w-full flex-1 flex-col">
          <div id="modal__debugbar--tabbar" class="flex h-[--line-height-sm] w-full flex-shrink-0 items-center overflow-x-auto border-b border-solid border-b-[--hl-md] bg-[--color-bg]">

          </div>

          ${createPanel('meta', 'Meta', `
            <h3>General</h3>
            ${createTable([['PHP', meta.php.interface + ' ' + meta.php.version], ['Memory', meta.memory.peak_usage_str], ['Time', meta.time.duration_str]])}

            <h3>Time</h3>
            ${createTable([['Count', meta.time.count + ' ' + meta.php.version], ['Duration', meta.time.duration_str]])}

            <h4>Measures</h4>
            ${createTable(meta.time.measures.map(function (measure) {
              return [measure.label, measure.start - measure.end];
            }))}
          `)}

          ${createPanel('events', 'Events', `
            <h3>General</h3>
            ${createTable([['Count', meta.event.count], ['Duration', meta.event.duration_str]])}

            <h4>Measures</h4>
            ${createTable(meta.event.measures.map(function (measure) {
              return [measure.label, measure.start - measure.end];
            }))}
          `)}

          ${createPanel('query', 'Queries', `
            <h3>General</h3>
            ${createTable([['Count', meta.queries.count], ['Duration', meta.queries.accumulated_duration_str], ['Memory', meta.queries.memory_usage], ['Memory', meta.queries.memory_usage]])}

            <h4>Statements</h4>
            ${createTable(meta.queries.statements.map(function (measure) {
              return [measure.sql, measure.duration_str];
            }))}
          `)}

          ${createPanel('route', 'Route', `
            <h3>General</h3>
            ${createTable([['Name', meta.route.as], ['Controller', meta.route.controller], ['middleware', meta.route.middleware], ['Uri', meta.route.uri]])}

          `)}
        </div>
      </div>
    `;


    tabButton.addEventListener('click', function () {
      context.app.dialog('Debugbar meta', container);
    });

    container.querySelector('#modal__debugbar--tabbar').append(createPane('meta', 'Meta'));
    container.querySelector('#modal__debugbar--tabbar').append(createPane('events', 'Events', meta.event.count));
    container.querySelector('#modal__debugbar--tabbar').append(createPane('query', 'Queries', meta.queries.count));
    container.querySelector('#modal__debugbar--tabbar').append(createPane('route', 'Route'));
}

function onTabPress(event) {
  console.log('on tab press', event);

}

function createPane(id, title, badge = false) {
  const button = document.createElement('button');
  button.id = `pane-${id}`;
  button.className = "pane-button flex h-full flex-shrink-0 cursor-pointer select-none items-center justify-between gap-2 px-3 py-1 text-[--hl] outline-none transition-colors duration-300 hover:bg-[--hl-sm] hover:text-[--color-font] focus:bg-[--hl-sm] aria-selected:bg-[--hl-xs] aria-selected:text-[--color-font] aria-selected:hover:bg-[--hl-sm] aria-selected:focus:bg-[--hl-sm]"
  button.innerHTML = `${title} ${badge ? `<span class="shadow-small flex aspect-square items-center justify-between overflow-hidden rounded-lg border border-solid border-[--hl-md] p-2 text-xs">${badge}</span>` : ``}`;
  if (id === 'meta') {
    button.setAttribute('aria-selected', true);
  }

  button.addEventListener('click', function () {
    console.log('selected on', id);
    document.querySelector('.pane-button[aria-selected="true"]')?.setAttribute('aria-selected', false);
    document.querySelector(`#pane-${id}`).setAttribute('aria-selected', true);

    document.querySelector('.debugbar__panel[aria-selected="true"]')?.setAttribute('aria-selected', false);
    document.querySelector(`#debugbar__panel-${id}`)?.setAttribute('aria-selected', true);
  });

  return button;
}

function createPanel(id, title, content) {
  return `<div id="debugbar__panel-${id}" class="debugbar__panel editor editor--readonly py-4" aria-selected="${id === 'meta' ? 'true' : 'false'}">
    ${content}
  </div>`;
}

function createTable(data) {
  return `
    <table>
    <thead>
    ${data.map(row => `
      <tr>
        <th>${row[0]}</th>
        <td>${row[1]}</td>
      </tr>
    `).join('')}
    </thead>
    </table>
  `;
}
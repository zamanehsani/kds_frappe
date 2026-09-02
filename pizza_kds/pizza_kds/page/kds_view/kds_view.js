const DEV_SERVER_ORIGIN = 'http://localhost:5173';
const MANIFEST_PATH = '/assets/pizza_kds/kds/.vite/manifest.json';
const LOADED_STYLE_IDS = new Set();

function ensureRoot(wrapper) {
    $(wrapper).find('.layout-main-section').empty().append('<div id="root"></div>');
}

function appendModuleScript(src) {
    const script = document.createElement('script');
    script.type = 'module';
    script.src = src;
    document.head.appendChild(script);
    return script;
}

function appendStylesheet(href) {
    if (LOADED_STYLE_IDS.has(href)) {
        return;
    }

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    document.head.appendChild(link);
    LOADED_STYLE_IDS.add(href);
}

function loadFromDevServer() {
    const preamble = document.createElement('script');
    preamble.type = 'module';
    preamble.innerHTML = `
        import RefreshRuntime from '${DEV_SERVER_ORIGIN}/@react-refresh'
        RefreshRuntime.injectIntoGlobalHook(window)
        window.$RefreshReg$ = () => {}
        window.$RefreshSig$ = () => (type) => type
        window.__vite_plugin_react_preamble_installed__ = true
    `;
    document.head.appendChild(preamble);

    const viteClient = appendModuleScript(`${DEV_SERVER_ORIGIN}/@vite/client`);
    viteClient.onload = () => appendModuleScript(`${DEV_SERVER_ORIGIN}/src/main.tsx`);
}

async function loadFromBuiltAssets() {
    const response = await fetch(MANIFEST_PATH, { cache: 'no-store' });

    if (!response.ok) {
        throw new Error(`Manifest request failed with status ${response.status}`);
    }

    const manifest = await response.json();
    const entry = manifest['index.html'];

    if (!entry?.file) {
        throw new Error('Built entry for index.html was not found in the manifest');
    }

    (entry.css || []).forEach((href) => appendStylesheet(`/assets/pizza_kds/kds/${href}`));
    appendModuleScript(`/assets/pizza_kds/kds/${entry.file}`);
}

frappe.pages['kds_view'].on_page_load = function(wrapper) {
    frappe.ui.make_app_page({
        parent: wrapper,
        title: 'Kitchen Display System',
        single_column: true
    });

    ensureRoot(wrapper);
    loadFromDevServer();

    // Production mode:
    // loadFromBuiltAssets().catch(() => {
    //     loadFromDevServer();
    // });
}
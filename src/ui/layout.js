// src/ui/layout.js
// Layout manager responsible for mounting core UI layers (Header, Main, Footer, OverlayLayer, ModalLayer, DrawerLayer, ToastLayer, TooltipLayer)

export const layout = {
  init(appRootId = 'app') {
    const appRoot = document.getElementById(appRootId);
    if (!appRoot) {
      console.error('App root not found');
      return;
    }
    // Create layers
    const header = document.createElement('header');
    header.id = 'ui-header';
    const main = document.createElement('main');
    main.id = 'ui-main';
    const footer = document.createElement('footer');
    footer.id = 'ui-footer';
    const overlay = document.createElement('div');
    overlay.id = 'ui-overlay-layer';
    const modal = document.createElement('div');
    modal.id = 'ui-modal-layer';
    const drawer = document.createElement('div');
    drawer.id = 'ui-drawer-layer';
    const toast = document.createElement('div');
    toast.id = 'ui-toast-layer';
    const tooltip = document.createElement('div');
    tooltip.id = 'ui-tooltip-layer';

    // Append layers in order
    appRoot.appendChild(header);
    appRoot.appendChild(main);
    appRoot.appendChild(footer);
    appRoot.appendChild(overlay);
    appRoot.appendChild(modal);
    appRoot.appendChild(drawer);
    appRoot.appendChild(toast);
    appRoot.appendChild(tooltip);
  }
};

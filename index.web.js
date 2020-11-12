// Fetch Polyfill
import 'whatwg-fetch';

// Airbnb Polyfills
// import 'airbnb-js-shims';

import React from 'react';
import 'resize-observer-polyfill/dist/ResizeObserver.global';
import { Provider } from 'react-redux';
import { AppRegistry } from 'react-native';

// import { FBApp, FBLog } from './src/services/FBKit/FBKit';

// import Package from './package.json';

import Configs from './src/configs';

import store from './src/store';

import Firebase from './src/services/Firebase';

const App = require('./src/App').default;

// Promise Polyfill
require('es6-promise').polyfill();

// CoreJS Polyfills
require('core-js/es6/object');
require('core-js/es6/map');

// StartsWith & EndsWith Polyfills
if (typeof String.prototype.startsWith !== 'function') {
    String.prototype.startsWith = function (str) {
        return this.indexOf(str) === 0;
    };
}

if (typeof String.prototype.endsWith !== 'function') {
    String.prototype.endsWith = function (str) {
        return this.indexOf(str, this.length - str.length) !== -1;
    };
}

// Define new function - trimSuffx
String.prototype.trimSuffix = function (suffix) {
    if (this.endsWith(suffix)) {
        return this.slice(0, -suffix.length);
    }
    return this;
};

// Root element
const rootElement = document.getElementById('TONContainer');

// Get supported properties
const properties = {};

// Add supported props here
const props = ['development', 'mode'];
props.forEach((property) => {
    property.split(/\s+/).forEach((name) => {
        const val = rootElement.getAttribute(`data-${name}`);
        properties[name] = /^(-?\d+(\.\d+)?|true|false)$/.test(val) ? JSON.parse(val) : val;
    });
});

// Head Element
const headElement = document.getElementsByTagName('head')[0];

// import Roboto font
/* const robotoFont = headElement.appendChild(document.createElement('link'));
robotoFont.setAttribute('href', 'https://fonts.googleapis.com/css?family=Roboto&subset=latin-ext');
robotoFont.setAttribute('rel', 'stylesheet'); */

// Import IBM Plex Sans
const plexSansFont = headElement.appendChild(document.createElement('link'));
plexSansFont.setAttribute('href', 'https://fonts.googleapis.com/css?family=IBM+Plex+Sans:300,400,500,700&amp;subset=cyrillic,latin-ext');
plexSansFont.setAttribute('rel', 'stylesheet');

const ptRootFontBold = headElement.appendChild(document.createElement('link'));
ptRootFontBold.setAttribute('href', 'https://tonlabs.io/fonts/PT%20Root%20UI_Bold.css');
ptRootFontBold.setAttribute('rel', 'stylesheet');
const ptRootFontLight = headElement.appendChild(document.createElement('link'));
ptRootFontLight.setAttribute('href', 'https://tonlabs.io/fonts/PT%20Root%20UI_Light.css');
ptRootFontLight.setAttribute('rel', 'stylesheet');
const ptRootFontMedium = headElement.appendChild(document.createElement('link'));
ptRootFontMedium.setAttribute('href', 'https://tonlabs.io/fonts/PT%20Root%20UI_Medium.css');
ptRootFontMedium.setAttribute('rel', 'stylesheet');
const ptRootFontRegular = headElement.appendChild(document.createElement('link'));
ptRootFontRegular.setAttribute('href', 'https://tonlabs.io/fonts/PT%20Root%20UI_Regular.css');
ptRootFontRegular.setAttribute('rel', 'stylesheet');

// Import GCM manifest
const manifest = headElement.appendChild(document.createElement('link'));
manifest.setAttribute('href', 'https://widget.ton.chat/manifest.json');
manifest.setAttribute('rel', 'manifest');

// Import FirebaseUI CSS
const firebaseCSS = headElement.appendChild(document.createElement('link'));
firebaseCSS.setAttribute('href', 'https://cdn.firebase.com/libs/firebaseui/3.0.0/firebaseui.css');
firebaseCSS.setAttribute('type', 'text/css');
firebaseCSS.setAttribute('rel', 'stylesheet');

const AppComponent = () => {
    // FBApp.configure(properties.development);
    // FBLog.configure(properties.development, Package.version);
    Firebase.init();
    return (
        <Provider store={store}>
            <App source={properties.source} mode={properties.mode || 'widget'} />
        </Provider>
    );
};

AppRegistry.registerComponent('AppComponent', () => AppComponent);

AppRegistry.runApplication('AppComponent', {
    initialProps: {},
    rootTag: rootElement,
});

// Style React Root div
const reactRoot = document.querySelectorAll('[data-reactroot]')[0];
if (reactRoot) {
    reactRoot.style.all = 'initial';
    reactRoot.style.height = '0px';
    reactRoot.style.width = '0px';
    reactRoot.className = ''; // empty + { all: initial } is better than cleanslate
}

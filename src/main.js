/**
 * Application entry point
 * Initializes the app and mounts root components
 */

import './styles/base.css';
import { initApp } from './app.js';

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', () => {
  initApp();
});

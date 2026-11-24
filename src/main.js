// Boots the app and wires everything. Filled in by later tasks.
import { createBus } from './core/events.js';
import { mountScene } from './ui/scene.js';

const bus = createBus();
const app = document.getElementById('app');
if (app) mountScene(app, window.location.search);
export { bus };

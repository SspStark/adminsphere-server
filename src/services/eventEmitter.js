import EventEmitter from 'events';
import { emitForceLogout } from './socketService.js';

const appEvents = new EventEmitter();

appEvents.on("SESSION_REPLACE", ({ userId }) => {
    emitForceLogout(userId);
})

export default appEvents;


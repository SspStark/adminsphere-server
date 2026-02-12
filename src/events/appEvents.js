import EventEmitter from 'events';
import { socketEmitter } from '../integrations/socket/socketEmitter.js';

const appEvents = new EventEmitter();

appEvents.on("SESSION_REPLACE", ({ userId }) => {
    socketEmitter.forceLogout(userId);
})

export default appEvents;


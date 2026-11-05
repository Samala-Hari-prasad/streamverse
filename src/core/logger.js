// logger.js
// Simple logger with configurable level and namespaced helpers
const LEVEL_ORDER = ['debug', 'info', 'warn', 'error'];
let env = (typeof process !== 'undefined' && process.env && process.env.NODE_ENV) ? process.env.NODE_ENV : 'development';
let currentLevel = env === 'production' ? 'warn' : 'debug';
function shouldLog(level){return LEVEL_ORDER.indexOf(level)>=LEVEL_ORDER.indexOf(currentLevel);}
function log(level,...args){if(shouldLog(level)){console[level](...args);}}
export const logger={debug:(...a)=>log('debug',...a),info:(...a)=>log('info',...a),warn:(...a)=>log('warn',...a),error:(...a)=>log('error',...a),setLevel:(lvl)=>{if(LEVEL_ORDER.includes(lvl))currentLevel=lvl;},create:(ns)=>({debug:(...a)=>logger.debug(`[${ns}]`,...a),info:(...a)=>logger.info(`[${ns}]`,...a),warn:(...a)=>logger.warn(`[${ns}]`,...a),error:(...a)=>logger.error(`[${ns}]`,...a)})};

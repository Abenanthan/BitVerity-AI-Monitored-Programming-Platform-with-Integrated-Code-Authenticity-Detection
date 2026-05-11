/**
 * socketManager — singleton that holds the Socket.IO server instance.
 *
 * This lets any module (e.g. submissions controller) emit events directly
 * without going through Redis pub/sub. Redis remains an optional transport
 * for multi-process deployments, but is not required for single-process dev.
 */

let _io = null;

function setIo(io) {
  _io = io;
}

function getIo() {
  return _io;
}

/**
 * Emit an event to a specific Socket.IO room.
 * Safe to call even before the socket server is initialised (no-op).
 */
function emitToRoom(room, event, data) {
  if (!_io) return false;
  _io.to(room).emit(event, data);
  return true;
}

module.exports = { setIo, getIo, emitToRoom };

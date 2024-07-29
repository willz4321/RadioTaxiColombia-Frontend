// socket.js
import io from 'socket.io-client';
const id_usuario = localStorage.getItem('id_usuario');
const socket = io(`${process.env.REACT_APP_API_URL}`, { reconnection: true , query: { id_usuario }});
export default socket;
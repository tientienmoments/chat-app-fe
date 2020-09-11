import io from 'socket.io-client';
const REACT_APP_BASE_URL = process.env.REACT_APP_BASE_URL
console.log("check local", REACT_APP_BASE_URL)
const socket = io(REACT_APP_BASE_URL);

export default socket
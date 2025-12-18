import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Configurar axios con interceptor para el token
const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar token automáticamente
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor para manejar errores 401
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const api = {
  // Auth endpoints
  async login(email, password) {
    const response = await apiClient.post('/auth/login', { email, password });
    return response.data;
  },

  async register(username, email, password) {
    const response = await apiClient.post('/auth/register', { username, email, password });
    return response.data;
  },

  async getMe() {
    const response = await apiClient.get('/auth/me');
    return response.data;
  },

  // Characters endpoints
  async getCharacters() {
    const response = await apiClient.get('/characters');
    return response.data;
  },

  async addCharacter(character) {
    const response = await apiClient.post('/characters', { character });
    return response.data;
  },

  async deleteCharacter(character) {
    const response = await apiClient.delete(`/characters/${encodeURIComponent(character)}`);
    return response.data;
  },

  // Games endpoints
  async createGame(data) {
    const response = await apiClient.post('/games/create', data);
    return response.data;
  },

  async joinGame(roomCode, characters, avatar) {
    const response = await apiClient.post('/games/join', { roomCode, characters, avatar });
    return response.data;
  },

  async getGame(roomCode) {
    const response = await apiClient.get(`/games/${roomCode}`);
    return response.data;
  },

  async startGame(roomCode) {
    const response = await apiClient.post(`/games/${roomCode}/start`);
    return response.data;
  },

  async hitCharacter(roomCode, timeLeft = null) {
    const body = timeLeft !== null ? { timeLeft } : {};
    const response = await apiClient.post(`/games/${roomCode}/hit`, body);
    return response.data;
  },

  async failCharacter(roomCode) {
    const response = await apiClient.post(`/games/${roomCode}/fail`);
    return response.data;
  },

  async playerReady(roomCode) {
    const response = await apiClient.post(`/games/${roomCode}/ready`);
    return response.data;
  },

  async roundIntroSeen(roomCode) {
    const response = await apiClient.post(`/games/${roomCode}/round-intro-seen`);
    return response.data;
  },

  async updateTimer(roomCode, isPaused, timeLeft = null) {
    const body = { isPaused };
    if (timeLeft !== null) {
      body.timeLeft = timeLeft;
    }
    const response = await apiClient.post(`/games/${roomCode}/timer`, body);
    return response.data;
  },

  async cancelGame(roomCode) {
    const response = await apiClient.delete(`/games/${roomCode}`);
    return response.data;
  },

  async leaveGame(roomCode) {
    const response = await apiClient.post(`/games/${roomCode}/leave`);
    return response.data;
  },

  // Categories endpoints
  async getCategories() {
    const response = await apiClient.get('/categories');
    return response.data;
  },

  async getCategory(id) {
    const response = await apiClient.get(`/categories/${id}`);
    return response.data;
  },
};

export { API_URL };

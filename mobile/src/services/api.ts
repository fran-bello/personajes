import axios, { AxiosInstance } from 'axios';
import * as SecureStore from 'expo-secure-store';

// Cambiar esto a tu IP local o URL del servidor
const API_URL = 'http://192.168.100.3:3001/api';

class ApiService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.client.interceptors.request.use(
      async (config) => {
        const token = await SecureStore.getItemAsync('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          await SecureStore.deleteItemAsync('token');
        }
        return Promise.reject(error);
      }
    );
  }

  // Auth endpoints
  async login(email: string, password: string) {
    const response = await this.client.post('/auth/login', { email, password });
    return response.data;
  }

  async register(username: string, email: string, password: string) {
    const response = await this.client.post('/auth/register', { username, email, password });
    return response.data;
  }

  async loginWithGoogle(googleData: { googleId: string; email: string; name: string; picture?: string }) {
    const response = await this.client.post('/auth/google', googleData);
    return response.data;
  }

  async getMe() {
    const response = await this.client.get('/auth/me');
    return response.data;
  }

  // Characters endpoints
  async getCharacters() {
    const response = await this.client.get('/characters');
    return response.data;
  }

  async addCharacter(character: string) {
    const response = await this.client.post('/characters', { character });
    return response.data;
  }

  async deleteCharacter(character: string) {
    const response = await this.client.delete(`/characters/${encodeURIComponent(character)}`);
    return response.data;
  }

  // Games endpoints
  async createGame(data: {
    characters: string[];
    timePerRound: number;
    numPlayers: number;
    gameMode: string;
    charactersPerPlayer: number;
  }) {
    const response = await this.client.post('/games/create', data);
    return response.data;
  }

  async joinGame(roomCode: string, characters?: string[]) {
    const response = await this.client.post('/games/join', { roomCode, characters });
    return response.data;
  }

  async getGame(roomCode: string) {
    const response = await this.client.get(`/games/${roomCode}`);
    return response.data;
  }

  async startGame(roomCode: string) {
    const response = await this.client.post(`/games/${roomCode}/start`);
    return response.data;
  }

  async hitCharacter(roomCode: string) {
    const response = await this.client.post(`/games/${roomCode}/hit`);
    return response.data;
  }

  async failCharacter(roomCode: string) {
    const response = await this.client.post(`/games/${roomCode}/fail`);
    return response.data;
  }

  async playerReady(roomCode: string) {
    const response = await this.client.post(`/games/${roomCode}/ready`);
    return response.data;
  }

  async roundIntroSeen(roomCode: string) {
    const response = await this.client.post(`/games/${roomCode}/round-intro-seen`);
    return response.data;
  }

  async updateTimer(roomCode: string, isPaused: boolean) {
    const response = await this.client.post(`/games/${roomCode}/timer`, { isPaused });
    return response.data;
  }

  // Categories endpoints
  async getCategories() {
    const response = await this.client.get('/categories');
    return response.data;
  }

  async getCategory(id: number) {
    const response = await this.client.get(`/categories/${id}`);
    return response.data;
  }

  async seedCategories() {
    const response = await this.client.post('/categories/seed');
    return response.data;
  }

  setBaseUrl(url: string) {
    this.client.defaults.baseURL = url;
  }
}

export const api = new ApiService();
export { API_URL };


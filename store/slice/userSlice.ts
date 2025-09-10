import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface User {
  id?: number;
  username?: string;
  email?: string;
  role?: string;
  profilePhoto?: string;
}

interface UserState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
}

const initialState: UserState = {
  user: null,
  token: null,
  isAuthenticated: false,
  loading: false,
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
      state.isAuthenticated = true;
      state.loading = false;
    },
    setToken: (state, action: PayloadAction<string>) => {
      state.token = action.payload;
    },
    clearUser: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.loading = false;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    updateProfilePhoto: (state, action: PayloadAction<string>) => {
      if (state.user) {
        state.user.profilePhoto = action.payload;
      }
    },
  },
});

export const { setUser, setToken, clearUser, setLoading, updateProfilePhoto } = userSlice.actions;
export default userSlice.reducer;
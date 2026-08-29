import { createSlice } from '@reduxjs/toolkit';
import { FriendUrl } from '../../utils/types';
import friends from '../../../public/json/friends.json';

interface AppState {
  aplayer: object;
  friendsUrlData: FriendUrl[];
  githubRepoCommits: any[];
}

const initialState: AppState = {
  aplayer: {},
  friendsUrlData: friends as FriendUrl[],
  githubRepoCommits: [],
};

const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    saveAPlayer: (state, action) => {
      state.aplayer = action.payload;
    },
    clearAPlayer: state => {
      state.aplayer = {};
    },
    saveFriendsUrlData: (state, action) => {
      state.friendsUrlData = action.payload;
    },
    clearFriendsUrlData: state => {
      state.friendsUrlData = [];
    },
    saveGithubRepoCommits: (state, action) => {
      state.githubRepoCommits = action.payload;
    },
    clearGithubRepoCommits: state => {
      state.githubRepoCommits = [];
    },
  },
});

export const {
  saveAPlayer,
  clearAPlayer,
  saveFriendsUrlData,
  clearFriendsUrlData,
  saveGithubRepoCommits,
  clearGithubRepoCommits,
} = appSlice.actions;
export default appSlice.reducer;

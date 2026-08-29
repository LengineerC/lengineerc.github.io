import { createSlice } from '@reduxjs/toolkit';
import { PostConfig } from '../../utils/types';
import posts from '../../../public/json/posts.json';

interface PostState {
  postList: PostConfig[];
}

const initialState: PostState = {
  postList: posts as PostConfig[],
};

const postSlice = createSlice({
  name: 'post',
  initialState,
  reducers: {
    savePostList: (state, action) => {
      state.postList = action.payload ?? state.postList;
    },
    clearPostList: state => {
      state.postList = [];
    },
  },
});

export const { savePostList, clearPostList } = postSlice.actions;
export default postSlice.reducer;

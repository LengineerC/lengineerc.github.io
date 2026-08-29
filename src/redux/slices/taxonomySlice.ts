import { Categories, Tags } from '../../utils/types';
import { createSlice } from '@reduxjs/toolkit';
import tags from '../../../public/json/tags.json';
import categories from '../../../public/json/categories.json';

interface TaxonomyState {
  tagsList: Tags;
  categoriesList: Categories;
}

const initialState: TaxonomyState = {
  tagsList: tags as Tags,
  categoriesList: categories as Categories,
};

const taxonomySlice = createSlice({
  name: 'taxonomy',
  initialState,
  reducers: {
    saveTagsList: (state, action) => {
      state.tagsList = action.payload;
    },
    clearTagsList: state => {
      state.tagsList = {};
    },
    saveCategoriesList: (state, action) => {
      state.categoriesList = action.payload;
    },
    clearCategoriesList: state => {
      state.categoriesList = {};
    },
  },
});

export const { saveTagsList, clearTagsList, saveCategoriesList, clearCategoriesList } =
  taxonomySlice.actions;
export default taxonomySlice.reducer;

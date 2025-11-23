import { Categories } from "@/utils/types";
import { createSlice } from "@reduxjs/toolkit";

interface TaxonomyState {
  tagsList: any[];
  categoriesList: Categories;
}

const initialState: TaxonomyState = {
  tagsList: [],
  categoriesList: {},
};

const taxonomySlice = createSlice({
  name: "taxonomy",
  initialState,
  reducers: {
    saveTagsList: (state, action) => {
      state.tagsList = action.payload;
    },
    clearTagsList: (state) => {
      state.tagsList = [];
    },
    saveCategoriesList: (state, action) => {
      state.categoriesList = action.payload;
    },
    clearCategoriesList: (state) => {
      state.categoriesList = {};
    },
  },
});

export const {
  saveTagsList,
  clearTagsList,
  saveCategoriesList,
  clearCategoriesList,
} = taxonomySlice.actions;
export default taxonomySlice.reducer;

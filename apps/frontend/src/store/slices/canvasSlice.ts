import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { CanvasComponentData } from '@/app/components/Canvas/CanvasComponent';

interface CanvasTransform {
  x: number;
  y: number;
  scale: number;
}

interface CanvasState {
  components: Record<string, CanvasComponentData>;
  transform: CanvasTransform;
  selectedComponents: string[];
  isLoading: boolean;
}

const initialState: CanvasState = {
  components: {},
  transform: { x: 0, y: 0, scale: 1 },
  selectedComponents: [],
  isLoading: false
};

const canvasSlice = createSlice({
  name: 'canvas',
  initialState,
  reducers: {
    addComponent: (state, action: PayloadAction<CanvasComponentData>) => {
      state.components[action.payload.id] = action.payload;
    },
    removeComponent: (state, action: PayloadAction<string>) => {
      delete state.components[action.payload];
      state.selectedComponents = state.selectedComponents.filter(
        id => id !== action.payload
      );
    },
    updateComponent: (state, action: PayloadAction<{
      id: string;
      updates: Partial<CanvasComponentData>;
    }>) => {
      const { id, updates } = action.payload;
      if (state.components[id]) {
        state.components[id] = {
          ...state.components[id],
          ...updates
        };
      }
    },
    setCanvasTransform: (state, action: PayloadAction<CanvasTransform>) => {
      state.transform = action.payload;
    },
    setSelectedComponents: (state, action: PayloadAction<string[]>) => {
      state.selectedComponents = action.payload;
    },
    clearCanvas: (state) => {
      state.components = {};
      state.selectedComponents = [];
    },
    replaceComponentByType: (state, action: PayloadAction<{
      oldId: string;
      newComponent: CanvasComponentData;
    }>) => {
      const { oldId, newComponent } = action.payload;
      // Preserve position from old component if it exists
      if (state.components[oldId]) {
        const oldPosition = state.components[oldId].position;
        newComponent.position = oldPosition;
        // Remove old component
        delete state.components[oldId];
        // Remove from selected if it was selected
        state.selectedComponents = state.selectedComponents.filter(
          id => id !== oldId
        );
      }
      // Add new component
      state.components[newComponent.id] = newComponent;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    }
  }
});

export const {
  addComponent,
  removeComponent,
  updateComponent,
  setCanvasTransform,
  setSelectedComponents,
  clearCanvas,
  replaceComponentByType,
  setLoading
} = canvasSlice.actions;

export default canvasSlice.reducer;
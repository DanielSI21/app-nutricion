import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AppShell } from './components/AppShell';
import { AddFoodPage } from './pages/AddFoodPage';
import { MealEditorPage } from './pages/MealEditorPage';
import { PlanPage } from './pages/PlanPage';
import { ProfilePage } from './pages/ProfilePage';
import { ProposalPage } from './pages/ProposalPage';
import { RecipesPage } from './pages/RecipesPage';
import { TodayPage } from './pages/TodayPage';
import { NutritionProvider } from './state/NutritionContext';

export default function App() {
  return <BrowserRouter><NutritionProvider><Routes><Route element={<AppShell/>}><Route index element={<TodayPage/>}/><Route path="plan" element={<PlanPage/>}/><Route path="agregar" element={<AddFoodPage/>}/><Route path="recetas" element={<RecipesPage/>}/><Route path="perfil" element={<ProfilePage/>}/><Route path="comida/:mealId" element={<MealEditorPage/>}/><Route path="propuesta" element={<ProposalPage/>}/><Route path="*" element={<TodayPage/>}/></Route></Routes></NutritionProvider></BrowserRouter>;
}

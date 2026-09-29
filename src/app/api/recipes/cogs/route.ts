import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import {
  getRecipesCogsDashboardData,
  upsertMasterIngredient,
  saveRecipeIngredientLines,
  syncDimRecipesFromIngredientLines,
  resetRecipesCogsToFactorySeed,
  UpsertMasterIngredientInput,
  SaveRecipeLinesInput,
} from '@/lib/recipesCogs';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const brand = searchParams.get('brand') || undefined;
    const data = await getRecipesCogsDashboardData(brand);
    return NextResponse.json({ ok: true, data });
  } catch (err) {
    console.error('[/api/recipes/cogs GET Error]', err);
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : 'Failed to fetch recipe & ingredient COGS data',
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const action = String(body.action || '');

    if (action === 'upsert_ingredient') {
      const payload = body.ingredient as UpsertMasterIngredientInput;
      if (!payload || !payload.ingredient_name) {
        return NextResponse.json(
          { ok: false, error: 'ingredient_name is required' },
          { status: 400 }
        );
      }

      const res = await upsertMasterIngredient(payload);

      revalidatePath('/');
      revalidatePath('/recipes');
      revalidatePath('/brands/[brandId]', 'page');

      return NextResponse.json({
        ok: true,
        ...res,
        message:
          res.cascadedRecipesCount > 0
            ? `Updated "${payload.ingredient_name}" and auto-cascaded new COGS across ${res.cascadedRecipesCount} linked recipe(s).`
            : `Saved master ingredient "${payload.ingredient_name}".`,
      });
    }

    if (action === 'save_recipe_lines') {
      const payload = body as SaveRecipeLinesInput & { action: string };
      if (!payload.recipe_id || !Array.isArray(payload.lines)) {
        return NextResponse.json(
          { ok: false, error: 'recipe_id and lines array are required' },
          { status: 400 }
        );
      }

      const res = await saveRecipeIngredientLines({
        recipe_id: payload.recipe_id,
        target_food_cost_pct: payload.target_food_cost_pct,
        lines: payload.lines,
      });

      revalidatePath('/');
      revalidatePath('/recipes');
      revalidatePath('/brands/[brandId]', 'page');

      return NextResponse.json({
        ok: true,
        ...res,
        message: `Saved ${res.linesSaved} ingredient/packaging line(s) and updated recipe BOM cost.`,
      });
    }

    if (action === 'sync_all_recipes') {
      const res = await syncDimRecipesFromIngredientLines();

      revalidatePath('/');
      revalidatePath('/recipes');
      revalidatePath('/brands/[brandId]', 'page');

      return NextResponse.json({
        ok: true,
        ...res,
        message: `Synchronized ${res.updatedRecipesCount} recipe BOMs from the Master Ingredient Catalog.`,
      });
    }

    if (action === 'reset_factory_seed') {
      const res = await resetRecipesCogsToFactorySeed();

      revalidatePath('/');
      revalidatePath('/recipes');
      revalidatePath('/brands/[brandId]', 'page');

      return NextResponse.json({
        ok: true,
        ...res,
        message: `Reset ${res.ingredientsReset} master ingredients and ${res.linesReset} recipe BOM lines to factory specifications.`,
      });
    }

    return NextResponse.json(
      { ok: false, error: `Unknown action: ${action}` },
      { status: 400 }
    );
  } catch (err) {
    console.error('[/api/recipes/cogs POST Error]', err);
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : 'Failed to process COGS mutation',
      },
      { status: 500 }
    );
  }
}

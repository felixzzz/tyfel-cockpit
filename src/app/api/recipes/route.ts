import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import {
  getCatalogRecipesAndUnmappedSkus,
  upsertRecipeBom,
  deleteOrResetRecipeBom,
  UpsertRecipeBomInput,
} from '@/lib/queries';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const brand = searchParams.get('brand') || undefined;
    const items = await getCatalogRecipesAndUnmappedSkus(brand);
    return NextResponse.json({ ok: true, items });
  } catch (err) {
    console.error('[/api/recipes GET Error]', err);
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : 'Failed to fetch recipe catalog' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Partial<UpsertRecipeBomInput>;
    if (!body.brand || !body.item_name) {
      return NextResponse.json(
        { ok: false, error: 'brand and item_name are required' },
        { status: 400 }
      );
    }

    const result = await upsertRecipeBom({
      recipe_id: body.recipe_id || null,
      brand: String(body.brand),
      item_name: String(body.item_name),
      canonical_name: String(body.canonical_name || body.item_name),
      category: String(body.category || 'General'),
      bom_summary: String(body.bom_summary || ''),
      raw_food_cost: Number(body.raw_food_cost ?? 0),
      packaging_dine_in: Number(body.packaging_dine_in ?? 0),
      packaging_delivery: Number(body.packaging_delivery ?? 0),
      target_food_cost_pct: Number(body.target_food_cost_pct ?? 28),
      is_hero_bom: Boolean(body.is_hero_bom),
    });

    revalidatePath('/');
    revalidatePath('/brands/[brandId]', 'page');

    return NextResponse.json({
      ok: true,
      recipe_id: result.recipe_id,
      message: `Saved recipe BOM for "${body.canonical_name || body.item_name}"`,
    });
  } catch (err) {
    console.error('[/api/recipes POST Error]', err);
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : 'Failed to upsert recipe BOM' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const recipeId = searchParams.get('recipe_id');
    if (!recipeId) {
      return NextResponse.json(
        { ok: false, error: 'recipe_id query param is required' },
        { status: 400 }
      );
    }

    const result = await deleteOrResetRecipeBom(recipeId);
    revalidatePath('/');
    revalidatePath('/brands/[brandId]', 'page');

    return NextResponse.json({
      ok: true,
      ...result,
      message: result.resetToDefault
        ? 'Reset recipe BOM to master seed specification'
        : 'Removed custom recipe BOM mapping',
    });
  } catch (err) {
    console.error('[/api/recipes DELETE Error]', err);
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : 'Failed to reset recipe BOM' },
      { status: 500 }
    );
  }
}

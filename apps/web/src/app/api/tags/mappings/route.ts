import { NextResponse } from 'next/server';
import { TagMappingSchema } from '@/lib/cloud/tags/types';
import {
  getTagMappings,
  createTagMapping,
  updateTagMapping,
  deleteTagMapping,
} from '@/lib/cloud/tags/tag-mapping-service';

const DEMO_TENANT = 'default';

export async function GET() {
  try {
    const mappings = await getTagMappings(DEMO_TENANT);
    return NextResponse.json({ mappings });
  } catch (error) {
    return NextResponse.json(
      { error: { code: 'FETCH_FAILED', message: error instanceof Error ? error.message : 'Failed to fetch tag mappings' } },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const input = TagMappingSchema.parse(body);
    const mapping = await createTagMapping(DEMO_TENANT, input);
    return NextResponse.json({ mapping }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: { code: 'CREATE_FAILED', message: error instanceof Error ? error.message : 'Failed to create tag mapping' } },
      { status: 400 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, ...data } = body;
    if (!id) {
      return NextResponse.json(
        { error: { code: 'MISSING_ID', message: 'Mapping id is required' } },
        { status: 400 }
      );
    }
    const mapping = await updateTagMapping(id, DEMO_TENANT, data);
    if (!mapping) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Tag mapping not found' } },
        { status: 404 }
      );
    }
    return NextResponse.json({ mapping });
  } catch (error) {
    return NextResponse.json(
      { error: { code: 'UPDATE_FAILED', message: error instanceof Error ? error.message : 'Failed to update tag mapping' } },
      { status: 400 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const body = await request.json();
    const { id } = body;
    if (!id) {
      return NextResponse.json(
        { error: { code: 'MISSING_ID', message: 'Mapping id is required' } },
        { status: 400 }
      );
    }
    const deleted = await deleteTagMapping(id, DEMO_TENANT);
    if (!deleted) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Tag mapping not found' } },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: { code: 'DELETE_FAILED', message: error instanceof Error ? error.message : 'Failed to delete tag mapping' } },
      { status: 400 }
    );
  }
}

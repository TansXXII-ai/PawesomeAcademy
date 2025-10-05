import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { cookies } from 'next/headers';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';
// GET all sections
export async function GET(request) {
  try {
    const result = await query(
      'SELECT id, name, description, display_order, active, created_at FROM Sections WHERE active = 1 ORDER BY display_order'
    );
    
    return NextResponse.json(result.recordset);
  } catch (error) {
    console.error('Error fetching sections:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sections' },
      { status: 500 }
    );
  }
}

// POST new section (admin/trainer only)
export async function POST(request) {
  try {
    const { name, description, display_order } = await request.json();
    
    if (!name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }
    
    const result = await query(
      'INSERT INTO Sections (name, description, display_order, active) OUTPUT INSERTED.* VALUES (@param0, @param1, @param2, 1)',
      [name, description || '', display_order || 99]
    );
    
    return NextResponse.json(result.recordset[0], { status: 201 });
  } catch (error) {
    console.error('Error creating section:', error);
    return NextResponse.json(
      { error: 'Failed to create section' },
      { status: 500 }
    );
  }
}

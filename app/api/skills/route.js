import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { cookies } from 'next/headers';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

// GET all skills (optionally filter by section)
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const sectionId = searchParams.get('sectionId');
    
    let queryText = `
      SELECT 
        s.id, s.section_id, s.title, s.description, 
        s.difficulty, s.points, s.display_order, s.active,
        sec.name as section_name
      FROM Skills s
      JOIN Sections sec ON s.section_id = sec.id
      WHERE s.active = 1
    `;
    
    const params = [];
    
    if (sectionId) {
      queryText += ' AND s.section_id = @param0';
      params.push(parseInt(sectionId));
    }
    
    queryText += ' ORDER BY s.section_id, s.display_order';
    
    const result = await query(queryText, params);
    
    return NextResponse.json(result.recordset);
  } catch (error) {
    console.error('Error fetching skills:', error);
    return NextResponse.json(
      { error: 'Failed to fetch skills' },
      { status: 500 }
    );
  }
}

// POST new skill (admin only)
export async function POST(request) {
  try {
    const cookieStore = cookies();
    const userCookie = cookieStore.get('user');
    
    if (!userCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const currentUser = JSON.parse(userCookie.value);
    
    // Only admins can create skills
    if (currentUser.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    const { section_id, title, description, difficulty, points, display_order } = await request.json();
    
    if (!section_id || !title || !description || !difficulty || !points) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate difficulty (1-5)
    if (difficulty < 1 || difficulty > 5) {
      return NextResponse.json(
        { error: 'Difficulty must be between 1 and 5' },
        { status: 400 }
      );
    }

    // Validate points (2, 5, 10, 15)
    if (![2, 5, 10, 15].includes(points)) {
      return NextResponse.json(
        { error: 'Points must be 2, 5, 10, or 15' },
        { status: 400 }
      );
    }
    
    const result = await query(
      `INSERT INTO Skills (section_id, title, description, difficulty, points, display_order, active) 
       OUTPUT INSERTED.* 
       VALUES (@param0, @param1, @param2, @param3, @param4, @param5, 1)`,
      [section_id, title, description, difficulty, points, display_order || 99]
    );
    
    return NextResponse.json(result.recordset[0], { status: 201 });
  } catch (error) {
    console.error('Error creating skill:', error);
    return NextResponse.json(
      { error: 'Failed to create skill' },
      { status: 500 }
    );
  }
}

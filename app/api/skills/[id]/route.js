// app/api/skills/[id]/route.js - CREATE THIS NEW FILE
import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

// PATCH - Update a skill
export async function PATCH(request, { params }) {
  try {
    const cookieStore = cookies();
    const userCookie = cookieStore.get('user');
    
    if (!userCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const currentUser = JSON.parse(userCookie.value);
    
    if (currentUser.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const skillId = params.id;
    const body = await request.json();
    const { section_id, title, description, difficulty, points, display_order } = body;

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
      `UPDATE Skills 
       SET section_id = @sectionId,
           title = @title,
           description = @description,
           difficulty = @difficulty,
           points = @points,
           display_order = @displayOrder
       OUTPUT INSERTED.*
       WHERE id = @skillId`,
      [
        { name: 'sectionId', type: 'Int', value: section_id },
        { name: 'title', type: 'NVarChar', value: title },
        { name: 'description', type: 'NVarChar', value: description },
        { name: 'difficulty', type: 'Int', value: difficulty },
        { name: 'points', type: 'Int', value: points },
        { name: 'displayOrder', type: 'Int', value: display_order || 99 },
        { name: 'skillId', type: 'Int', value: parseInt(skillId) }
      ]
    );

    if (result.recordset.length === 0) {
      return NextResponse.json(
        { error: 'Skill not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      skill: result.recordset[0] 
    });
  } catch (error) {
    console.error('Update skill error:', error);
    return NextResponse.json(
      { error: 'Failed to update skill' },
      { status: 500 }
    );
  }
}

// DELETE - Delete (deactivate) a skill
export async function DELETE(request, { params }) {
  try {
    const cookieStore = cookies();
    const userCookie = cookieStore.get('user');
    
    if (!userCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const currentUser = JSON.parse(userCookie.value);
    
    if (currentUser.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const skillId = params.id;

    // Check if skill exists
    const skillCheck = await query(
      'SELECT id, title FROM Skills WHERE id = @skillId',
      [{ name: 'skillId', type: 'Int', value: parseInt(skillId) }]
    );

    if (skillCheck.recordset.length === 0) {
      return NextResponse.json(
        { error: 'Skill not found' },
        { status: 404 }
      );
    }

    // Soft delete by setting active = 0
    await query(
      'UPDATE Skills SET active = 0 WHERE id = @skillId',
      [{ name: 'skillId', type: 'Int', value: parseInt(skillId) }]
    );

    return NextResponse.json({ 
      success: true, 
      message: 'Skill deactivated successfully' 
    });
  } catch (error) {
    console.error('Delete skill error:', error);
    return NextResponse.json(
      { error: 'Failed to delete skill' },
      { status: 500 }
    );
  }
}

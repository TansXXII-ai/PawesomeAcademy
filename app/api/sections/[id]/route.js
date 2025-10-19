// app/api/sections/[id]/route.js - CREATE THIS NEW FILE
import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

// PATCH - Update a section
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

    const sectionId = params.id;
    const body = await request.json();
    const { name, description, display_order } = body;

    if (!name || !description) {
      return NextResponse.json(
        { error: 'Name and description are required' },
        { status: 400 }
      );
    }

    const result = await query(
      `UPDATE Sections 
       SET name = @name, 
           description = @description, 
           display_order = @displayOrder
       OUTPUT INSERTED.*
       WHERE id = @sectionId`,
      [
        { name: 'name', type: 'NVarChar', value: name },
        { name: 'description', type: 'NVarChar', value: description },
        { name: 'displayOrder', type: 'Int', value: display_order || 99 },
        { name: 'sectionId', type: 'Int', value: parseInt(sectionId) }
      ]
    );

    if (result.recordset.length === 0) {
      return NextResponse.json(
        { error: 'Section not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      section: result.recordset[0] 
    });
  } catch (error) {
    console.error('Update section error:', error);
    return NextResponse.json(
      { error: 'Failed to update section' },
      { status: 500 }
    );
  }
}

// DELETE - Delete (deactivate) a section
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

    const sectionId = params.id;

    // Check if section exists
    const sectionCheck = await query(
      'SELECT id, name FROM Sections WHERE id = @sectionId',
      [{ name: 'sectionId', type: 'Int', value: parseInt(sectionId) }]
    );

    if (sectionCheck.recordset.length === 0) {
      return NextResponse.json(
        { error: 'Section not found' },
        { status: 404 }
      );
    }

    // Soft delete by setting active = 0
    await query(
      'UPDATE Sections SET active = 0 WHERE id = @sectionId',
      [{ name: 'sectionId', type: 'Int', value: parseInt(sectionId) }]
    );

    // Also deactivate all skills in this section
    await query(
      'UPDATE Skills SET active = 0 WHERE section_id = @sectionId',
      [{ name: 'sectionId', type: 'Int', value: parseInt(sectionId) }]
    );

    return NextResponse.json({ 
      success: true, 
      message: 'Section deactivated successfully' 
    });
  } catch (error) {
    console.error('Delete section error:', error);
    return NextResponse.json(
      { error: 'Failed to delete section' },
      { status: 500 }
    );
  }
}

import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

// POST new certificate request - UPDATED VERSION
// Replace the POST function in app/api/certificates/route.js with this:

export async function POST(request) {
  try {
    const { user_id, grade_number } = await request.json();
    
    if (!user_id || !grade_number) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Find the grade_id from the grade_number
    const gradeResult = await query(
      'SELECT id FROM Grades WHERE user_id = @param0 AND grade_number = @param1',
      [user_id, grade_number]
    );
    
    if (gradeResult.recordset.length === 0) {
      return NextResponse.json(
        { error: 'Grade not found. Please complete the grade first.' },
        { status: 404 }
      );
    }
    
    const grade_id = gradeResult.recordset[0].id;
    
    // Check if certificate already exists for this grade
    const existingCert = await query(
      'SELECT id FROM Certificates WHERE user_id = @param0 AND grade_id = @param1',
      [user_id, grade_id]
    );
    
    if (existingCert.recordset.length > 0) {
      return NextResponse.json(
        { error: 'Certificate already requested for this grade' },
        { status: 400 }
      );
    }
    
    // Generate unique public code
    const publicCode = Math.random().toString(36).substring(2, 10).toUpperCase();
    
    const result = await query(
      `INSERT INTO Certificates (user_id, grade_id, status, public_code)
       OUTPUT INSERTED.*
       VALUES (@param0, @param1, 'pending', @param2)`,
      [user_id, grade_id, publicCode]
    );
    
    return NextResponse.json(result.recordset[0], { status: 201 });
  } catch (error) {
    console.error('Error creating certificate:', error);
    return NextResponse.json(
      { error: 'Failed to create certificate' },
      { status: 500 }
    );
  }
}

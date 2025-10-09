import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

// GET certificates
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const status = searchParams.get('status');

    let queryText = `
      SELECT
        c.id, c.user_id, c.grade_id, c.status, c.public_code,
        c.certificate_url, c.approved_by, c.requested_at, c.approved_at,
        g.grade_number,
        u.username as member_name,
        p.dog_name
      FROM Certificates c
      JOIN Grades g ON c.grade_id = g.id
      JOIN Users u ON c.user_id = u.id
      LEFT JOIN Profiles p ON c.user_id = p.user_id
      WHERE 1=1
    `;

    const params = [];
    let paramIndex = 0;

    if (userId) {
      queryText += ` AND c.user_id = @param${paramIndex}`;
      params.push(parseInt(userId));
      paramIndex++;
    }

    if (status) {
      queryText += ` AND c.status = @param${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    queryText += ' ORDER BY c.requested_at DESC';

    const result = await query(queryText, params);

    return NextResponse.json(result.recordset);
  } catch (error) {
    console.error('Error fetching certificates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch certificates' },
      { status: 500 }
    );
  }
}

// POST new certificate request
export async function POST(request) {
  try {
    const { user_id, grade_id, grade_number } = await request.json();

    if (!user_id) {
      return NextResponse.json(
        { error: 'Missing required user_id' },
        { status: 400 }
      );
    }

    let resolvedGradeId = grade_id;

    if (!resolvedGradeId && grade_number) {
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

      resolvedGradeId = gradeResult.recordset[0].id;
    }

    if (!resolvedGradeId) {
      return NextResponse.json(
        { error: 'Missing grade reference' },
        { status: 400 }
      );
    }

    const existingCert = await query(
      'SELECT id FROM Certificates WHERE user_id = @param0 AND grade_id = @param1',
      [user_id, resolvedGradeId]
    );

    if (existingCert.recordset.length > 0) {
      return NextResponse.json(
        { error: 'Certificate already requested for this grade' },
        { status: 400 }
      );
    }

    const publicCode = Math.random().toString(36).substring(2, 10).toUpperCase();

    const result = await query(
      `INSERT INTO Certificates (user_id, grade_id, status, public_code)
       OUTPUT INSERTED.*
       VALUES (@param0, @param1, 'pending', @param2)`,
      [user_id, resolvedGradeId, publicCode]
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

// PATCH - approve certificate
export async function PATCH(request) {
  try {
    const { certificate_id, trainer_id, certificate_url } = await request.json();

    if (!certificate_id || !trainer_id) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const result = await query(
      `UPDATE Certificates
       SET status = 'approved', approved_by = @param0, approved_at = GETDATE(), certificate_url = @param1
       OUTPUT INSERTED.*
       WHERE id = @param2`,
      [trainer_id, certificate_url || null, certificate_id]
    );

    return NextResponse.json(result.recordset[0]);
  } catch (error) {
    console.error('Error approving certificate:', error);
    return NextResponse.json(
      { error: 'Failed to approve certificate' },
      { status: 500 }
    );
  }
}

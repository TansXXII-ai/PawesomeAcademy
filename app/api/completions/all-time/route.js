// app/api/completions/all-time/route.js - CREATE THIS NEW FILE
import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID required' },
        { status: 400 }
      );
    }
    
    // Get all-time statistics (all completions ever achieved)
    const statsResult = await query(
      `SELECT 
        COUNT(*) as total_skills,
        COALESCE(SUM(s.points), 0) as total_points
       FROM Completions c
       JOIN Skills s ON c.skill_id = s.id
       WHERE c.user_id = @userId`,
      [{ name: 'userId', type: 'Int', value: parseInt(userId) }]
    );
    
    return NextResponse.json({
      total_points: statsResult.recordset[0].total_points || 0,
      total_skills: statsResult.recordset[0].total_skills || 0
    });
  } catch (error) {
    console.error('Error fetching all-time stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch statistics' },
      { status: 500 }
    );
  }
}

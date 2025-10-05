import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

const gradeRequirements = {
  1: 20, 2: 20, 3: 20,
  4: 40, 5: 40, 6: 40,
  7: 60, 8: 60, 9: 60,
  10: 80, 11: 80, 12: 80
};

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
    
    // Get current grade (last achieved + 1)
    const gradeResult = await query(
      'SELECT MAX(grade_number) as last_grade FROM Grades WHERE user_id = @param0',
      [parseInt(userId)]
    );
    
    const lastGrade = gradeResult.recordset[0].last_grade || 0;
    const currentGrade = lastGrade + 1;
    
    if (currentGrade > 12) {
      return NextResponse.json({
        currentGrade: 12,
        completed: true,
        canRequestCertificate: false
      });
    }
    
    // Get completions already used in previous grades
    const usedCompletions = await query(
      `SELECT DISTINCT gc.completion_id
       FROM GradeCompletions gc
       JOIN Grades g ON gc.grade_id = g.id
       WHERE g.user_id = @param0 AND g.grade_number < @param1`,
      [parseInt(userId), currentGrade]
    );
    
    const usedIds = usedCompletions.recordset.map(r => r.completion_id);
    
    // Get available completions for current grade
    let availableQuery = `
      SELECT 
        c.id as completion_id,
        c.skill_id,
        s.section_id,
        s.points,
        s.title as skill_title,
        sec.name as section_name
      FROM Completions c
      JOIN Skills s ON c.skill_id = s.id
      JOIN Sections sec ON s.section_id = sec.id
      WHERE c.user_id = @param0
    `;
    
    const params = [parseInt(userId)];
    
    if (usedIds.length > 0) {
      availableQuery += ` AND c.id NOT IN (${usedIds.join(',')})`;
    }
    
    const available = await query(availableQuery, params);
    
    // Calculate totals
    let totalPoints = 0;
    const sectionPoints = {};
    const sectionsWithSkills = new Set();
    const completionIds = [];
    
    available.recordset.forEach(comp => {
      totalPoints += comp.points;
      sectionPoints[comp.section_id] = (sectionPoints[comp.section_id] || 0) + comp.points;
      sectionsWithSkills.add(comp.section_id);
      completionIds.push(comp.completion_id);
    });
    
    const pointsRequired = gradeRequirements[currentGrade] || 0;
    const canRequestCertificate = 
      totalPoints >= pointsRequired && 
      sectionsWithSkills.size === 6;
    
    return NextResponse.json({
      currentGrade,
      lastGrade,
      pointsRequired,
      totalPoints,
      sectionPoints,
      sectionsWithSkills: Array.from(sectionsWithSkills),
      canRequestCertificate,
      completionIds,
      availableCompletions: available.recordset
    });
  } catch (error) {
    console.error('Error calculating grade progress:', error);
    return NextResponse.json(
      { error: 'Failed to calculate progress' },
      { status: 500 }
    );
  }
}

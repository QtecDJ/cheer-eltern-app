export function toMemberListDTO(member: any) {
  return {
    id: member.id,
    firstName: member.firstName,
    lastName: member.lastName,
    photoUrl: member.photoUrl,
  };
}

export function toTeamMinimalDTO(team: any) {
  if (!team) return null;
  return { id: team.id, name: team.name, color: team.color };
}

export function toAttendanceStatsDTO(stats: any) {
  return { total: stats.total, present: stats.present, absent: stats.absent, excused: stats.excused };
}

export function isActionSuccess(result: any) {
  return result && result.success === true;
}

export function isActionError(result: any) {
  return result && result.success === false;
}

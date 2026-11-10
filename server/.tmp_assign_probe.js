const BASE = 'http://127.0.0.1:4010/api/v1';
const tag = 'as' + Date.now().toString(36);
async function api(method, path, opts = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (opts.token) headers['Cookie'] = 'token=' + opts.token;
  const res = await fetch(BASE + path, { method, headers, body: opts.body ? JSON.stringify(opts.body) : undefined });
  let body = null; try { body = await res.json(); } catch (e) {}
  return { status: res.status, body };
}
async function user(label) {
  const email = label + '.' + tag + '@example.com', username = label + tag, password = 'Passw0rd!23';
  await api('POST', '/users/register', { body: { username, password, email, role: 'user' } });
  const l = await api('POST', '/users/signin', { body: { email, password } });
  return { email, username, token: l.body.token, userId: l.body.user.user_id };
}
(async () => {
  const A = await user('alice');
  const B = await user('bob');
  const team = await api('POST', '/teams', { token: A.token, body: { name: 'Assign ' + tag } });
  const teamId = team.body.team.id;
  const inv = await api('POST', '/invites', { token: A.token, body: { teamId, invitedUserId: B.userId, role: 'member' } });
  await api('PATCH', '/invites/' + inv.body.id + '/respond', { token: B.token, body: { action: 'accepted' } });
  const proj = await api('POST', '/projects', { token: A.token, body: { name: 'P ' + tag, team_id: teamId, member_ids: [B.userId] } });
  const projectId = proj.body.project.id;

  console.log('--- project members as returned by GET /projects/:id ---');
  const p = await api('GET', '/projects/' + projectId, { token: A.token });
  console.log(JSON.stringify(p.body.project.members, null, 1));

  console.log('--- create task WITH assignee ---');
  const t = await api('POST', '/tasks/task', { token: A.token, body: { title: 'assign me ' + tag, project_id: projectId, assignee_id: B.userId } });
  console.log(t.status, JSON.stringify(t.body));

  console.log('--- task as seen by creator (GET /tasks) ---');
  const list = await api('GET', '/tasks', { token: A.token });
  console.log(JSON.stringify(list.body.tasks.find(x => x.id === t.body.task_id)));

  console.log('--- task as seen by assignee ---');
  const one = await api('GET', '/tasks/' + t.body.task_id, { token: B.token });
  console.log(one.status, JSON.stringify(one.body));

  console.log('--- can the client resolve assignee name? ---');
  console.log('GET /users/:id ->', (await api('GET', '/users/' + B.userId, { token: A.token })).status);
  console.log('GET /members/' + teamId + '/' + B.userId + ' ->', JSON.stringify((await api('GET', '/members/' + teamId + '/' + B.userId, { token: A.token })).body));
  console.log('search by username ->', JSON.stringify((await api('GET', '/members/search?q=' + B.username, { token: A.token })).body));

  console.log('--- reassign to creator and then unassign ---');
  const r1 = await api('PUT', '/tasks/' + t.body.task_id, { token: A.token, body: { assignee_id: A.userId } });
  const r2 = await api('PUT', '/tasks/' + t.body.task_id, { token: A.token, body: { assignee_id: null } });
  console.log('reassign:', r1.status, '| unassign:', r2.status);
  console.log('after:', JSON.stringify((await api('GET', '/tasks/' + t.body.task_id, { token: A.token })).body.task.assignee_id));

  console.log('--- assignment by a plain project member (B assigns C-like: B assigns self) ---');
  const self = await api('PUT', '/tasks/' + t.body.task_id, { token: B.token, body: { assignee_id: B.userId } });
  console.log('member assigns self ->', self.status, JSON.stringify(self.body));

  console.log('--- activity produced ---');
  console.log(JSON.stringify((await api('GET', '/activity', { token: B.token })).body, null, 1));
  console.log(JSON.stringify({ tag, teamId, projectId, owner: A.userId, member: B.userId }));
})();
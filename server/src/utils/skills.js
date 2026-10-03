const rules = [
  ['HTML','Frontend',['.html','html'],['HTML']],
  ['CSS','Frontend',['.css','css'],['CSS']],
  ['JavaScript','Programming Languages',['.js','.mjs','.cjs','javascript'],['JavaScript']],
  ['TypeScript','Programming Languages',['.ts','.tsx','typescript'],['TypeScript']],
  ['React','Frontend',['react','.jsx','.tsx'],['React']],
  ['Next.js','Frontend',['next'],['Next.js']],
  ['Vue','Frontend',['vue'],['Vue']],
  ['Angular','Frontend',['angular'],['Angular']],
  ['Tailwind CSS','Frontend',['tailwind'],['Tailwind']],
  ['Bootstrap','Frontend',['bootstrap'],['Bootstrap']],
  ['Node.js','Backend',['node','node.js'],['Node.js']],
  ['Express.js','Backend',['express'],['Express']],
  ['Django','Backend',['django'],['Django']],
  ['Flask','Backend',['flask'],['Flask']],
  ['Spring Boot','Backend',['spring-boot'],['Spring Boot']],
  ['REST APIs','Other',['axios','fetch(','/api/','rest api','rest-api'],['REST API','API integration']],
  ['GraphQL','Backend',['graphql'],['GraphQL']],
  ['Python','Programming Languages',['.py','python'],['Python']],
  ['Java','Programming Languages',['.java','java'],['Java']],
  ['C++','Programming Languages',['.cpp','.hpp'],['C++']],
  ['C','Programming Languages',['.c','.h'],['C']],
  ['Go','Programming Languages',['.go','golang'],['Go']],
  ['PHP','Programming Languages',['.php','php'],['PHP']],
  ['Rust','Programming Languages',['.rs','rust'],['Rust']],
  ['MongoDB','Databases',['mongodb','mongoose'],['MongoDB']],
  ['MySQL','Databases',['mysql'],['MySQL']],
  ['PostgreSQL','Databases',['postgres','pg','postgresql'],['PostgreSQL']],
  ['SQLite','Databases',['sqlite'],['SQLite']],
  ['Redis','Databases',['redis'],['Redis']],
  ['Firebase','Databases',['firebase'],['Firebase']],
  ['Git','Tools',['.gitignore','git'],['Git']],
  ['GitHub','Tools',['github','actions'],['GitHub']],
  ['Docker','DevOps / Cloud',['dockerfile','docker-compose','docker'],['Docker']],
  ['GitHub Actions','DevOps / Cloud',['.github/workflows'],['GitHub Actions']],
  ['AWS','DevOps / Cloud',['aws','amazon web services'],['AWS']],
  ['Azure','DevOps / Cloud',['azure'],['Azure']],
  ['Vercel','DevOps / Cloud',['vercel'],['Vercel']],
  ['CI/CD','DevOps / Cloud',['workflow','pipeline','ci/cd'],['CI/CD']],
  ['Authentication','Other',['jwt','jsonwebtoken','passport','bcrypt','auth'],['Authentication']],
  ['Testing','Other',['jest','vitest','mocha','pytest','cypress','playwright'],['Testing']],
  ['State management','Other',['redux','zustand','mobx'],['State management']],
  ['WebSockets','Other',['socket.io','websocket'],['WebSockets']],
  ['Machine Learning','Other',['scikit-learn','tensorflow','pytorch','machine learning'],['Machine Learning']],
  ['Data Structures & Algorithms','Other',['leetcode','algorithm','data structure','binary tree','graph'],['DSA']]
];

export function detectSkills(repositories) {
  const corpus = repositories.map(r => [r.name,r.description,r.language,r.readme,r.tree.join(' '),Object.keys(r.dependencies).join(' ')].join('\n').toLowerCase()).join('\n');
  const found = [];
  for (const [name, category, signals, labels] of rules) {
    const hits = signals.filter(s => corpus.includes(s.toLowerCase()));
    if (!hits.length) continue;
    const repoHits = repositories.filter(r => {
      const text = [r.name,r.description,r.language,r.readme,r.tree.join(' '),Object.keys(r.dependencies).join(' ')].join('\n').toLowerCase();
      return signals.some(s => text.includes(s.toLowerCase()));
    });
    const score = Math.min(0.98, 0.45 + hits.length * 0.12 + Math.min(repoHits.length, 4) * 0.08);
    const confidence = score >= 0.8 ? 'High' : score >= 0.62 ? 'Medium' : 'Low';
    found.push({ name, category, confidence, evidence: buildEvidence(name, hits, repoHits), repositories: repoHits.map(r=>r.name) });
  }
  return found;
}

function buildEvidence(name, hits, repos) {
  const evidence = [];
  if (hits.some(h => h.startsWith('.'))) evidence.push(`Relevant file types detected (${hits.filter(h=>h.startsWith('.')).join(', ')}).`);
  if (hits.some(h => !h.startsWith('.'))) evidence.push(`${name}-related dependency, keyword, or project structure detected.`);
  if (repos.length) evidence.push(`Observed across ${repos.length} analyzed ${repos.length === 1 ? 'repository' : 'repositories'}.`);
  return evidence;
}

export const skillCatalog = rules.map(([name,category]) => ({name,category}));

import { github, decodeBase64 } from './github.js';
import { detectSkills, skillCatalog } from '../utils/skills.js';
import { generateAIAnalysis } from './ai.js';

export async function analyzeGitHubUrl(inputUrl) {
  const parsed = parseGitHubUrl(inputUrl);
  let repositories;
  let profile;
  if (parsed.type === 'repo') {
    const repo = await getRepo(parsed.owner, parsed.repo);
    profile = await github(`/users/${repo.owner.login}`);
    repositories = [await enrichRepo(repo)];
  } else {
    profile = await github(`/users/${parsed.owner}`);
    const repos = await github(`/users/${parsed.owner}/repos?per_page=100&sort=updated`);
    repositories = await Promise.all(repos.slice(0, 30).map(enrichRepo));
  }
  const skills = detectSkills(repositories);
  const skillNames = new Set(skills.map(s=>s.name));
  const gaps = gapRecommendations(skills, repositories).filter(x => !skillNames.has(x.name));
  const deterministic = buildRecommendations(skills, gaps);
  const ai = await generateAIAnalysis({ profile, skills, gaps, repositories: repositories.map(r=>({name:r.name,language:r.language,description:r.description,tree:r.tree,dependencies:Object.keys(r.dependencies)})) });
  return {
    generatedAt: new Date().toISOString(), profile: publicProfile(profile), repositories: repositories.map(publicRepo),
    skills, skillGaps:gaps, ...deterministic, ai: ai || null,
    meta:{ analyzedRepositories: repositories.length, skillCatalogSize: skillCatalog.length }
  };
}

function parseGitHubUrl(raw) {
  let u; try { u = new URL(raw); } catch { const e=new Error('Enter a valid GitHub URL.'); e.status=400; throw e; }
  if (u.hostname.toLowerCase() !== 'github.com') { const e=new Error('Please enter a github.com profile or repository URL.'); e.status=400; throw e; }
  const parts=u.pathname.split('/').filter(Boolean);
  if (!parts[0]) { const e=new Error('GitHub username is missing.'); e.status=400; throw e; }
  return parts.length >= 2 ? {type:'repo',owner:parts[0],repo:parts[1]} : {type:'profile',owner:parts[0]};
}

async function getRepo(owner, repo) { return github(`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`); }

async function enrichRepo(repo) {
  const [languages, tree, readme] = await Promise.all([
    github(`/repos/${repo.owner.login}/${repo.name}/languages`).catch(()=>({})),
    github(`/repos/${repo.owner.login}/${repo.name}/git/trees/${repo.default_branch}?recursive=1`).catch(()=>({tree:[]})),
    github(`/repos/${repo.owner.login}/${repo.name}/readme`).catch(()=>null)
  ]);
  const files=(tree.tree||[]).filter(x=>x.type==='blob').map(x=>x.path).slice(0,500);
  let packageData={};
  const packagePath=files.find(x=>x==='package.json');
  if(packagePath){ const p=await github(`/repos/${repo.owner.login}/${repo.name}/contents/${packagePath}`).catch(()=>null); if(p?.content) { try{packageData=JSON.parse(decodeBase64(p.content));}catch{} } }
  return {name:repo.name,fullName:repo.full_name,description:repo.description||'',language:repo.language||Object.keys(languages)[0]||null,languages:Object.keys(languages),stars:repo.stargazers_count,forks:repo.forks_count,updatedAt:repo.updated_at,defaultBranch:repo.default_branch,topics:repo.topics||[],tree:files,readme:readme?.content?decodeBase64(readme.content):'',dependencies:{...(packageData.dependencies||{}),...(packageData.devDependencies||{})},htmlUrl:repo.html_url};
}

function publicProfile(p){ return {login:p.login,name:p.name,avatarUrl:p.avatar_url,bio:p.bio,publicRepos:p.public_repos,followers:p.followers,following:p.following,htmlUrl:p.html_url}; }
function publicRepo(r){ return {name:r.name,fullName:r.fullName,description:r.description,language:r.language,languages:r.languages,stars:r.stars,forks:r.forks,updatedAt:r.updatedAt,topics:r.topics,htmlUrl:r.htmlUrl}; }

function gapRecommendations(skills, repos){
  const names=new Set(skills.map(s=>s.name));
  const detected = new Set(repos.flatMap(r=>[r.language,...r.languages]).filter(Boolean));
  const web = names.has('HTML')||names.has('CSS')||names.has('JavaScript')||names.has('React');
  const gaps=[];
  const add=(name,reason,priority='Medium')=>{ if(!names.has(name)) gaps.push({name,reason,priority}); };
  if(web){ add('TypeScript','No strong evidence of TypeScript was found in the analyzed repositories.','High'); add('Testing','No strong testing framework evidence was found.','Medium'); add('Authentication','No strong authentication implementation evidence was found.','Medium'); add('REST APIs','No strong API integration evidence was found.','High'); }
  if(names.has('Node.js')||names.has('Express.js')) add('MongoDB','No strong MongoDB evidence was found.','Medium');
  if(names.has('MongoDB')||names.has('PostgreSQL')||names.has('MySQL')) add('Docker','No strong containerization evidence was found.','Medium');
  if(names.has('GitHub')) add('CI/CD','No strong CI/CD workflow evidence was found.','Low');
  if(!detected.has('Python')&&!names.has('Python')) add('Python','Python is a useful complementary backend/data skill; no strong evidence was found here.','Low');
  return gaps.slice(0,8);
}

function buildRecommendations(skills,gaps){
  const names=new Set(skills.map(s=>s.name));
  const projects=[];
  if((names.has('React')||names.has('JavaScript')) && !names.has('Node.js')) projects.push(project('Full-Stack Job Application Tracker','Intermediate',['React','Node.js','Express.js','MongoDB','Authentication','REST APIs'],'Add a real backend and persistent data layer.'));
  if(names.has('Node.js')&&!names.has('Testing')) projects.push(project('API Testing Dashboard','Intermediate',['Node.js','Express.js','Testing','REST APIs'],'Practice backend testing and API design.'));
  if(names.has('HTML')&&!names.has('React')) projects.push(project('React Developer Portfolio','Beginner',['React','JavaScript','Responsive UI'],'Move from static pages to component-based UI.'));
  projects.push(project('Developer Skill Tracker','Intermediate',['React','Node.js','MongoDB','Authentication','Charts'],'Turn skill analysis into a persistent full-stack product.'));
  const roadmap=[]; const order=['Advanced JavaScript','TypeScript','REST APIs','Node.js + Express','MongoDB','Authentication','Testing','Docker']; for(const item of order){ if(!names.has(item)&&!item.includes(' + ')) roadmap.push({skill:item,why:'Builds on the evidence found in your current projects.',difficulty:['Advanced JavaScript','TypeScript'].includes(item)?'Intermediate':'Beginner'}); }
  return {summary:`Your analyzed GitHub activity contains evidence across ${skills.length} tracked skills and ${skills.filter(s=>s.confidence==='High').length} high-confidence skills.`,strengths:skills.filter(s=>s.confidence==='High').slice(0,8).map(s=>s.name),improvementAreas:gaps.slice(0,5).map(g=>g.name),recommendedSkills:gaps.slice(0,5).map(g=>g.name),recommendedProjects:projects.slice(0,4),roadmap:roadmap.slice(0,8)};
}
function project(title,difficulty,skills,why){return {title,difficulty,skills,why,features:['Responsive dashboard','Authentication','REST API','Persistent database','Validation and error handling']};}

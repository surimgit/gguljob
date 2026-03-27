import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import ForceGraph3D from 'react-force-graph-3d';
import * as THREE from 'three';
import api from '../api';

interface GraphNode {
  id: string;
  label: string;
  type: 'user' | 'skill' | 'role' | 'project' | 'recruitment';
  size: number;
  x?: number;
  y?: number;
  z?: number;
  __linkCount?: number;
  __rand?: number;
}

interface GraphLink { source: any; target: any; label: string; }
interface GraphData { nodes: GraphNode[]; links: GraphLink[]; }

// ── 더미 데이터 ──
const DUMMY_LINKS: GraphLink[] = [
  // users → skills
  { source: 'user-1', target: 'skill-React',      label: 'HAS_SKILL' },
  { source: 'user-1', target: 'skill-TypeScript', label: 'HAS_SKILL' },
  { source: 'user-1', target: 'skill-Next.js',    label: 'HAS_SKILL' },
  { source: 'user-2', target: 'skill-Spring',     label: 'HAS_SKILL' },
  { source: 'user-2', target: 'skill-Java',       label: 'HAS_SKILL' },
  { source: 'user-2', target: 'skill-MySQL',      label: 'HAS_SKILL' },
  { source: 'user-3', target: 'skill-Python',     label: 'HAS_SKILL' },
  { source: 'user-3', target: 'skill-PyTorch',    label: 'HAS_SKILL' },
  { source: 'user-4', target: 'skill-Docker',     label: 'HAS_SKILL' },
  { source: 'user-4', target: 'skill-Kubernetes', label: 'HAS_SKILL' },
  { source: 'user-5', target: 'skill-React',      label: 'HAS_SKILL' },
  { source: 'user-5', target: 'skill-Vue',        label: 'HAS_SKILL' },
  { source: 'user-6', target: 'skill-Spring',     label: 'HAS_SKILL' },
  { source: 'user-6', target: 'skill-Redis',      label: 'HAS_SKILL' },
  { source: 'user-7', target: 'skill-Python',     label: 'HAS_SKILL' },
  { source: 'user-7', target: 'skill-FastAPI',    label: 'HAS_SKILL' },
  { source: 'user-8', target: 'skill-TypeScript', label: 'HAS_SKILL' },
  { source: 'user-8', target: 'skill-GraphQL',    label: 'HAS_SKILL' },
  // users → roles
  { source: 'user-1', target: 'role-Frontend',  label: 'WANTS_ROLE' },
  { source: 'user-2', target: 'role-Backend',   label: 'WANTS_ROLE' },
  { source: 'user-3', target: 'role-AI/ML',     label: 'WANTS_ROLE' },
  { source: 'user-4', target: 'role-DevOps',    label: 'WANTS_ROLE' },
  { source: 'user-5', target: 'role-Frontend',  label: 'WANTS_ROLE' },
  { source: 'user-6', target: 'role-Backend',   label: 'WANTS_ROLE' },
  { source: 'user-7', target: 'role-AI/ML',     label: 'WANTS_ROLE' },
  { source: 'user-8', target: 'role-Fullstack', label: 'WANTS_ROLE' },
  // projects → recruitments
  { source: 'project-1', target: 'recruit-1a', label: 'HAS_RECRUITMENT' },
  { source: 'project-1', target: 'recruit-1b', label: 'HAS_RECRUITMENT' },
  { source: 'project-2', target: 'recruit-2a', label: 'HAS_RECRUITMENT' },
  { source: 'project-3', target: 'recruit-3a', label: 'HAS_RECRUITMENT' },
  { source: 'project-4', target: 'recruit-4a', label: 'HAS_RECRUITMENT' },
  { source: 'project-4', target: 'recruit-4b', label: 'HAS_RECRUITMENT' },
  { source: 'project-5', target: 'recruit-5a', label: 'HAS_RECRUITMENT' },
  // recruitments → skills
  { source: 'recruit-1a', target: 'skill-React',      label: 'REQUIRES_SKILL' },
  { source: 'recruit-1a', target: 'skill-TypeScript', label: 'REQUIRES_SKILL' },
  { source: 'recruit-1b', target: 'skill-Spring',     label: 'REQUIRES_SKILL' },
  { source: 'recruit-1b', target: 'skill-MySQL',      label: 'REQUIRES_SKILL' },
  { source: 'recruit-2a', target: 'skill-Python',     label: 'REQUIRES_SKILL' },
  { source: 'recruit-2a', target: 'skill-PyTorch',    label: 'REQUIRES_SKILL' },
  { source: 'recruit-3a', target: 'skill-Docker',     label: 'REQUIRES_SKILL' },
  { source: 'recruit-3a', target: 'skill-Kubernetes', label: 'REQUIRES_SKILL' },
  { source: 'recruit-4a', target: 'skill-TypeScript', label: 'REQUIRES_SKILL' },
  { source: 'recruit-4b', target: 'skill-GraphQL',    label: 'REQUIRES_SKILL' },
  { source: 'recruit-5a', target: 'skill-Vue',        label: 'REQUIRES_SKILL' },
  { source: 'recruit-5a', target: 'skill-FastAPI',    label: 'REQUIRES_SKILL' },
  // recruitments → roles
  { source: 'recruit-1a', target: 'role-Frontend',  label: 'REQUIRES_ROLE' },
  { source: 'recruit-1b', target: 'role-Backend',   label: 'REQUIRES_ROLE' },
  { source: 'recruit-2a', target: 'role-AI/ML',     label: 'REQUIRES_ROLE' },
  { source: 'recruit-3a', target: 'role-DevOps',    label: 'REQUIRES_ROLE' },
  { source: 'recruit-4a', target: 'role-Fullstack', label: 'REQUIRES_ROLE' },
  { source: 'recruit-4b', target: 'role-Fullstack', label: 'REQUIRES_ROLE' },
  { source: 'recruit-5a', target: 'role-Frontend',  label: 'REQUIRES_ROLE' },
];

const buildDummyData = (): GraphData => {
  const nodes: GraphNode[] = [
    { id: 'user-1', label: '김민준',    type: 'user',        size: 12 },
    { id: 'user-2', label: '이서연',    type: 'user',        size: 12 },
    { id: 'user-3', label: '박지호',    type: 'user',        size: 12 },
    { id: 'user-4', label: '최유나',    type: 'user',        size: 12 },
    { id: 'user-5', label: '정다은',    type: 'user',        size: 12 },
    { id: 'user-6', label: '한승우',    type: 'user',        size: 12 },
    { id: 'user-7', label: '오현진',    type: 'user',        size: 12 },
    { id: 'user-8', label: '강태양',    type: 'user',        size: 12 },
    { id: 'skill-React',      label: 'React',      type: 'skill', size: 6 },
    { id: 'skill-TypeScript', label: 'TypeScript', type: 'skill', size: 6 },
    { id: 'skill-Next.js',    label: 'Next.js',    type: 'skill', size: 6 },
    { id: 'skill-Spring',     label: 'Spring',     type: 'skill', size: 6 },
    { id: 'skill-Java',       label: 'Java',       type: 'skill', size: 6 },
    { id: 'skill-MySQL',      label: 'MySQL',      type: 'skill', size: 6 },
    { id: 'skill-Python',     label: 'Python',     type: 'skill', size: 6 },
    { id: 'skill-PyTorch',    label: 'PyTorch',    type: 'skill', size: 6 },
    { id: 'skill-Docker',     label: 'Docker',     type: 'skill', size: 6 },
    { id: 'skill-Kubernetes', label: 'Kubernetes', type: 'skill', size: 6 },
    { id: 'skill-Vue',        label: 'Vue',        type: 'skill', size: 6 },
    { id: 'skill-Redis',      label: 'Redis',      type: 'skill', size: 6 },
    { id: 'skill-FastAPI',    label: 'FastAPI',    type: 'skill', size: 6 },
    { id: 'skill-GraphQL',    label: 'GraphQL',    type: 'skill', size: 6 },
    { id: 'role-Frontend',  label: 'Frontend',  type: 'role', size: 8 },
    { id: 'role-Backend',   label: 'Backend',   type: 'role', size: 8 },
    { id: 'role-AI/ML',     label: 'AI / ML',   type: 'role', size: 8 },
    { id: 'role-DevOps',    label: 'DevOps',    type: 'role', size: 8 },
    { id: 'role-Fullstack', label: 'Fullstack', type: 'role', size: 8 },
    { id: 'project-1', label: '꿀잡 - 팀 매칭', type: 'project', size: 10 },
    { id: 'project-2', label: 'AI 추천 엔진',   type: 'project', size: 10 },
    { id: 'project-3', label: 'DevOps 플랫폼',  type: 'project', size: 10 },
    { id: 'project-4', label: '오픈 커머스',    type: 'project', size: 10 },
    { id: 'project-5', label: '대시보드 SaaS',  type: 'project', size: 10 },
    { id: 'recruit-1a', label: 'FE 개발자 모집',   type: 'recruitment', size: 7 },
    { id: 'recruit-1b', label: 'BE 개발자 모집',   type: 'recruitment', size: 7 },
    { id: 'recruit-2a', label: 'AI 엔지니어 모집', type: 'recruitment', size: 7 },
    { id: 'recruit-3a', label: 'DevOps 엔지니어',  type: 'recruitment', size: 7 },
    { id: 'recruit-4a', label: '풀스택 개발자',    type: 'recruitment', size: 7 },
    { id: 'recruit-4b', label: 'API 개발자',       type: 'recruitment', size: 7 },
    { id: 'recruit-5a', label: 'FE/BE 통합 모집',  type: 'recruitment', size: 7 },
  ];
  const linkCount: Record<string, number> = {};
  DUMMY_LINKS.forEach((l) => {
    linkCount[l.source as string] = (linkCount[l.source as string] || 0) + 1;
    linkCount[l.target as string] = (linkCount[l.target as string] || 0) + 1;
  });
  nodes.forEach((n) => { n.__linkCount = linkCount[n.id] || 0; n.__rand = Math.random(); });
  return { nodes, links: DUMMY_LINKS };
};

// ── 글로우 텍스처 ──
const createGlowTexture = (): THREE.Texture => {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size; canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const half = size / 2;
  const g = ctx.createRadialGradient(half, half, 0, half, half, half);
  g.addColorStop(0,    'rgba(255,255,255,1)');
  g.addColorStop(0.15, 'rgba(255,255,255,0.8)');
  g.addColorStop(0.4,  'rgba(255,255,255,0.15)');
  g.addColorStop(1,    'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
};
let _glowTex: THREE.Texture | null = null;
const getGlowTexture = () => { if (!_glowTex) _glowTex = createGlowTexture(); return _glowTex; };

// ── 노드 색상 ──
const getNodeColor = (type: string, rand: number): THREE.Color => {
  if (type === 'recruitment') {
    // 금색 (채용공고)
    return new THREE.Color(1.0, 0.75 + rand * 0.1, rand * 0.08);
  }
  if (type === 'project') {
    // 하늘색 (프로젝트)
    return new THREE.Color(0.4 + rand * 0.1, 0.85 + rand * 0.1, 1.0);
  }
  // 백색 (user, skill, role)
  const b = 0.85 + rand * 0.15;
  return new THREE.Color(b, b, b);
};

// ── 항상 밝게 유지할 타입 ──
const isAlwaysBright = (type: string) => type === 'project' || type === 'recruitment';

const defaultOpacity = (links: number) => Math.min(0.55 + links * 0.04, 1);

// ── Wave 파라미터 ──
const WAVE_INTERVAL = 280;
const FADE_DURATION = 1200;

const Neo4jGraphGalaxy = () => {
  const [graphData, setGraphData] = useState<GraphData>(() =>
    import.meta.env.DEV ? buildDummyData() : { nodes: [], links: [] }
  );
  const [search, setSearch]       = useState('');
  const [hoverNode, setHoverNode] = useState<GraphNode | null>(null);

  const graphRef       = useRef<any>(null);
  const animRef        = useRef<number>(0);
  const waveStartRef   = useRef<number>(0);

  const nodeMatMap     = useRef<Map<string, THREE.SpriteMaterial>>(new Map());
  const nodeTypeMap    = useRef<Map<string, string>>(new Map());
  const nodeLinkCntMap = useRef<Map<string, number>>(new Map());
  const linkEntries    = useRef<Array<{ link: any; mat: THREE.LineBasicMaterial }>>([]);

  // ── API fetch ──
  useEffect(() => {
    api.get('/v1/admin/neo4j/graph')
      .then(({ data }) => {
        const linkCount: Record<string, number> = {};
        data.links.forEach((l: GraphLink) => {
          linkCount[l.source] = (linkCount[l.source] || 0) + 1;
          linkCount[l.target] = (linkCount[l.target] || 0) + 1;
        });
        data.nodes.forEach((n: GraphNode) => { n.__linkCount = linkCount[n.id] || 0; n.__rand = Math.random(); });
        setGraphData(data);
      })
      .catch(() => {});
  }, []);

  // graphData 변경 시 캐시 초기화
  useEffect(() => {
    nodeMatMap.current.clear();
    nodeTypeMap.current.clear();
    nodeLinkCntMap.current.clear();
    linkEntries.current = [];
  }, [graphData]);

  // ── 검색 ──
  const highlightIds = useMemo(() => {
    if (!search.trim()) return null;
    const q = search.toLowerCase();
    const set = new Set<string>();
    graphData.nodes.forEach((n) => { if (n.label.toLowerCase().includes(q)) set.add(n.id); });
    return set.size > 0 ? set : null;
  }, [search, graphData.nodes]);

  useEffect(() => {
    if (hoverNode) return;
    nodeMatMap.current.forEach((mat, id) => {
      const links = nodeLinkCntMap.current.get(id) || 0;
      mat.opacity = highlightIds
        ? (highlightIds.has(id) ? defaultOpacity(links) : 0.04)
        : defaultOpacity(links);
    });
  }, [highlightIds, hoverNode]);

  // ── Sprite 노드 생성 ──
  const createStarSprite = useCallback((node: any) => {
    const rand  = node.__rand ?? Math.random();
    const links = node.__linkCount || 0;

    nodeLinkCntMap.current.set(node.id, links);
    nodeTypeMap.current.set(node.id, node.type);

    const baseScale = node.type === 'user' ? 8 : node.type === 'project' ? 7 : node.type === 'recruitment' ? 5 : 4;
    const scale     = baseScale + Math.min(links * 0.5, 12);

    const mat = new THREE.SpriteMaterial({
      map: getGlowTexture(),
      color: getNodeColor(node.type, rand),
      transparent: true,
      opacity: defaultOpacity(links),
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    nodeMatMap.current.set(node.id, mat);
    const sprite = new THREE.Sprite(mat);
    sprite.scale.set(scale, scale, 1);
    return sprite;
  }, []);

  // ── Link 객체 생성 ──
  const createLinkObject = useCallback((link: any) => {
    const mat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.2 });
    linkEntries.current.push({ link, mat });
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0, 1, 1, 1], 3));
    return new THREE.Line(geo, mat);
  }, []);

  const updateLinkPosition = useCallback((lineObj: any, coords: { start: any; end: any }) => {
    const { start, end } = coords;
    const pos = lineObj.geometry.attributes.position.array as Float32Array;
    pos[0] = start.x; pos[1] = start.y; pos[2] = start.z;
    pos[3] = end.x;   pos[4] = end.y;   pos[5] = end.z;
    lineObj.geometry.attributes.position.needsUpdate = true;
    return true;
  }, []);

  // ── 노드 클릭 ──
  const handleNodeClick = useCallback((node: any) => {
    if (!graphRef.current) return;
    const ratio = 1 + 50 / Math.hypot(node.x, node.y, node.z);
    graphRef.current.cameraPosition(
      { x: node.x * ratio, y: node.y * ratio, z: node.z * ratio }, node, 2000,
    );
  }, []);

  // ── Wave propagation 애니메이션 ──
  useEffect(() => {
    cancelAnimationFrame(animRef.current);

    if (!hoverNode) {
      nodeMatMap.current.forEach((mat, id) => {
        const links = nodeLinkCntMap.current.get(id) || 0;
        mat.opacity = highlightIds
          ? (highlightIds.has(id) ? defaultOpacity(links) : 0.04)
          : defaultOpacity(links);
      });
      linkEntries.current.forEach(({ mat }) => { mat.opacity = 0.2; });
      return;
    }

    // BFS
    const distMap = new Map<string, number>();
    distMap.set(hoverNode.id, 0);
    const queue: string[] = [hoverNode.id];
    while (queue.length > 0) {
      const curr = queue.shift()!;
      const d    = distMap.get(curr)!;
      graphData.links.forEach((l) => {
        const s = typeof l.source === 'object' ? l.source.id : l.source;
        const t = typeof l.target === 'object' ? l.target.id : l.target;
        if (s === curr && !distMap.has(t)) { distMap.set(t, d + 1); queue.push(t); }
        if (t === curr && !distMap.has(s)) { distMap.set(s, d + 1); queue.push(s); }
      });
    }

    waveStartRef.current = performance.now();

    const tick = () => {
      const elapsed = performance.now() - waveStartRef.current;

      nodeMatMap.current.forEach((mat, nodeId) => {
        const type   = nodeTypeMap.current.get(nodeId) ?? '';
        const always = isAlwaysBright(type);
        const dist   = distMap.get(nodeId);

        if (dist === undefined) {
          if (always) {
            const links = nodeLinkCntMap.current.get(nodeId) || 0;
            const t = Math.min(elapsed / (FADE_DURATION * 2), 1);
            mat.opacity = 0.02 + (defaultOpacity(links) - 0.02) * t;
          } else {
            mat.opacity = 0.02;
          }
          return;
        }

        const arrival = dist * WAVE_INTERVAL;
        if (elapsed < arrival) {
          mat.opacity = 0.02;
        } else {
          const t      = Math.min((elapsed - arrival) / FADE_DURATION, 1);
          const links  = nodeLinkCntMap.current.get(nodeId) || 0;
          const target = always
            ? defaultOpacity(links)
            : dist === 0 ? 1.0 : dist === 1 ? 0.85 : dist === 2 ? 0.5 : 0.25;
          mat.opacity = 0.02 + (target - 0.02) * t;
        }
      });

      linkEntries.current.forEach(({ link, mat }) => {
        const s  = typeof link.source === 'object' ? link.source.id : link.source;
        const t  = typeof link.target === 'object' ? link.target.id : link.target;
        const ds = distMap.get(s);
        const dt = distMap.get(t);
        if (ds === undefined || dt === undefined) { mat.opacity = 0.02; return; }
        const maxDist = Math.max(ds, dt);
        const arrival = maxDist * WAVE_INTERVAL;
        if (elapsed < arrival) {
          mat.opacity = 0.02;
        } else {
          const t2     = Math.min((elapsed - arrival) / FADE_DURATION, 1);
          const target = maxDist === 0 ? 0.9 : maxDist === 1 ? 0.75 : maxDist === 2 ? 0.4 : 0.15;
          mat.opacity  = 0.02 + (target - 0.02) * t2;
        }
      });

      animRef.current = requestAnimationFrame(tick);
    };

    animRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animRef.current);
  }, [hoverNode, graphData.links, highlightIds]);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black">

      {/* 검색바 */}
      <div className="absolute top-5 left-5 z-10">
        <div className="flex items-center bg-[#111] border border-white/10 rounded-md overflow-hidden">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="enter a search term"
            className="bg-transparent text-white/80 text-xs font-mono px-3 py-2 w-56 outline-none placeholder:text-white/25"
          />
          <button className="px-3 py-2 bg-white/10 hover:bg-white/20 transition-colors">
            <svg className="w-3.5 h-3.5 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
        </div>
      </div>

      {/* 호버 정보 */}
      {hoverNode && (
        <div className="absolute bottom-8 right-8 z-10">
          <div className="text-right">
            <div className="text-white font-mono text-sm font-bold">{hoverNode.label}</div>
            <div className="text-white/30 font-mono text-[10px] uppercase tracking-wider">
              {hoverNode.type} &middot; {hoverNode.__linkCount || 0} links
            </div>
          </div>
        </div>
      )}

      <ForceGraph3D
        ref={graphRef}
        graphData={graphData}
        nodeThreeObject={createStarSprite}
        nodeThreeObjectExtend={false}
        nodeLabel={() => ''}
        onNodeHover={(node: any) => setHoverNode(node || null)}
        onNodeClick={handleNodeClick}
        linkThreeObject={createLinkObject}
        linkPositionUpdate={updateLinkPosition}
        linkThreeObjectExtend={false}
        backgroundColor="#000000"
        showNavInfo={false}
        warmupTicks={100}
        cooldownTime={5000}
        d3AlphaDecay={0.015}
        d3VelocityDecay={0.25}
      />
    </div>
  );
};

export default Neo4jGraphGalaxy;

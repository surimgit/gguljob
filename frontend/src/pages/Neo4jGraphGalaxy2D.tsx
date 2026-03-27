import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import api from '../api';

interface GraphNode {
  id: string;
  label: string;
  type: 'user' | 'skill' | 'role' | 'project' | 'recruitment';
  size: number;
  x?: number;
  y?: number;
  __linkCount?: number;
  __rand?: number;
}

interface GraphLink { source: any; target: any; label: string; __opacity?: number; }
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
  return { nodes, links: DUMMY_LINKS.map(l => ({ ...l, __opacity: 0.2 })) };
};

// ── 노드 색상 RGB (3D getNodeColor와 동일한 값) ──
const getNodeColorRGB = (type: string, rand: number): [number, number, number] => {
  if (type === 'recruitment') {
    return [255, Math.round(191 + rand * 25), Math.round(rand * 20)];
  }
  if (type === 'project') {
    // THREE.Color(0.4 + rand * 0.1, 0.85 + rand * 0.1, 1.0)
    return [Math.round((0.4 + rand * 0.1) * 255), Math.round((0.85 + rand * 0.1) * 255), 255];
  }
  // THREE.Color(b, b, b) where b = 0.85 + rand * 0.15
  const b = Math.round((0.85 + rand * 0.15) * 255);
  return [b, b, b];
};

// ── 항상 밝게 유지할 타입 ──
const isAlwaysBright = (type: string) => type === 'project' || type === 'recruitment';

const defaultOpacity = (links: number) => Math.min(0.55 + links * 0.04, 1);

// ── Wave 파라미터 ──
const WAVE_INTERVAL = 280;
const FADE_DURATION = 1200;

const Neo4jGraphGalaxy2D = () => {
  const [graphData, setGraphData] = useState<GraphData>(() =>
    import.meta.env.DEV ? buildDummyData() : { nodes: [], links: [] }
  );
  const [search, setSearch]       = useState('');
  const [hoverNode, setHoverNode] = useState<GraphNode | null>(null);

  const graphRef     = useRef<any>(null);
  const animRef      = useRef<number>(0);
  const waveStartRef = useRef<number>(0);

  const nodeOpacityMap  = useRef<Map<string, number>>(new Map());
  const nodeLinkCntMap  = useRef<Map<string, number>>(new Map());
  const nodeTypeMap     = useRef<Map<string, string>>(new Map());

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
        setGraphData({ nodes: data.nodes, links: data.links.map((l: GraphLink) => ({ ...l, __opacity: 0.2 })) });
      })
      .catch(() => {});
  }, []);

  // graphData 변경 시 캐시 초기화
  useEffect(() => {
    nodeOpacityMap.current.clear();
    nodeLinkCntMap.current.clear();
    nodeTypeMap.current.clear();
    graphData.nodes.forEach((n) => {
      nodeOpacityMap.current.set(n.id, defaultOpacity(n.__linkCount || 0));
      nodeLinkCntMap.current.set(n.id, n.__linkCount || 0);
      nodeTypeMap.current.set(n.id, n.type);
    });
    graphData.links.forEach((l) => { l.__opacity = 0.2; });
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
    nodeOpacityMap.current.forEach((_, id) => {
      const links = nodeLinkCntMap.current.get(id) || 0;
      nodeOpacityMap.current.set(id, highlightIds
        ? (highlightIds.has(id) ? defaultOpacity(links) : 0.04)
        : defaultOpacity(links));
    });
    graphData.links.forEach((l) => { l.__opacity = 0.2; });
  }, [highlightIds, hoverNode, graphData.links]);

  // ── Canvas: 노드 그리기 ──
  const nodeCanvasObject = useCallback((node: any, ctx: CanvasRenderingContext2D) => {
    if (!Number.isFinite(node.x) || !Number.isFinite(node.y)) return;

    const type  = node.type as string;
    const rand  = node.__rand ?? 0.5;
    const links = node.__linkCount || 0;
    const opacity = nodeOpacityMap.current.get(node.id) ?? defaultOpacity(links);

    const [cr, cg, cb] = getNodeColorRGB(type, rand);
    const baseScale = type === 'user' ? 8 : type === 'project' ? 7 : type === 'recruitment' ? 5 : 4;
    const scale     = baseScale + Math.min(links * 0.5, 12);

    // THREE.AdditiveBlending 동일 효과 — 겹치는 노드가 밝아짐
    ctx.globalCompositeOperation = 'lighter';

    const grad = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, scale);
    grad.addColorStop(0,    `rgba(${cr},${cg},${cb},${opacity})`);
    grad.addColorStop(0.15, `rgba(${cr},${cg},${cb},${opacity * 0.8})`);
    grad.addColorStop(0.4,  `rgba(${cr},${cg},${cb},${opacity * 0.15})`);
    grad.addColorStop(1,    `rgba(${cr},${cg},${cb},0)`);
    ctx.beginPath();
    ctx.arc(node.x, node.y, scale, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();

    // 다음 draw call에 영향 안 가도록 복구
    ctx.globalCompositeOperation = 'source-over';
  }, []);

  // ── Canvas: 링크 그리기 ──
  const linkCanvasObject = useCallback((link: any, ctx: CanvasRenderingContext2D) => {
    const s = typeof link.source === 'object' ? link.source : { x: 0, y: 0 };
    const t = typeof link.target === 'object' ? link.target : { x: 0, y: 0 };
    if (!Number.isFinite(s.x) || !Number.isFinite(s.y) || !Number.isFinite(t.x) || !Number.isFinite(t.y)) return;
    const opacity = link.__opacity ?? 0.2;

    ctx.beginPath();
    ctx.moveTo(s.x, s.y);
    ctx.lineTo(t.x, t.y);
    ctx.strokeStyle = `rgba(255,255,255,${opacity})`;
    ctx.lineWidth = 0.5;
    ctx.stroke();
  }, []);

  // ── 노드 클릭: 중심 이동 + 줌 ──
  const handleNodeClick = useCallback((node: any) => {
    if (!graphRef.current) return;
    graphRef.current.centerAt(node.x, node.y, 1000);
    graphRef.current.zoom(4, 1000);
  }, []);

  // ── Wave propagation 애니메이션 ──
  useEffect(() => {
    cancelAnimationFrame(animRef.current);

    if (!hoverNode) {
      nodeOpacityMap.current.forEach((_, id) => {
        const links = nodeLinkCntMap.current.get(id) || 0;
        nodeOpacityMap.current.set(id, highlightIds
          ? (highlightIds.has(id) ? defaultOpacity(links) : 0.04)
          : defaultOpacity(links));
      });
      graphData.links.forEach((l) => { l.__opacity = 0.2; });
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

      nodeOpacityMap.current.forEach((_, nodeId) => {
        const type   = nodeTypeMap.current.get(nodeId) ?? '';
        const always = isAlwaysBright(type);
        const dist   = distMap.get(nodeId);

        if (dist === undefined) {
          if (always) {
            const links = nodeLinkCntMap.current.get(nodeId) || 0;
            const fade  = Math.min(elapsed / (FADE_DURATION * 2), 1);
            nodeOpacityMap.current.set(nodeId, 0.02 + (defaultOpacity(links) - 0.02) * fade);
          } else {
            nodeOpacityMap.current.set(nodeId, 0.02);
          }
          return;
        }

        const arrival = dist * WAVE_INTERVAL;
        if (elapsed < arrival) {
          nodeOpacityMap.current.set(nodeId, 0.02);
        } else {
          const fade   = Math.min((elapsed - arrival) / FADE_DURATION, 1);
          const links  = nodeLinkCntMap.current.get(nodeId) || 0;
          const target = always
            ? defaultOpacity(links)
            : dist === 0 ? 1.0 : dist === 1 ? 0.85 : dist === 2 ? 0.5 : 0.25;
          nodeOpacityMap.current.set(nodeId, 0.02 + (target - 0.02) * fade);
        }
      });

      graphData.links.forEach((link) => {
        const s  = typeof link.source === 'object' ? link.source.id : link.source;
        const t  = typeof link.target === 'object' ? link.target.id : link.target;
        const ds = distMap.get(s);
        const dt = distMap.get(t);
        if (ds === undefined || dt === undefined) { link.__opacity = 0.02; return; }
        const maxDist = Math.max(ds, dt);
        const arrival = maxDist * WAVE_INTERVAL;
        if (elapsed < arrival) {
          link.__opacity = 0.02;
        } else {
          const fade   = Math.min((elapsed - arrival) / FADE_DURATION, 1);
          const target = maxDist === 0 ? 0.9 : maxDist === 1 ? 0.75 : maxDist === 2 ? 0.4 : 0.15;
          link.__opacity = 0.02 + (target - 0.02) * fade;
        }
      });

      animRef.current = requestAnimationFrame(tick);
    };

    animRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animRef.current);
  }, [hoverNode, graphData.links, graphData.nodes, highlightIds]);

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

      <ForceGraph2D
        ref={graphRef}
        graphData={graphData}
        nodeCanvasObject={nodeCanvasObject}
        nodeCanvasObjectMode={() => 'replace'}
        nodeLabel={() => ''}
        onNodeHover={(node: any) => setHoverNode(node || null)}
        onNodeClick={handleNodeClick}
        linkCanvasObject={linkCanvasObject}
        linkCanvasObjectMode={() => 'replace'}
        backgroundColor="#000000"
        autoPauseRedraw={false}
        warmupTicks={100}
        cooldownTime={5000}
        d3AlphaDecay={0.015}
        d3VelocityDecay={0.25}
      />
    </div>
  );
};

export default Neo4jGraphGalaxy2D;

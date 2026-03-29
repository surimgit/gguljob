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

// ── 1번 유저 ID (로그인 유저) ──
const MY_USER_ID = 'user-1';

// ── 노드 색상 (유저=흰색, 프로젝트=하늘색, 채용공고=노란색, 1번유저=금색) ──
const getNodeColor = (node: GraphNode): THREE.Color => {
  const rand = node.__rand ?? 0;
  if (node.type === 'project') {
    // 하늘색 (프로젝트)
    return new THREE.Color(0.3 + rand * 0.1, 0.7 + rand * 0.1, 1.0);
  }
  if (node.type === 'recruitment') {
    // 노란색 (채용공고) - 기본부터 밝게, 연결 많으면 더 밝게
    const links = node.__linkCount ?? 0;
    const brightness = Math.min(0.85 + links * 0.03, 1.0);
    return new THREE.Color(brightness, brightness * 0.82, 0.08);
  }
  if (node.type === 'user' && node.id === MY_USER_ID) {
    // 1번 유저: 밝은 금색으로 눈에 띄게
    return new THREE.Color(1.0, 0.85, 0.2);
  }
  if (node.type === 'skill' || node.type === 'role') {
    // skill, role: 어둡게
    const b = 0.35 + rand * 0.1;
    return new THREE.Color(b, b, b);
  }
  // 유저: 중간 밝기
  const b = 0.55 + rand * 0.1;
  return new THREE.Color(b, b, b);
};

// ── 항상 밝게 유지할 타입 ──
const isAlwaysBright = (type: string) => type === 'project' || type === 'recruitment';

const defaultOpacity = (links: number, type?: string) => {
  if (type === 'recruitment') return Math.min(0.75 + links * 0.04, 1);
  if (type === 'skill' || type === 'role') return Math.min(0.2 + links * 0.03, 0.5);
  return Math.min(0.45 + links * 0.04, 0.85);
};

// ── Wave 파라미터 ──
// 각 hop: 노드 fade → 링크 fade → 다음 hop
const NODE_FADE = 800;       // 노드가 밝아지는 시간
const LINK_FADE = 800;       // 링크가 자라나는 시간
const HOP_DURATION = NODE_FADE + LINK_FADE; // 한 hop 전체 시간

const Neo4jGraphGalaxy5 = () => {
  const [graphData, setGraphData] = useState<GraphData>({ nodes: [], links: [] });
  const [search, setSearch]       = useState('');
  const [hoverNode, setHoverNode] = useState<GraphNode | null>(null);
  const [legendHover, setLegendHover] = useState<string | null>(null);

  const graphRef       = useRef<any>(null);
  const animRef        = useRef<number>(0);
  const waveStartRef   = useRef<number>(0);

  const nodeMatMap     = useRef<Map<string, THREE.SpriteMaterial>>(new Map());
  const nodeSpriteMap  = useRef<Map<string, { sprite: THREE.Sprite; baseScale: number }>>(new Map());
  const nodeTypeMap    = useRef<Map<string, string>>(new Map());
  const nodeLinkCntMap = useRef<Map<string, number>>(new Map());
  const linkEntries    = useRef<Array<{ link: any; mat: THREE.LineBasicMaterial; geo: THREE.BufferGeometry }>>([]);

  // ── API fetch ──
  useEffect(() => {
    api.get('/v1/admin/neo4j/graph')
      .then(({ data }) => {
        const allNodes: GraphNode[] = data.nodes;
        const allLinks: GraphLink[] = data.links;

        // user-1과 연결된 노드들만 BFS로 수집 (다른 유저 노드 경유 차단)
        const connectedIds = new Set<string>([MY_USER_ID]);
        const queue = [MY_USER_ID];
        while (queue.length > 0) {
          const curr = queue.shift()!;
          allLinks.forEach((l) => {
            const s = l.source as string;
            const t = l.target as string;
            const tryAdd = (from: string, to: string) => {
              if (from !== curr || connectedIds.has(to)) return;
              const toNode = allNodes.find((n) => n.id === to);
              if (toNode?.type === 'user' && to !== MY_USER_ID) return;
              connectedIds.add(to);
              queue.push(to);
            };
            tryAdd(s, t);
            tryAdd(t, s);
          });
        }

        const nodes = allNodes.filter((n) => connectedIds.has(n.id));
        const nodeIdSet = new Set(nodes.map((n) => n.id));
        const links = allLinks.filter((l) => nodeIdSet.has(l.source as string) && nodeIdSet.has(l.target as string));

        const linkCount: Record<string, number> = {};
        links.forEach((l: GraphLink) => {
          linkCount[l.source as string] = (linkCount[l.source as string] || 0) + 1;
          linkCount[l.target as string] = (linkCount[l.target as string] || 0) + 1;
        });
        nodes.forEach((n: GraphNode) => { n.__linkCount = linkCount[n.id] || 0; n.__rand = Math.random(); });
        setGraphData({ nodes, links });
      })
      .catch(() => {});
  }, []);

  // graphData 변경 시 캐시 초기화 + d3 force 조정
  useEffect(() => {
    nodeMatMap.current.clear();
    nodeSpriteMap.current.clear();
    nodeTypeMap.current.clear();
    nodeLinkCntMap.current.clear();
    linkEntries.current = [];

    // 노드들이 더 가까이 뭉치도록 force 조정
    if (graphRef.current) {
      graphRef.current.d3Force('charge')?.strength(-20);
      graphRef.current.d3Force('link')?.distance(25);
    }
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
      const type = nodeTypeMap.current.get(id) ?? '';

      if (legendHover) {
        // 범례 hover: 해당 타입만 밝게, 나머지 어둡게
        const legendType = legendHover === 'me' ? 'user' : legendHover;
        const isMatch = legendHover === 'me'
          ? (id === MY_USER_ID)
          : (type === legendType && !(type === 'user' && id === MY_USER_ID));
        mat.opacity = isMatch ? Math.max(defaultOpacity(links, type), 0.8) : 0.04;
      } else if (highlightIds) {
        mat.opacity = highlightIds.has(id) ? defaultOpacity(links, type) : 0.04;
      } else {
        mat.opacity = defaultOpacity(links, type);
      }
    });

    linkEntries.current.forEach(({ link, mat }) => {
      if (legendHover) {
        const s = typeof link.source === 'object' ? link.source.id : link.source;
        const t = typeof link.target === 'object' ? link.target.id : link.target;
        const sType = nodeTypeMap.current.get(s) ?? '';
        const tType = nodeTypeMap.current.get(t) ?? '';
        const legendType = legendHover === 'me' ? 'user' : legendHover;
        const sMatch = legendHover === 'me' ? s === MY_USER_ID : (sType === legendType && !(sType === 'user' && s === MY_USER_ID));
        const tMatch = legendHover === 'me' ? t === MY_USER_ID : (tType === legendType && !(tType === 'user' && t === MY_USER_ID));
        mat.opacity = (sMatch || tMatch) ? 0.5 : 0.02;
      } else {
        mat.opacity = 0.2;
      }
    });
  }, [highlightIds, hoverNode, legendHover]);

  // ── Sprite 노드 생성 ──
  const createStarSprite = useCallback((node: any) => {
    const links = node.__linkCount || 0;

    nodeLinkCntMap.current.set(node.id, links);
    nodeTypeMap.current.set(node.id, node.type);

    // 1번 유저는 더 크게
    const isMyUser = node.id === MY_USER_ID;
    const baseScale = isMyUser ? 14
      : node.type === 'user' ? 8
      : node.type === 'project' ? 7
      : node.type === 'recruitment' ? 7
      : 4;
    const scale = baseScale + Math.min(links * 0.5, 12);

    const mat = new THREE.SpriteMaterial({
      map: getGlowTexture(),
      color: getNodeColor(node),
      transparent: true,
      opacity: isMyUser ? 1.0 : defaultOpacity(links, node.type),
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    nodeMatMap.current.set(node.id, mat);
    const sprite = new THREE.Sprite(mat);
    sprite.scale.set(scale, scale, 1);
    nodeSpriteMap.current.set(node.id, { sprite, baseScale: scale });
    return sprite;
  }, []);

  // ── Link 객체 생성 ──
  const createLinkObject = useCallback((link: any) => {
    const mat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.12 });
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0, 1, 1, 1], 3));
    linkEntries.current.push({ link, mat, geo });
    return new THREE.Line(geo, mat);
  }, []);

  const updateLinkPosition = useCallback((lineObj: any, coords: { start: any; end: any }) => {
    // wave 애니메이션 중에는 tick에서 geometry를 직접 제어하므로 여기서 건드리지 않음
    if (hoverNode) return true;
    const { start, end } = coords;
    const pos = lineObj.geometry.attributes.position.array as Float32Array;
    pos[0] = start.x; pos[1] = start.y; pos[2] = start.z;
    pos[3] = end.x;   pos[4] = end.y;   pos[5] = end.z;
    lineObj.geometry.attributes.position.needsUpdate = true;
    return true;
  }, [hoverNode]);

  // ── 노드 클릭 ──
  const handleNodeClick = useCallback((node: any) => {
    if (!graphRef.current) return;
    const ratio = 1 + 50 / Math.hypot(node.x, node.y, node.z);
    graphRef.current.cameraPosition(
      { x: node.x * ratio, y: node.y * ratio, z: node.z * ratio }, node, 2000,
    );
  }, []);

  // ── Wave propagation 애니메이션 (수정: 다른 유저 노드로 안 퍼짐) ──
  useEffect(() => {
    cancelAnimationFrame(animRef.current);

    if (!hoverNode) {
      // 범례 hover가 활성화되어 있으면 그쪽에서 처리하므로 여기서는 건드리지 않음
      if (legendHover) return;
      nodeMatMap.current.forEach((mat, id) => {
        const links = nodeLinkCntMap.current.get(id) || 0;
        // scale 복구
        const spriteData = nodeSpriteMap.current.get(id);
        if (spriteData) {
          const s = spriteData.baseScale;
          spriteData.sprite.scale.set(s, s, 1);
        }
        // 1번 유저는 항상 밝게
        if (id === MY_USER_ID) { mat.opacity = 1.0; return; }
        const type = nodeTypeMap.current.get(id) ?? '';
        mat.opacity = highlightIds
          ? (highlightIds.has(id) ? defaultOpacity(links, type) : 0.04)
          : defaultOpacity(links, type);
      });
      linkEntries.current.forEach(({ mat }) => { mat.opacity = 0.08; });
      return;
    }

    // BFS (수정: 다른 유저 노드를 경유하지 않음)
    const distMap = new Map<string, number>();
    distMap.set(hoverNode.id, 0);
    const queue: string[] = [hoverNode.id];
    while (queue.length > 0) {
      const curr = queue.shift()!;
      const d    = distMap.get(curr)!;

      graphData.links.forEach((l) => {
        const s = typeof l.source === 'object' ? l.source.id : l.source;
        const t = typeof l.target === 'object' ? l.target.id : l.target;

        const tryVisit = (from: string, to: string) => {
          if (from !== curr || distMap.has(to)) return;
          const toType = nodeTypeMap.current.get(to) ?? '';
          // 다른 유저 노드로는 퍼지지 않음 (호버 노드 자체가 유저면 첫 단계만 허용)
          if (toType === 'user' && to !== hoverNode.id) return;
          distMap.set(to, d + 1);
          queue.push(to);
        };

        tryVisit(s, t);
        tryVisit(t, s);
      });
    }

    // hover 노드와 각 recruitment 노드 사이 공유 중간노드(skill/role) 수 계산
    const hoverNeighbors = new Set<string>();
    graphData.links.forEach((l) => {
      const s = typeof l.source === 'object' ? l.source.id : l.source;
      const t = typeof l.target === 'object' ? l.target.id : l.target;
      if (s === hoverNode.id) hoverNeighbors.add(t);
      if (t === hoverNode.id) hoverNeighbors.add(s);
    });

    const jobSharedCount = new Map<string, number>();
    graphData.nodes.forEach((n) => {
      if (n.type !== 'recruitment') return;
      let shared = 0;
      graphData.links.forEach((l) => {
        const s = typeof l.source === 'object' ? l.source.id : l.source;
        const t = typeof l.target === 'object' ? l.target.id : l.target;
        const neighbor = s === n.id ? t : t === n.id ? s : null;
        if (neighbor && hoverNeighbors.has(neighbor)) shared++;
      });
      jobSharedCount.set(n.id, shared);
    });

    waveStartRef.current = performance.now();

    // 타이밍: hop 0 노드(즉시) → hop 0→1 링크(NODE_FADE 후) → hop 1 노드(HOP_DURATION 후) → hop 1→2 링크 → ...
    // 노드 dist=d 도착: d * HOP_DURATION
    // 링크 maxDist=d 도착: (d-1) * HOP_DURATION + NODE_FADE  (즉, 출발 노드 밝아진 후)

    const tick = () => {
      const elapsed = performance.now() - waveStartRef.current;

      nodeMatMap.current.forEach((mat, nodeId) => {
        const dist = distMap.get(nodeId);
        const spriteData = nodeSpriteMap.current.get(nodeId);

        if (dist === undefined) {
          mat.opacity = 0;
          if (spriteData) spriteData.sprite.scale.setScalar(0);
          return;
        }
        if (dist === 0) {
          mat.opacity = 1.0;
          if (spriteData) {
            const s = spriteData.baseScale;
            spriteData.sprite.scale.set(s, s, 1);
          }
          return;
        }

        const nodeArrival = dist * HOP_DURATION;
        if (elapsed < nodeArrival) {
          mat.opacity = 0;
          if (spriteData) spriteData.sprite.scale.setScalar(0);
        } else {
          const t      = Math.min((elapsed - nodeArrival) / NODE_FADE, 1);
          const type   = nodeTypeMap.current.get(nodeId) ?? '';
          const links  = nodeLinkCntMap.current.get(nodeId) || 0;
          const always = isAlwaysBright(type);

          let target: number;
          if (type === 'recruitment') {
            // hover 노드와 공유 링크 많을수록 밝게
            const shared = jobSharedCount.get(nodeId) || 0;
            target = Math.min(0.6 + shared * 0.12, 1.0);
          } else if (always) {
            target = defaultOpacity(links, type);
          } else {
            if (type === 'skill' || type === 'role') {
              target = dist === 1 ? 0.3 : dist === 2 ? 0.15 : 0.08;
            } else {
              target = dist === 1 ? 0.75 : dist === 2 ? 0.4 : 0.2;
            }
          }
          mat.opacity = target * t;

          // scale: 0 → baseScale with overshoot (퐁 효과)
          if (spriteData) {
            const s = spriteData.baseScale;
            const eased = t < 0.6
              ? (t / 0.6) * 1.15    // 0→1.15 (살짝 커짐)
              : 1.15 - 0.15 * ((t - 0.6) / 0.4); // 1.15→1.0 (원래 크기로)
            const finalScale = s * eased;
            spriteData.sprite.scale.set(finalScale, finalScale, 1);
          }
        }
      });

      linkEntries.current.forEach(({ link, mat, geo }) => {
        const sId = typeof link.source === 'object' ? link.source.id : link.source;
        const tId = typeof link.target === 'object' ? link.target.id : link.target;
        const ds = distMap.get(sId);
        const dt = distMap.get(tId);
        if (ds === undefined || dt === undefined) { mat.opacity = 0; return; }

        // 출발 노드(dist 작은 쪽)에서 도착 노드로 선이 자라남
        const srcObj = ds <= dt ? link.source : link.target;
        const dstObj = ds <= dt ? link.target : link.source;
        const minDist = Math.min(ds, dt);

        const linkArrival = minDist * HOP_DURATION + NODE_FADE;
        if (elapsed < linkArrival) {
          mat.opacity = 0;
        } else {
          const progress = Math.min((elapsed - linkArrival) / LINK_FADE, 1);
          const target = 0.08;
          mat.opacity = target * progress;

          // 선이 출발점에서 도착점까지 자라남
          const sx = srcObj.x ?? 0, sy = srcObj.y ?? 0, sz = srcObj.z ?? 0;
          const dx = dstObj.x ?? 0, dy = dstObj.y ?? 0, dz = dstObj.z ?? 0;
          const pos = geo.attributes.position.array as Float32Array;
          pos[0] = sx; pos[1] = sy; pos[2] = sz;
          pos[3] = sx + (dx - sx) * progress;
          pos[4] = sy + (dy - sy) * progress;
          pos[5] = sz + (dz - sz) * progress;
          geo.attributes.position.needsUpdate = true;
        }
      });

      animRef.current = requestAnimationFrame(tick);
    };

    animRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animRef.current);
  }, [hoverNode, graphData.links, highlightIds, legendHover]);

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

      {/* 범례 */}
      <div className="absolute top-5 right-5 z-10 flex flex-col gap-1.5" onMouseLeave={() => setLegendHover(null)}>
        {[
          { color: '#FFD933', label: 'Me', hoverKey: 'me' },
          { color: '#5BB8FF', label: 'Project', hoverKey: 'project' },
          { color: '#D4AA00', label: 'Job', hoverKey: 'recruitment' },
          { color: '#DDDDDD', label: 'Skill', hoverKey: 'skill' },
          { color: '#DDDDDD', label: 'Role', hoverKey: 'role' },
        ].map(({ color, label, hoverKey }) => (
          <div
            key={label}
            className="flex items-center gap-2 cursor-pointer px-2 py-0.5 rounded transition-colors hover:bg-white/10"
            onMouseEnter={() => setLegendHover(hoverKey)}
          >
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color, boxShadow: `0 0 6px ${color}` }} />
            <span className={`font-mono text-[10px] uppercase tracking-wider transition-colors ${legendHover === hoverKey ? 'text-white' : 'text-white/50'}`}>{label}</span>
          </div>
        ))}
      </div>

      {/* 호버 정보 */}
      {hoverNode && (
        <div className="absolute bottom-8 right-8 z-10">
          <div className="text-right">
            <div className="text-white text-sm font-bold">{hoverNode.label}</div>
            <div className="text-white/30 font-mono text-[10px] uppercase tracking-wider">
              {{ user: hoverNode.id === MY_USER_ID ? 'me' : 'user', project: 'project', recruitment: 'job', skill: 'skill', role: 'role' }[hoverNode.type]} &middot; {hoverNode.__linkCount || 0} links
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
        warmupTicks={200}
        cooldownTime={8000}
        d3AlphaDecay={0.01}
        d3VelocityDecay={0.3}
      />
    </div>
  );
};

export default Neo4jGraphGalaxy5;

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

// ── 노드 색상 (전부 흰색, user-1만 시안, top10 job 진한 노란색) ──
const getNodeColor = (node: GraphNode, top10JobIds: Set<string>): THREE.Color => {
  if (node.type === 'user' && node.id === MY_USER_ID) {
    return new THREE.Color(0.0, 1.0, 0.9); // 시안
  }
  if (node.type === 'recruitment' && top10JobIds.has(node.id)) {
    return new THREE.Color(1.0, 0.75, 0.0); // 진한 노란색 (amber)
  }
  return new THREE.Color(0.85, 0.85, 0.85); // 흰색
};

// ── 항상 밝게 유지할 타입 ──
const isAlwaysBright = (_type: string) => false;

const DEFAULT_OPACITY = 0.5;
const defaultOpacity = (_links: number, _type?: string) => DEFAULT_OPACITY;

// ── Wave 파라미터 ──
const NODE_FADE = 800;
const LINK_FADE = 800;
const HOP_DURATION = NODE_FADE + LINK_FADE;

const Neo4jGraphWhite2 = () => {
  const [graphData, setGraphData] = useState<GraphData>({ nodes: [], links: [] });
  const [top10JobIds, setTop10JobIds] = useState<Set<string>>(new Set());
  const search = '';
  const [hoverNode, setHoverNode] = useState<GraphNode | null>(null);
  const [legendHover, setLegendHover] = useState<string | null>(null);

  const graphRef       = useRef<any>(null);
  const animRef        = useRef<number>(0);
  const waveStartRef   = useRef<number>(0);
  const angleRef       = useRef<number>(0);
  const rotateRef      = useRef<number>(0);

  const nodeMatMap     = useRef<Map<string, THREE.SpriteMaterial>>(new Map());
  const nodeSpriteMap  = useRef<Map<string, { sprite: THREE.Sprite; baseScale: number }>>(new Map());
  const nodeTypeMap    = useRef<Map<string, string>>(new Map());
  const nodeLinkCntMap = useRef<Map<string, number>>(new Map());
  const linkEntries    = useRef<Array<{ link: any; mat: THREE.LineBasicMaterial; geo: THREE.BufferGeometry }>>([]);

  // ── 두 API 동시 fetch → 교차 필터링으로 top10 계산 ──
  useEffect(() => {
    Promise.all([
      api.get('/v1/admin/neo4j/graph'),
      api.get('/v1/jobs/all').catch(() => ({ data: [] })),
    ]).then(([graphRes, jobsRes]) => {
      const allNodes: GraphNode[] = graphRes.data.nodes;
      const allLinks: GraphLink[] = graphRes.data.links;

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

      // 그래프에 실제 존재하는 recruitment 노드 중 matchPercentage 높은 순 top10
      const scoreMap = new Map<string, number>();
      jobsRes.data.forEach((j: any) => { scoreMap.set(`job-${j.jobId}`, j.matchPercentage ?? 0); });

      const recruitmentNodes = nodes.filter(n => n.type === 'recruitment');
      const sortedByScore = recruitmentNodes
        .map(n => ({ id: n.id, score: scoreMap.get(n.id) ?? 0 }))
        .sort((a, b) => b.score - a.score);
      setTop10JobIds(new Set<string>(sortedByScore.slice(0, 10).map(x => x.id)));

      setGraphData({ nodes, links });
    }).catch(() => {});
  }, []);

  // ── 자동 회전 ──
  const startRotation = useCallback(() => {
    const dist = 500;
    const rotate = () => {
      if (!graphRef.current) return;
      angleRef.current += 0.0015;
      graphRef.current.cameraPosition({
        x: dist * Math.sin(angleRef.current),
        y: 50,
        z: dist * Math.cos(angleRef.current),
      });
      rotateRef.current = requestAnimationFrame(rotate);
    };
    rotateRef.current = requestAnimationFrame(rotate);
  }, []);

  useEffect(() => {
    if (graphData.nodes.length === 0) return;
    setTimeout(() => startRotation(), 1500);
    return () => cancelAnimationFrame(rotateRef.current);
  }, [graphData, startRotation]);

  useEffect(() => {
    nodeMatMap.current.clear();
    nodeSpriteMap.current.clear();
    nodeTypeMap.current.clear();
    nodeLinkCntMap.current.clear();
    linkEntries.current = [];

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
        const legendType = legendHover === 'me' ? 'user' : legendHover === 'top10' ? 'recruitment' : legendHover;
        const isMatch = legendHover === 'me'
          ? (id === MY_USER_ID)
          : legendHover === 'top10'
            ? (type === 'recruitment' && top10JobIds.has(id))
            : (type === legendType && !(type === 'user' && id === MY_USER_ID));
        mat.opacity = isMatch ? Math.max(defaultOpacity(links, type), 0.9) : 0.04;
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
        const legendType = legendHover === 'me' ? 'user' : legendHover === 'top10' ? 'recruitment' : legendHover;
        const sMatch = legendHover === 'me' ? s === MY_USER_ID
          : legendHover === 'top10' ? (sType === 'recruitment' && top10JobIds.has(s))
          : (sType === legendType && !(sType === 'user' && s === MY_USER_ID));
        const tMatch = legendHover === 'me' ? t === MY_USER_ID
          : legendHover === 'top10' ? (tType === 'recruitment' && top10JobIds.has(t))
          : (tType === legendType && !(tType === 'user' && t === MY_USER_ID));
        mat.opacity = (sMatch || tMatch) ? 0.5 : 0.02;
      } else {
        mat.opacity = 0.2;
      }
    });
  }, [highlightIds, hoverNode, legendHover, top10JobIds]);

  // ── Sprite 노드 생성 ──
  const createStarSprite = useCallback((node: any) => {
    const links = node.__linkCount || 0;

    nodeLinkCntMap.current.set(node.id, links);
    nodeTypeMap.current.set(node.id, node.type);

    const isMyUser = node.id === MY_USER_ID;
    const isTop10 = node.type === 'recruitment' && top10JobIds.has(node.id);
    const baseScale = isMyUser ? 14 : isTop10 ? 9 : 5;
    const scale = baseScale + Math.min(links * 0.3, 6);

    const mat = new THREE.SpriteMaterial({
      map: getGlowTexture(),
      color: getNodeColor(node, top10JobIds),
      transparent: true,
      opacity: isMyUser ? 1.0 : isTop10 ? 0.95 : DEFAULT_OPACITY,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    nodeMatMap.current.set(node.id, mat);
    const sprite = new THREE.Sprite(mat);
    sprite.scale.set(scale, scale, 1);
    nodeSpriteMap.current.set(node.id, { sprite, baseScale: scale });
    return sprite;
  }, [top10JobIds]);

  // ── Link 객체 생성 ──
  const createLinkObject = useCallback((link: any) => {
    const mat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.12 });
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0, 1, 1, 1], 3));
    linkEntries.current.push({ link, mat, geo });
    return new THREE.Line(geo, mat);
  }, []);

  const updateLinkPosition = useCallback((lineObj: any, coords: { start: any; end: any }) => {
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

  // ── Wave propagation 애니메이션 ──
  useEffect(() => {
    cancelAnimationFrame(animRef.current);

    if (!hoverNode) {
      if (legendHover) return;
      nodeMatMap.current.forEach((mat, id) => {
        const links = nodeLinkCntMap.current.get(id) || 0;
        const spriteData = nodeSpriteMap.current.get(id);
        if (spriteData) {
          const s = spriteData.baseScale;
          spriteData.sprite.scale.set(s, s, 1);
        }
        if (id === MY_USER_ID) { mat.opacity = 1.0; return; }
        const isTop10 = nodeTypeMap.current.get(id) === 'recruitment' && top10JobIds.has(id);
        if (isTop10) { mat.opacity = 0.95; return; }
        const type = nodeTypeMap.current.get(id) ?? '';
        mat.opacity = highlightIds
          ? (highlightIds.has(id) ? defaultOpacity(links, type) : 0.04)
          : defaultOpacity(links, type);
      });
      linkEntries.current.forEach(({ mat }) => { mat.opacity = 0.08; });
      return;
    }

    // BFS 2단계 제한 (유저 노드 경유 차단)
    const MAX_DIST = 2;
    const distMap = new Map<string, number>();
    distMap.set(hoverNode.id, 0);
    const queue: string[] = [hoverNode.id];
    while (queue.length > 0) {
      const curr = queue.shift()!;
      const d    = distMap.get(curr)!;
      if (d >= MAX_DIST) continue; // 2단계 이상 확장 차단

      graphData.links.forEach((l) => {
        const s = typeof l.source === 'object' ? l.source.id : l.source;
        const t = typeof l.target === 'object' ? l.target.id : l.target;

        const tryVisit = (from: string, to: string) => {
          if (from !== curr || distMap.has(to)) return;
          const toType = nodeTypeMap.current.get(to) ?? '';
          if (toType === 'user' && to !== hoverNode.id) return;
          distMap.set(to, d + 1);
          queue.push(to);
        };

        tryVisit(s, t);
        tryVisit(t, s);
      });
    }

    waveStartRef.current = performance.now();

    const tick = () => {
      const elapsed = performance.now() - waveStartRef.current;

      nodeMatMap.current.forEach((mat, nodeId) => {
        const dist = distMap.get(nodeId);
        const spriteData = nodeSpriteMap.current.get(nodeId);
        const isTop10 = nodeTypeMap.current.get(nodeId) === 'recruitment' && top10JobIds.has(nodeId);

        // BFS 범위 밖: 완전히 어둡게
        if (dist === undefined) {
          mat.opacity = 0.02;
          if (spriteData) spriteData.sprite.scale.setScalar(spriteData.baseScale * 0.5);
          return;
        }
        // 호버 노드 자신
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
          const t = Math.min((elapsed - nodeArrival) / NODE_FADE, 1);

          // top10 노란 노드: 밝게 / 나머지: 어둡게
          let target: number;
          if (isTop10) {
            target = 1.0; // 노란 노드 팍 밝게
          } else {
            // dist 1: skill/role (중간노드), dist 2: 일반 job 등
            target = dist === 1 ? 0.15 : 0.08;
          }
          mat.opacity = target * t;

          if (spriteData) {
            const s = spriteData.baseScale;
            const eased = t < 0.6
              ? (t / 0.6) * 1.15
              : 1.15 - 0.15 * ((t - 0.6) / 0.4);
            spriteData.sprite.scale.set(s * eased, s * eased, 1);
          }
        }
      });

      linkEntries.current.forEach(({ link, mat, geo }) => {
        const sId = typeof link.source === 'object' ? link.source.id : link.source;
        const tId = typeof link.target === 'object' ? link.target.id : link.target;
        const ds = distMap.get(sId);
        const dt = distMap.get(tId);

        // 두 노드 중 하나라도 BFS 범위 밖이면 안 보임
        if (ds === undefined || dt === undefined) { mat.opacity = 0; return; }

        const srcObj = ds <= dt ? link.source : link.target;
        const dstObj = ds <= dt ? link.target : link.source;
        const minDist = Math.min(ds, dt);

        const linkArrival = minDist * HOP_DURATION + NODE_FADE;
        if (elapsed < linkArrival) {
          mat.opacity = 0;
        } else {
          const progress = Math.min((elapsed - linkArrival) / LINK_FADE, 1);
          mat.opacity = 0.08 * progress;

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
  }, [hoverNode, graphData.links, highlightIds, legendHover, top10JobIds]);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black">

      {/* 범례 */}
      <div className="absolute top-5 right-5 z-10 flex flex-col gap-1.5" onMouseLeave={() => setLegendHover(null)}>
        {[
          { color: '#00FFE5', label: 'Me', hoverKey: 'me' },
          { color: '#FFB800', label: 'Top 10 Job', hoverKey: 'top10' },
          { color: '#DDDDDD', label: 'Node', hoverKey: 'node' },
        ].map(({ color, label, hoverKey }) => (
          <div
            key={label}
            className="flex items-center gap-2 cursor-pointer px-2 py-0.5 rounded transition-colors hover:bg-white/10"
            onMouseEnter={() => setLegendHover(hoverKey)}
          >
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color, boxShadow: `0 0 8px ${color}` }} />
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
        onNodeHover={(node: any) => {
          setHoverNode(node || null);
          if (node) {
            cancelAnimationFrame(rotateRef.current);
          } else {
            startRotation();
          }
        }}
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

export default Neo4jGraphWhite2;
